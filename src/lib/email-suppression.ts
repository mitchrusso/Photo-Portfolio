import { createHash } from "node:crypto"

export function normalizedEmail(value: string) {
  return value.trim().toLowerCase()
}

export function emailRecipientHash(value: string) {
  return createHash("sha256").update(normalizedEmail(value)).digest("hex")
}

export async function isEmailSuppressed(email: string) {
  if (!process.env.DATABASE_URL) return false
  const { getPrismaClient } = await import("@/lib/db")
  const suppression = await getPrismaClient().emailSuppression.findUnique({
    select: { recipientHash: true },
    where: { recipientHash: emailRecipientHash(email) },
  })
  return Boolean(suppression)
}
