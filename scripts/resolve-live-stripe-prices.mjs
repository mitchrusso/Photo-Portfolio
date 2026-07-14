const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? ""

if (!secretKey.startsWith("sk_live_")) {
  console.error("A Stripe sk_live_ key is required to discover production prices.")
  process.exit(1)
}

const expectedPrices = [
  { amount: 199, envName: "STRIPE_PRICE_STARTER_MONTHLY", interval: "month", productName: "PhotoViewPro Starter" },
  { amount: 1999, envName: "STRIPE_PRICE_STARTER_YEARLY", interval: "year", productName: "PhotoViewPro Starter" },
  { amount: 299, envName: "STRIPE_PRICE_GROWTH_MONTHLY", interval: "month", productName: "PhotoViewPro Growth" },
  { amount: 2999, envName: "STRIPE_PRICE_GROWTH_YEARLY", interval: "year", productName: "PhotoViewPro Growth" },
  { amount: 599, envName: "STRIPE_PRICE_STUDIO_MONTHLY", interval: "month", productName: "PhotoViewPro Studio" },
  { amount: 5999, envName: "STRIPE_PRICE_STUDIO_YEARLY", interval: "year", productName: "PhotoViewPro Studio" },
  { amount: 999, envName: "STRIPE_PRICE_PREMIER_MONTHLY", interval: "month", productName: "PhotoViewPro Premier" },
  { amount: 9999, envName: "STRIPE_PRICE_PREMIER_YEARLY", interval: "year", productName: "PhotoViewPro Premier" },
]

const query = new URLSearchParams({
  active: "true",
  limit: "100",
  type: "recurring",
})
query.append("expand[]", "data.product")

const response = await fetch(`https://api.stripe.com/v1/prices?${query}`, {
  headers: { Authorization: `Bearer ${secretKey}` },
})
const result = await response.json().catch(() => ({}))

if (!response.ok) {
  console.error(`Stripe price discovery failed: ${result?.error?.message ?? `HTTP ${response.status}`}`)
  process.exit(1)
}

if (result.has_more) {
  console.error("Stripe has more than 100 active recurring prices; automatic discovery stopped for safety.")
  process.exit(1)
}

const prices = Array.isArray(result.data) ? result.data : []

for (const expected of expectedPrices) {
  const matches = prices.filter((price) => (
    price.active === true
    && price.currency === "usd"
    && price.livemode === true
    && price.recurring?.interval === expected.interval
    && price.recurring?.interval_count === 1
    && price.unit_amount === expected.amount
    && price.product?.active === true
    && price.product?.name === expected.productName
  ))

  if (matches.length !== 1) {
    console.error(`${expected.productName} ${expected.interval} price discovery found ${matches.length} matches; expected exactly one.`)
    process.exit(1)
  }

  console.log(`${expected.envName}=${matches[0].id}`)
}

if (process.argv.includes("--verify-webhook")) {
  const webhookResponse = await fetch("https://api.stripe.com/v1/webhook_endpoints?limit=100", {
    headers: { Authorization: `Bearer ${secretKey}` },
  })
  const webhookResult = await webhookResponse.json().catch(() => ({}))

  if (!webhookResponse.ok) {
    console.error(`Stripe webhook verification failed: ${webhookResult?.error?.message ?? `HTTP ${webhookResponse.status}`}`)
    process.exit(1)
  }

  const endpoint = webhookResult.data?.find((candidate) => (
    candidate.url === "https://photoviewpro.com/api/stripe/webhook"
  ))
  const requiredEvents = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.deleted",
    "customer.subscription.updated",
    "invoice.payment_failed",
    "invoice.payment_succeeded",
  ]

  if (!endpoint || endpoint.status !== "enabled" || endpoint.livemode !== true) {
    console.error("The PhotoViewPro production webhook endpoint is missing, disabled, or not in live mode.")
    process.exit(1)
  }

  const missingEvents = endpoint.enabled_events?.includes("*")
    ? []
    : requiredEvents.filter((event) => !endpoint.enabled_events?.includes(event))

  if (missingEvents.length > 0) {
    console.error(`The production webhook is missing events: ${missingEvents.join(", ")}`)
    process.exit(1)
  }

  console.error("Verified the live Stripe account, eight recurring prices, and production webhook.")
}
