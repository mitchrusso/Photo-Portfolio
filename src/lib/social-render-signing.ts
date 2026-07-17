import { createHmac, timingSafeEqual } from "node:crypto"

function renderSecret() {
  const secret = process.env.SOCIAL_RENDER_SIGNING_SECRET?.trim() || process.env.SOCIAL_TOKEN_ENCRYPTION_KEY?.trim()
  if (!secret || secret.length < 32) throw new Error("Social image rendering is not configured.")
  return secret
}

export function signSocialRender(deliveryId: string, expires: number) {
  return createHmac("sha256", renderSecret()).update(`${deliveryId}:${expires}`).digest("hex")
}

export function verifySocialRender(deliveryId: string, expires: number, signature: string) {
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000) || !/^[0-9a-f]{64}$/i.test(signature)) return false
  const expected = Buffer.from(signSocialRender(deliveryId, expires), "hex")
  const received = Buffer.from(signature, "hex")
  return expected.length === received.length && timingSafeEqual(expected, received)
}

export function socialRenderUrl(appUrl: string, deliveryId: string, lifetimeSeconds = 30 * 60) {
  const expires = Math.floor(Date.now() / 1000) + lifetimeSeconds
  const url = new URL(`/api/social/render/${encodeURIComponent(deliveryId)}`, appUrl)
  url.searchParams.set("expires", String(expires))
  url.searchParams.set("signature", signSocialRender(deliveryId, expires))
  return url.toString()
}
