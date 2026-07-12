import { createHmac, timingSafeEqual } from "node:crypto"

type CancellationSurveyClaims = {
  email: string
  expiresAt: number
  subscriptionId?: string
}

function signingSecret() {
  const value = process.env.AUTH_SECRET
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required for cancellation survey links.")
  }
  return value || "photoviewpro-development-survey-secret"
}

function sign(payload: string) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url")
}

export function createCancellationSurveyToken(input: {
  email: string
  subscriptionId?: string | null
  ttlDays?: number
}) {
  const claims: CancellationSurveyClaims = {
    email: input.email.trim().toLowerCase(),
    expiresAt: Math.floor(Date.now() / 1000) + (input.ttlDays ?? 30) * 24 * 60 * 60,
    ...(input.subscriptionId ? { subscriptionId: input.subscriptionId } : {}),
  }
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url")
  return `${payload}.${sign(payload)}`
}

export function verifyCancellationSurveyToken(token: string | undefined) {
  if (!token) return null
  const [payload, signature] = token.split(".")
  if (!payload || !signature) return null
  const expected = sign(payload)
  const providedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) return null

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as CancellationSurveyClaims
    if (!claims.email || !claims.expiresAt || claims.expiresAt <= Math.floor(Date.now() / 1000)) return null
    return claims
  } catch {
    return null
  }
}
