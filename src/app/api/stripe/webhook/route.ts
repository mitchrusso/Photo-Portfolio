import { createHmac, timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"

function parseStripeSignature(header: string) {
  return Object.fromEntries(
    header.split(",").map((part) => {
      const [key, value] = part.split("=")
      return [key, value]
    }),
  )
}

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const signature = parseStripeSignature(signatureHeader)
  const timestamp = signature.t
  const v1 = signature.v1

  if (!timestamp || !v1) return false

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex")

  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(v1)

  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer)
}

export async function POST(request: Request) {
  const payload = await request.text()
  const signatureHeader = request.headers.get("stripe-signature")

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 503 })
  }

  if (!signatureHeader || !verifyStripeSignature(payload, signatureHeader, process.env.STRIPE_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 })
  }

  const event = JSON.parse(payload) as {
    type: string
    data: { object: Record<string, unknown> }
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "invoice.payment_succeeded":
    case "invoice.payment_failed":
      // Production persistence hook:
      // update Subscription status, currentPeriodEnd, trialEndsAt, storage entitlements,
      // and payment health by matching Stripe customer/subscription/session ids.
      break
    default:
      break
  }

  return NextResponse.json({ received: true })
}
