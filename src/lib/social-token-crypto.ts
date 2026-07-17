import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

function encryptionKey() {
  const secret = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY?.trim()
  if (!secret) throw new Error("SOCIAL_TOKEN_ENCRYPTION_KEY is required for social publishing connections.")
  return createHash("sha256").update(secret).digest()
}

export function encryptSocialToken(token: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".")
}

export function decryptSocialToken(value: string) {
  const [version, encodedIv, encodedTag, encodedCiphertext] = value.split(".")
  if (version !== "v1" || !encodedIv || !encodedTag || !encodedCiphertext) {
    throw new Error("Unsupported social token format.")
  }

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(encodedIv, "base64url"))
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"))
  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}
