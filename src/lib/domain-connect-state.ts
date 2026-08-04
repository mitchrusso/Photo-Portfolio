import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

type DomainConnectState = {
  domain: string
  expiresAt: number
  nonce: string
  workspaceId: string
}

function signingSecret() {
  const secret = process.env.AUTH_SECRET?.trim()
  if (!secret) throw new Error("AUTH_SECRET is required for Domain Connect.")
  return secret
}

function signature(payload: string) {
  return createHmac("sha256", signingSecret())
    .update(`domain-connect:${payload}`)
    .digest("base64url")
}

export function createDomainConnectState(workspaceId: string, domain: string, ttlMinutes = 10) {
  const claims: DomainConnectState = {
    domain,
    expiresAt: Math.floor(Date.now() / 1000) + ttlMinutes * 60,
    nonce: randomBytes(18).toString("base64url"),
    workspaceId,
  }
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url")
  return `pvdc.${payload}.${signature(payload)}`
}

export function verifyDomainConnectState(value: string | null) {
  if (!value) return null
  const [prefix, payload, suppliedSignature] = value.split(".")
  if (prefix !== "pvdc" || !payload || !suppliedSignature) return null

  const expected = Buffer.from(signature(payload))
  const supplied = Buffer.from(suppliedSignature)
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as DomainConnectState
    if (
      !claims.workspaceId
      || !claims.domain
      || !/^[A-Za-z0-9_-]{20,40}$/.test(claims.nonce)
      || claims.expiresAt <= Math.floor(Date.now() / 1000)
    ) return null
    return claims
  } catch {
    return null
  }
}
