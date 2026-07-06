import { createHmac, timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { autoresponderTags, notifyAutoresponder } from "@/lib/autoresponder"
import { fulfillStripeWebhookEvent } from "@/lib/stripe-webhook-fulfillment"

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
        const email = getStripeObjectEmail(session)

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
        }
        break
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object
        const email = getStripeObjectEmail(invoice)

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
        }
        break
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object
        const email = getStripeObjectEmail(subscription)

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
