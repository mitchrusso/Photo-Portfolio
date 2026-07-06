import { createHmac, timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { autoresponderTags, notifyAutoresponder } from "@/lib/autoresponder"
import { sendBillingLifecycleEmail } from "@/lib/email-automations"
import { fulfillStripeWebhookEvent } from "@/lib/stripe-webhook-fulfillment"

function parseStripeSignature(header: string) {
  return header.split(",").reduce<Record<string, string[]>>((signature, part) => {
      const [key, value] = part.split("=")
      if (!key || !value) return signature
      signature[key] = [...(signature[key] ?? []), value]
      return signature
    }, {})
}

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const signature = parseStripeSignature(signatureHeader)
  const timestamp = signature.t?.[0]
  const v1Signatures = signature.v1 ?? []

  if (!timestamp || v1Signatures.length === 0) return false

  const timestampSeconds = Number(timestamp)
  const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds)
  if (!Number.isFinite(timestampSeconds) || ageSeconds > 300) return false

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex")

  const expectedBuffer = Buffer.from(expected)
  return v1Signatures.some((v1) => {
    const receivedBuffer = Buffer.from(v1)
    return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer)
  })
}

function getStripeObjectEmail(object: Record<string, unknown>) {
  if (typeof object.customer_email === "string") return object.customer_email
  if (typeof object.email === "string") return object.email

  return typeof object["customer_details"] === "object" &&
    object["customer_details"] &&
    "email" in object["customer_details"] &&
    typeof object["customer_details"].email === "string"
    ? object["customer_details"].email
    : undefined
}

function asMetadataString(value: unknown) {
  return typeof value === "string" ? value : null
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

  try {
    const fulfillment = await fulfillStripeWebhookEvent(event)

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        const email = fulfillment.email ?? getStripeObjectEmail(session)

        if (email) {
          await notifyAutoresponder({
            addTags: [autoresponderTags.customer, autoresponderTags.trialConverted],
            email,
            event: "trial_converted",
            list: "PhotoViewPro Customers",
            metadata: {
              stripeCheckoutSessionId: session.id,
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
            },
            removeTags: [autoresponderTags.trial],
          })
          await sendBillingLifecycleEmail({
            email,
            firstName: fulfillment.firstName,
            kind: "customer_welcome",
            metadata: {
              stripeCheckoutSessionId: asMetadataString(session.id),
              stripeCustomerId: asMetadataString(session.customer),
              stripeSubscriptionId: asMetadataString(session.subscription),
            },
            subscriptionId: fulfillment.subscriptionId,
            workspaceId: fulfillment.workspaceId,
          })
        }
        break
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object
        const email = fulfillment.email ?? getStripeObjectEmail(invoice)

        if (email) {
          await notifyAutoresponder({
            addTags: [autoresponderTags.paymentFailed],
            email,
            event: "payment_failed",
            list: "PhotoViewPro Customers",
            metadata: {
              stripeCustomerId: invoice.customer,
              stripeInvoiceId: invoice.id,
              stripeSubscriptionId: invoice.subscription,
            },
          })
          await sendBillingLifecycleEmail({
            email,
            firstName: fulfillment.firstName,
            kind: "payment_failed",
            metadata: {
              stripeCustomerId: asMetadataString(invoice.customer),
              stripeInvoiceId: asMetadataString(invoice.id),
              stripeSubscriptionId: asMetadataString(invoice.subscription),
            },
            subscriptionId: fulfillment.subscriptionId,
            workspaceId: fulfillment.workspaceId,
          })
        }
        break
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object
        const email = fulfillment.email ?? getStripeObjectEmail(subscription)

        if (email) {
          await notifyAutoresponder({
            addTags: [autoresponderTags.canceled],
            email,
            event: "subscription_canceled",
            list: "PhotoViewPro Customers",
            metadata: {
              stripeCustomerId: subscription.customer,
              stripeSubscriptionId: subscription.id,
            },
          })
          await sendBillingLifecycleEmail({
            email,
            firstName: fulfillment.firstName,
            kind: "subscription_canceled",
            metadata: {
              stripeCustomerId: asMetadataString(subscription.customer),
              stripeSubscriptionId: asMetadataString(subscription.id),
            },
            subscriptionId: fulfillment.subscriptionId,
            workspaceId: fulfillment.workspaceId,
          })
        }
        break
      }

      default:
        break
    }

    return NextResponse.json({ fulfillment, received: true })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Stripe webhook fulfillment failed",
      received: false,
    }, { status: 500 })
  }
}
