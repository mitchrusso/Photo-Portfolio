import { timingSafeEqual } from "node:crypto"

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export function hasAuthorizedBearerSecret(
  request: Request,
  secrets: Array<string | null | undefined>,
) {
  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return false

  const providedSecret = authorization.slice("Bearer ".length)
  const configuredSecrets = secrets
    .map((secret) => secret?.trim())
    .filter((secret): secret is string => Boolean(secret))

  return configuredSecrets.some((secret) => constantTimeEqual(providedSecret, secret))
}
