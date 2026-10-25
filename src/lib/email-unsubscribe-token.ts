import { createHmac, timingSafeEqual } from "node:crypto"

import { normalizedEmail } from "./email-suppression.ts"

type EmailUnsubscribeClaims = {
  email: string
  expiresAt: number
  purpose: "email_unsubscribe"
}

function signingSecret() {
  const value = process.env.AUTH_SECRET
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required for email unsubscribe links.")
  }
  return value || "photoviewpro-development-unsubscribe-secret"
}

function sign(payload: string) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url")
}

export function createEmailUnsubscribeToken(email: string, ttlDays = 3650) {
  const claims: EmailUnsubscribeClaims = {
    email: normalizedEmail(email),
    expiresAt: Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60,
    purpose: "email_unsubscribe",
  }
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url")
  return `${payload}.${sign(payload)}`
}

export function verifyEmailUnsubscribeToken(token: string | undefined) {
  if (!token) return null
  const [payload, signature] = token.split(".")
  if (!payload || !signature) return null

  const expected = sign(payload)
  const providedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) return null

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as EmailUnsubscribeClaims
    if (
      claims.purpose !== "email_unsubscribe"
      || !claims.email
      || !claims.expiresAt
      || claims.expiresAt <= Math.floor(Date.now() / 1000)
    ) return null
    return { ...claims, email: normalizedEmail(claims.email) }
  } catch {
    return null
  }
}
