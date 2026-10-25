import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto"

import { getPrismaClient } from "@/lib/db"
import { sendRegistrationEmailVerificationEmail } from "@/lib/lifecycle-email"

const CODE_TTL_MINUTES = 10
const VERIFIED_TTL_MINUTES = 30
const MAX_ATTEMPTS = 6

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function secret() {
  const value = process.env.AUTH_SECRET
  if (!value) throw new Error("Email verification is not configured.")
  return value
}

function hash(value: string) {
  return createHash("sha256").update(`${secret()}:${value}`).digest("hex")
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

function futureDate(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000)
}

export async function sendRegistrationEmailVerification(email: string) {
  const normalized = normalizeEmail(email)
  const code = String(randomInt(100000, 1000000))
  await getPrismaClient().registrationEmailVerification.updateMany({
    data: { expiresAt: new Date() },
    where: { consumedAt: null, email: normalized, verifiedAt: null },
  })
  const verification = await getPrismaClient().registrationEmailVerification.create({
    data: {
      codeHash: hash(`${normalized}:${code}`),
      email: normalized,
      expiresAt: futureDate(CODE_TTL_MINUTES),
    },
    select: { id: true },
  })
  const status = await sendRegistrationEmailVerificationEmail(normalized, { code }, `registration-email:${verification.id}`)
  if (status !== "sent") {
    await getPrismaClient().registrationEmailVerification.deleteMany({ where: { id: verification.id } })
    throw new Error("The verification email could not be sent. Check the address and try again.")
  }
  return { expiresInMinutes: CODE_TTL_MINUTES }
}

export async function verifyRegistrationEmailCode(email: string, code: string) {
  const normalized = normalizeEmail(email)
  const verification = await getPrismaClient().registrationEmailVerification.findFirst({
    orderBy: { createdAt: "desc" },
    where: { consumedAt: null, email: normalized, expiresAt: { gt: new Date() }, verifiedAt: null },
  })
  if (!verification || verification.attempts >= MAX_ATTEMPTS) return null

  if (!safeEqual(verification.codeHash, hash(`${normalized}:${code}`))) {
    await getPrismaClient().registrationEmailVerification.update({
      data: { attempts: { increment: 1 } },
      where: { id: verification.id },
    })
    return null
  }

  const token = randomBytes(32).toString("base64url")
  await getPrismaClient().registrationEmailVerification.update({
    data: { expiresAt: futureDate(VERIFIED_TTL_MINUTES), tokenHash: hash(token), verifiedAt: new Date() },
    where: { id: verification.id },
  })
  return token
}

export async function issueVerifiedRegistrationToken(email: string) {
  const normalized = normalizeEmail(email)
  const token = randomBytes(32).toString("base64url")
  await getPrismaClient().registrationEmailVerification.create({
    data: {
      codeHash: hash(`${normalized}:resume-link`),
      email: normalized,
      expiresAt: futureDate(VERIFIED_TTL_MINUTES),
      tokenHash: hash(token),
      verifiedAt: new Date(),
    },
  })
  return token
}

export async function validateRegistrationEmailVerification(email: string, token: string) {
  const normalized = normalizeEmail(email)
  if (!token.trim()) return null
  return getPrismaClient().registrationEmailVerification.findFirst({
    select: { id: true },
    where: {
      consumedAt: null,
      email: normalized,
      expiresAt: { gt: new Date() },
      tokenHash: hash(token),
      verifiedAt: { not: null },
    },
  })
}

export async function consumeRegistrationEmailVerification(id: string) {
  await getPrismaClient().registrationEmailVerification.updateMany({
    data: { consumedAt: new Date() },
    where: { consumedAt: null, id },
  })
}
