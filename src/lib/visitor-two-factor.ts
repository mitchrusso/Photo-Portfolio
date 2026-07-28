import { createHmac, randomInt, timingSafeEqual } from "node:crypto"

const CHALLENGE_TTL_SECONDS = 10 * 60

type VisitorChallenge = {
  codeHash: string
  email: string
  expiresAt: number
  resourceId: string
  resourceType: "gallery" | "portfolio"
}

function secret() {
  const value = process.env.AUTH_SECRET?.trim()
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required for visitor verification.")
  }
  return value || "photoview-development-visitor-verification"
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

function challengeSignature(payload: string) {
  return createHmac("sha256", secret()).update(`visitor-2fa:${payload}`).digest("base64url")
}

function codeHash(input: Omit<VisitorChallenge, "codeHash">, code: string) {
  return createHmac("sha256", secret())
    .update(`visitor-code:${input.resourceType}:${input.resourceId}:${input.email}:${input.expiresAt}:${code}`)
    .digest("base64url")
}

export function createVisitorTwoFactorChallenge(
  resourceType: VisitorChallenge["resourceType"],
  resourceId: string,
  email: string,
  now = Date.now(),
) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0")
  const base = {
    email: email.trim().toLowerCase(),
    expiresAt: Math.floor(now / 1000) + CHALLENGE_TTL_SECONDS,
    resourceId,
    resourceType,
  }
  const challenge: VisitorChallenge = { ...base, codeHash: codeHash(base, code) }
  const payload = Buffer.from(JSON.stringify(challenge)).toString("base64url")
  return {
    challenge: `pv2.${payload}.${challengeSignature(payload)}`,
    code,
    expiresAt: challenge.expiresAt,
  }
}

export function verifyVisitorTwoFactorChallenge(
  token: string,
  code: string,
  expected: {
    resourceId: string
    resourceType: VisitorChallenge["resourceType"]
  },
  now = Date.now(),
) {
  if (!token || token.length > 2_000 || !/^\d{6}$/.test(code)) return false
  const [version, payload, signature, extra] = token.split(".")
  if (version !== "pv2" || !payload || !signature || extra) return false
  if (!safeEqual(signature, challengeSignature(payload))) return false

  try {
    const challenge = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as VisitorChallenge
    if (
      challenge.resourceId !== expected.resourceId ||
      challenge.resourceType !== expected.resourceType ||
      challenge.expiresAt <= Math.floor(now / 1000) ||
      typeof challenge.email !== "string" ||
      typeof challenge.codeHash !== "string"
    ) return false
    const actual = codeHash({
      email: challenge.email,
      expiresAt: challenge.expiresAt,
      resourceId: challenge.resourceId,
      resourceType: challenge.resourceType,
    }, code)
    return safeEqual(actual, challenge.codeHash)
  } catch {
    return false
  }
}
