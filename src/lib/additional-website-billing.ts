import Stripe from "stripe"

import { getPrismaClient } from "@/lib/db"

export class AdditionalWebsiteBillingError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.name = "AdditionalWebsiteBillingError"
    this.code = code
    this.status = status
  }
}

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new AdditionalWebsiteBillingError("billing_not_configured", "Website billing is temporarily unavailable.", 503)
  return new Stripe(key, { apiVersion: "2026-08-26.dahlia" })
}

function getPriceId(billingCycle: "ANNUAL" | "MONTHLY" | null) {
  const priceId = billingCycle === "ANNUAL"
    ? process.env.STRIPE_ADDITIONAL_WEBSITE_ANNUAL_PRICE_ID
    : process.env.STRIPE_ADDITIONAL_WEBSITE_MONTHLY_PRICE_ID
  if (!priceId) {
    throw new AdditionalWebsiteBillingError(
      "website_price_not_configured",
      "Additional website billing has not been configured for this billing cycle.",
      503,
    )
  }
  return priceId
}

export async function setAdditionalWebsiteQuantity({
  idempotencyKey,
  quantity,
  workspaceId,
}: {
  idempotencyKey: string
  quantity: number
  workspaceId: string
}) {
  const prisma = getPrismaClient()
  const subscription = await prisma.subscription.findUnique({
    select: {
      additionalWebsitePriceId: true,
      additionalWebsiteStripeItemId: true,
      additionalWebsiteStripeSubscriptionId: true,
      billingCycle: true,
      lifetimeAccess: true,
      status: true,
      stripeSubscriptionId: true,
    },
    where: { workspaceId },
  })
  const stripeSubscriptionId = subscription?.additionalWebsiteStripeSubscriptionId ?? subscription?.stripeSubscriptionId
  if (!subscription || subscription.status !== "ACTIVE" || !stripeSubscriptionId) {
    throw new AdditionalWebsiteBillingError(
      "paid_subscription_required",
      "Activate a paid PhotoView subscription before publishing an additional website.",
      402,
    )
  }

  const normalizedQuantity = Math.max(0, Math.floor(quantity))
  const priceId = subscription.lifetimeAccess && subscription.additionalWebsitePriceId
    ? subscription.additionalWebsitePriceId
    : getPriceId(subscription.billingCycle)
  const stripe = getStripeClient()
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
    expand: ["items.data.price"],
  })
  const matchingItem = stripeSubscription.items.data.find((item) => item.price.id === priceId)
    ?? stripeSubscription.items.data.find((item) => item.id === subscription.additionalWebsiteStripeItemId)

  let stripeItemId: string | null = matchingItem?.id ?? null
  if (normalizedQuantity === 0) {
    if (subscription.lifetimeAccess && subscription.additionalWebsiteStripeSubscriptionId) {
      await stripe.subscriptions.cancel(stripeSubscriptionId, { invoice_now: false, prorate: false })
      stripeItemId = null
    } else if (stripeItemId) {
      await stripe.subscriptionItems.del(stripeItemId, { proration_behavior: "none" }, { idempotencyKey })
      stripeItemId = null
    }
  } else if (stripeItemId) {
    const updated = await stripe.subscriptionItems.update(
      stripeItemId,
      { price: priceId, proration_behavior: "none", quantity: normalizedQuantity },
      { idempotencyKey },
    )
    stripeItemId = updated.id
  } else {
    const created = await stripe.subscriptionItems.create(
      {
        metadata: { purpose: "additional_photoview_websites", workspaceId },
        price: priceId,
        proration_behavior: "none",
        quantity: normalizedQuantity,
        subscription: stripeSubscriptionId,
      },
      { idempotencyKey },
    )
    stripeItemId = created.id
  }

  await prisma.subscription.update({
    data: {
      additionalWebsitePriceId: normalizedQuantity > 0 ? priceId : null,
      additionalWebsiteQuantity: normalizedQuantity,
      additionalWebsiteStripeItemId: stripeItemId,
      additionalWebsiteStripeSubscriptionId: normalizedQuantity > 0 && subscription.lifetimeAccess ? stripeSubscriptionId : null,
    },
    where: { workspaceId },
  })

  return { priceId: normalizedQuantity > 0 ? priceId : null, quantity: normalizedQuantity, stripeItemId }
}
