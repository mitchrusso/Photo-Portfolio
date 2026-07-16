import { createHmac, timingSafeEqual } from "node:crypto"

export const ADMIN_MFA_MAX_AGE_SECONDS = 12 * 60 * 60

export type AdminMfaSessionIdentity = {
  id: string
  loginSessionId: string
}

type AdminMfaApproval = {
  exp: number
  loginSessionId: string
  userId: string
  v: 1
}

function signingSecret() {
  const secret = process.env.AUTH_SECRET?.trim()
  if (!secret) throw new Error("AUTH_SECRET is required for SuperAdmin MFA.")
  return secret
}

function signature(value: string) {
  return createHmac("sha256", signingSecret()).update(value).digest("base64url")
}

export function createAdminMfaApprovalValue(identity: AdminMfaSessionIdentity, now = Date.now()) {
  if (!identity.id || !identity.loginSessionId) throw new Error("A current login session is required.")
  const payload: AdminMfaApproval = {
    exp: Math.floor(now / 1000) + ADMIN_MFA_MAX_AGE_SECONDS,
    loginSessionId: identity.loginSessionId,
    userId: identity.id,
    v: 1,
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `${encoded}.${signature(encoded)}`
}

export function verifyAdminMfaApprovalValue(
  value: string | undefined,
  identity: AdminMfaSessionIdentity | null,
  now = Date.now(),
) {
  if (!value || !identity?.id || !identity.loginSessionId) return false
  const [encoded, suppliedSignature, extra] = value.split(".")
  if (!encoded || !suppliedSignature || extra) return false

  try {
    const expectedSignature = signature(encoded)
    const supplied = Buffer.from(suppliedSignature)
    const expected = Buffer.from(expectedSignature)
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<AdminMfaApproval>
    return payload.v === 1
      && payload.exp !== undefined
      && payload.exp > Math.floor(now / 1000)
      && payload.userId === identity.id
      && payload.loginSessionId === identity.loginSessionId
  } catch {
    return false
  }
}
