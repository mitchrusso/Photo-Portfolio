import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const ACCESS_TTL_SECONDS = 12 * 60 * 60
const PASSWORD_KEY_LENGTH = 64

function secret() {
  const value = process.env.AUTH_SECRET
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required for gallery access tokens.")
  }
  return value || "photoviewpro-development-gallery-secret"
}

function safeEqual(left: string | Buffer, right: string | Buffer) {
  const leftBuffer = Buffer.isBuffer(left) ? left : Buffer.from(left)
  const rightBuffer = Buffer.isBuffer(right) ? right : Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export function hashGalleryPassword(password: string) {
  const salt = randomBytes(16).toString("base64url")
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("base64url")
  return `scrypt$${salt}$${hash}`
}

export function verifyGalleryPassword(password: string, storedHash: string) {
  const [algorithm, salt, expected] = storedHash.split("$")
  if (algorithm !== "scrypt" || !salt || !expected) return false

  try {
    const actual = scryptSync(password, salt, PASSWORD_KEY_LENGTH)
    return safeEqual(actual, Buffer.from(expected, "base64url"))
  } catch {
    return false
  }
}

export function galleryAccessCookieName(galleryId: string) {
  return `pvp_gallery_${galleryId}`
}

export function createGalleryAccessToken(galleryId: string, now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + ACCESS_TTL_SECONDS
  const payload = `${galleryId}.${expiresAt}`
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url")
  return `${payload}.${signature}`
}

export function verifyGalleryAccessToken(token: string | undefined, galleryId: string, now = Date.now()) {
  if (!token) return false
  const [tokenGalleryId, expiresAtText, signature] = token.split(".")
  if (!tokenGalleryId || !expiresAtText || !signature || tokenGalleryId !== galleryId) return false

  const expiresAt = Number(expiresAtText)
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(now / 1000)) return false

  const payload = `${tokenGalleryId}.${expiresAtText}`
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url")
  return safeEqual(signature, expected)
}
