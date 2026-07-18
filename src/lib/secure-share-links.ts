import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"
import { z } from "zod"

const shareTargetSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("workspace"),
    workspaceSlug: z.string().trim().min(1).max(160),
  }),
  z.object({
    gallerySlug: z.string().trim().min(1).max(160),
    type: z.literal("gallery"),
    workspaceSlug: z.string().trim().min(1).max(160),
  }),
  z.object({
    gallerySlug: z.string().trim().min(1).max(160),
    photoId: z.string().trim().min(1).max(220),
    type: z.literal("photo"),
    workspaceSlug: z.string().trim().min(1).max(160),
  }),
])

export type SecureShareTarget = z.infer<typeof shareTargetSchema>

function decodeCanonicalBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null
  const decoded = Buffer.from(value, "base64url")
  return decoded.toString("base64url") === value ? decoded : null
}

function encryptionKey() {
  const secret = process.env.AUTH_SECRET?.trim()
  if (!secret) throw new Error("AUTH_SECRET is required for secure share links.")
  return createHash("sha256").update(`photoview-secure-share-v1:${secret}`).digest()
}

export function createSecureShareToken(target: SecureShareTarget) {
  const parsed = shareTargetSchema.parse(target)
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const plaintext = JSON.stringify({ ...parsed, version: 1 })
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return ["pv1", iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".")
}

export function parseSecureShareToken(token: string): SecureShareTarget | null {
  if (!token || token.length > 1_500) return null
  const [version, encodedIv, encodedTag, encodedCiphertext, extra] = token.split(".")
  if (version !== "pv1" || !encodedIv || !encodedTag || !encodedCiphertext || extra) return null

  try {
    const iv = decodeCanonicalBase64Url(encodedIv)
    const tag = decodeCanonicalBase64Url(encodedTag)
    const ciphertext = decodeCanonicalBase64Url(encodedCiphertext)
    if (!iv || !tag || !ciphertext) return null
    if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0 || ciphertext.length > 1_000) return null

    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv)
    decipher.setAuthTag(tag)
    const value = JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")) as unknown
    if (!value || typeof value !== "object" || (value as { version?: unknown }).version !== 1) return null
    const target = { ...value as Record<string, unknown> }
    delete target.version
    const parsed = shareTargetSchema.safeParse(target)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function secureSharePath(token: string) {
  return `/s/${encodeURIComponent(token)}`
}

export function secureShareTargetKey(target: SecureShareTarget) {
  if (target.type === "workspace") return "workspace"
  if (target.type === "gallery") return `gallery:${target.gallerySlug}`
  return `photo:${target.gallerySlug}:${target.photoId}`
}

export function secureShareTargetAllows(
  target: SecureShareTarget | null,
  input: { workspaceSlug: string; gallerySlug: string; photoId?: string },
) {
  if (!target || target.workspaceSlug !== input.workspaceSlug) return false
  if (target.type === "workspace") return false
  if (target.gallerySlug !== input.gallerySlug) return false
  return target.type === "gallery" || target.photoId === input.photoId
}

export function secureShareTargetAllowsGalleryAsset(
  target: SecureShareTarget | null,
  input: { workspaceSlug: string; gallerySlug: string },
) {
  return Boolean(
    target &&
    target.type !== "workspace" &&
    target.workspaceSlug === input.workspaceSlug &&
    target.gallerySlug === input.gallerySlug,
  )
}
