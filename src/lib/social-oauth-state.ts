import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

type SocialOAuthState = {
  expiresAt: number
  nonce: string
  provider: "meta"
  userId: string
  workspaceId: string
}

function signingSecret() {
  const secret = process.env.AUTH_SECRET?.trim()
  if (!secret) throw new Error("AUTH_SECRET is required for social OAuth.")
  return secret
}

function signature(payload: string) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url")
}

export function createSocialOAuthState(input: Pick<SocialOAuthState, "provider" | "userId" | "workspaceId">) {
  const claims: SocialOAuthState = {
    ...input,
    expiresAt: Math.floor(Date.now() / 1000) + 10 * 60,
    nonce: randomBytes(18).toString("base64url"),
  }
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url")
  return `pvsoc.${payload}.${signature(payload)}`
}

export function verifySocialOAuthState(value: string | null) {
  if (!value) return null
  const [prefix, payload, suppliedSignature] = value.split(".")
  if (prefix !== "pvsoc" || !payload || !suppliedSignature) return null
  const expected = Buffer.from(signature(payload))
  const supplied = Buffer.from(suppliedSignature)
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SocialOAuthState
    if (
      claims.provider !== "meta" ||
      !claims.userId ||
      !claims.workspaceId ||
      claims.expiresAt <= Math.floor(Date.now() / 1000)
    ) return null
    return claims
  } catch {
    return null
  }
}
