import { createHmac, timingSafeEqual } from "node:crypto"

type ImportTokenClaims = { expiresAt: number; workspaceId: string }

function tokenSecret() {
  const value = process.env.AUTH_SECRET
  if (!value && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is required for import tokens.")
  return value || "photoviewpro-development-import-secret"
}

function signature(payload: string) {
  return createHmac("sha256", tokenSecret()).update(payload).digest("base64url")
}

export function createImportToken(workspaceId: string, ttlDays = 90) {
  const claims: ImportTokenClaims = {
    expiresAt: Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60,
    workspaceId,
  }
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url")
  return `pvp_imp.${payload}.${signature(payload)}`
}

export function verifyImportToken(token: string | undefined) {
  if (!token) return null
  const [prefix, payload, providedSignature] = token.split(".")
  if (prefix !== "pvp_imp" || !payload || !providedSignature) return null
  const expectedSignature = signature(payload)
  const provided = Buffer.from(providedSignature)
  const expected = Buffer.from(expectedSignature)
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ImportTokenClaims
    if (!claims.workspaceId || claims.expiresAt <= Math.floor(Date.now() / 1000)) return null
    return claims
  } catch {
    return null
  }
}
