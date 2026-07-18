import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto"

type ImportTokenClaims = { expiresAt: number; tokenId?: string; workspaceId: string }

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
    tokenId: randomBytes(18).toString("base64url"),
    workspaceId,
  }
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url")
  return `pvp_imp.${payload}.${signature(payload)}`
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function issueImportToken(workspaceId: string, ttlDays = 90) {
  const token = createImportToken(workspaceId, ttlDays)
  const claims = verifyImportToken(token)
  if (!claims) throw new Error("The import credential could not be created.")

  const { getPrismaClient } = await import("@/lib/db")
  await getPrismaClient().importCredential.upsert({
    create: {
      expiresAt: new Date(claims.expiresAt * 1000),
      tokenHash: hashToken(token),
      workspaceId,
    },
    update: {
      expiresAt: new Date(claims.expiresAt * 1000),
      tokenHash: hashToken(token),
    },
    where: { workspaceId },
  })
  return token
}

export async function verifyCurrentImportToken(token: string | undefined) {
  const claims = verifyImportToken(token)
  if (!claims || !token) return null

  const { getPrismaClient } = await import("@/lib/db")
  const credential = await getPrismaClient().importCredential.findUnique({
    select: { expiresAt: true, tokenHash: true },
    where: { workspaceId: claims.workspaceId },
  })
  // Tokens created before rotating credentials were introduced remain usable
  // until their original expiry, but disappear as soon as a new key is issued.
  if (!credential) return claims.tokenId ? null : claims
  if (credential.expiresAt <= new Date()) return null

  const supplied = Buffer.from(hashToken(token))
  const expected = Buffer.from(credential.tokenHash)
  return supplied.length === expected.length && timingSafeEqual(supplied, expected) ? claims : null
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
    if (claims.tokenId !== undefined && !/^[A-Za-z0-9_-]{20,40}$/.test(claims.tokenId)) return null
    return claims
  } catch {
    return null
  }
}
