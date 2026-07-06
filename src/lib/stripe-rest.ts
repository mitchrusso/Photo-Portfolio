type CheckoutSessionInput = {
  cancelUrl: string
  customerEmail: string
  metadata: Record<string, string>
  phone?: string
  priceId: string
  successUrl: string
  trialDays: number
}

export type StripeCheckoutSession = {
  id: string
  url: string | null
}

export function hasStripeCheckoutConfig(priceId?: string) {
  return Boolean(process.env.STRIPE_SECRET_KEY && priceId)
}

function isAutomaticTaxEnabled() {
  return process.env.STRIPE_AUTOMATIC_TAX_ENABLED === "true"
}

export async function createStripeCheckoutSession(input: CheckoutSessionInput) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY")
  }

  const body = new URLSearchParams({
    "automatic_tax[enabled]": String(isAutomaticTaxEnabled()),
    "customer_email": input.customerEmail,
    "line_items[0][price]": input.priceId,
    "line_items[0][quantity]": "1",
    "metadata[email]": input.customerEmail,
    "mode": "subscription",
    "phone_number_collection[enabled]": "true",
    "subscription_data[trial_period_days]": String(input.trialDays),
    "success_url": input.successUrl,
    "cancel_url": input.cancelUrl,
  })

  Object.entries(input.metadata).forEach(([key, value]) => {
    body.set(`metadata[${key}]`, value)
    body.set(`subscription_data[metadata][${key}]`, value)
  })

  if (input.phone) {
    body.set("metadata[phone]", input.phone)
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    body,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Stripe Checkout failed: ${errorBody}`)
  }

  return response.json() as Promise<StripeCheckoutSession>
}
