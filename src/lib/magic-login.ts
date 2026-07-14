import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import { getPrismaClient } from "@/lib/db"
import { sendMagicLoginEmail } from "@/lib/lifecycle-email"
import { findLoginAccessByEmail } from "@/lib/subscriber-access"
import { getAppUrl } from "@/lib/app-url"
import {
  recordOperationalEvent,
  resolveOperationalEventByFingerprint,
} from "@/lib/operational-monitoring"

const MAGIC_LOGIN_TTL_MINUTES = 15
const MAGIC_LOGIN_RESEND_SECONDS = 60

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function safeEquals(a: string, b: string) {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)
  if (aBuffer.length !== bBuffer.length) return false
  return timingSafeEqual(aBuffer, bBuffer)
}

export async function requestMagicLogin(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const subscriber = await findLoginAccessByEmail(normalizedEmail)

  if (!subscriber) {
    return {
      email: normalizedEmail,
      sent: false,
      status: "invalid_subscriber" as const,
    }
  }

  const prisma = getPrismaClient()
  const recentToken = await prisma.magicLoginToken.findFirst({
    select: { id: true },
    where: {
      createdAt: {
        gt: new Date(Date.now() - MAGIC_LOGIN_RESEND_SECONDS * 1000),
      },
      email: normalizedEmail,
    },
  })

  if (recentToken) {
    return {
      email: normalizedEmail,
      sent: true,
      status: "rate_limited" as const,
    }
  }

  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + MAGIC_LOGIN_TTL_MINUTES * 60 * 1000)
  const loginUrl = `${getAppUrl()}/api/auth/magic?token=${encodeURIComponent(token)}`

  await prisma.magicLoginToken.create({
    data: {
      email: normalizedEmail,
      expiresAt,
      tokenHash: hashToken(token),
      userId: subscriber.id,
    },
  })

  const emailStatus = await sendMagicLoginEmail(normalizedEmail, {
    firstName: subscriber.name.split(" ")[0],
    loginUrl,
  })

  if (emailStatus !== "sent") {
    await recordOperationalEvent({
      category: "AUTH",
      fingerprint: "auth:magic-link-delivery",
      message: `A subscriber magic-link email could not be delivered (${emailStatus}).`,
      severity: "CRITICAL",
      source: "magic-login",
      workspaceId: subscriber.workspaceId === "admin" ? null : subscriber.workspaceId,
    })
  } else {
    await resolveOperationalEventByFingerprint("auth:magic-link-delivery")
  }

  return {
    email: normalizedEmail,
    emailStatus,
    sent: emailStatus === "sent",
    status: emailStatus === "sent" ? "sent" as const : "email_failed" as const,
  }
}

async function getMagicLoginSubscriber(token: string, consume: boolean) {
  const tokenHash = hashToken(token)
  const prisma = getPrismaClient()
  const loginToken = await prisma.magicLoginToken.findUnique({
    where: {
      tokenHash,
    },
  })

  if (!loginToken || loginToken.usedAt || loginToken.expiresAt <= new Date()) {
    return null
  }

  if (!safeEquals(loginToken.tokenHash, tokenHash)) {
    return null
  }

  const subscriber = await findLoginAccessByEmail(loginToken.email)

  if (!subscriber) {
    return null
  }

  if (consume) {
    const consumed = await prisma.magicLoginToken.updateMany({
      data: {
        usedAt: new Date(),
      },
      where: {
        id: loginToken.id,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    })

    if (consumed.count !== 1) return null
  }

  return subscriber
}

export async function validateMagicLoginToken(token: string) {
  return getMagicLoginSubscriber(token, false)
}

export async function verifyMagicLoginToken(token: string) {
  return getMagicLoginSubscriber(token, true)
}
