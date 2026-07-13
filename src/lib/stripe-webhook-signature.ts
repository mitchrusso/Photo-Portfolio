import { createHmac, timingSafeEqual } from "node:crypto"

const DEFAULT_TOLERANCE_SECONDS = 300

function parseStripeSignature(header: string) {
  return header.split(",").reduce<Record<string, string[]>>((signature, part) => {
    const [rawKey, rawValue] = part.split("=")
    const key = rawKey?.trim()
    const value = rawValue?.trim()

    if (!key || !value) return signature
    signature[key] = [...(signature[key] ?? []), value]
    return signature
  }, {})
}

export function verifyStripeWebhookSignature({
  now = Date.now(),
  payload,
  secret,
  signatureHeader,
  toleranceSeconds = DEFAULT_TOLERANCE_SECONDS,
}: {
  now?: number
  payload: string
  secret: string
  signatureHeader: string
  toleranceSeconds?: number
}) {
  const signature = parseStripeSignature(signatureHeader)
  const timestamp = signature.t?.[0]
  const v1Signatures = signature.v1 ?? []

  if (!timestamp || v1Signatures.length === 0) return false

  const timestampSeconds = Number(timestamp)
  const ageSeconds = Math.abs(now / 1000 - timestampSeconds)
  if (!Number.isFinite(timestampSeconds) || ageSeconds > toleranceSeconds) return false

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex")
  const expectedBuffer = Buffer.from(expected, "utf8")

  return v1Signatures.some((candidate) => {
    const receivedBuffer = Buffer.from(candidate, "utf8")
    return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer)
  })
}
