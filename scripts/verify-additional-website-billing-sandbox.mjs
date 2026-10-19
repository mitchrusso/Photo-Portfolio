const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? ""

if (!secretKey.startsWith("sk_test_")) {
  console.error("A Stripe test secret key is required for the website billing sandbox test.")
  process.exit(1)
}

async function stripeRequest(path, { method = "GET", params } = {}) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    body: params ? new URLSearchParams(params) : undefined,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    method,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body?.error?.message || `Stripe API returned HTTP ${response.status}`)
  return body
}

async function findOrCreateProduct() {
  const query = encodeURIComponent("active:'true' AND metadata['photoview_product']:'additional_website'")
  const result = await stripeRequest(`/products/search?query=${query}`)
  const existing = result.data?.find((product) => product.name === "PhotoView.io Additional Website")
  if (existing) return existing
  return stripeRequest("/products", {
    method: "POST",
    params: {
      name: "PhotoView.io Additional Website",
      description: "One additional published PhotoView.io website with its own PhotoView address and optional custom domain.",
      "metadata[photoview_product]": "additional_website",
      "metadata[catalog_version]": "2026-10",
    },
  })
}

async function findOrCreatePrice({ amount, cycle, productId }) {
  const lookupKey = `photoview_additional_website_${cycle}_2026_10`
  const query = new URLSearchParams({ active: "true", limit: "10" })
  query.append("lookup_keys[]", lookupKey)
  const result = await stripeRequest(`/prices?${query}`)
  const interval = cycle === "monthly" ? "month" : "year"
  const existing = result.data?.find((price) => (
    price.product === productId
    && price.unit_amount === amount
    && price.currency === "usd"
    && price.recurring?.interval === interval
  ))
  if (existing) return existing
  return stripeRequest("/prices", {
    method: "POST",
    params: {
      product: productId,
      currency: "usd",
      unit_amount: String(amount),
      "recurring[interval]": interval,
      lookup_key: lookupKey,
      nickname: `${cycle === "monthly" ? "Monthly" : "Annual"} additional website 2026-10`,
      "metadata[photoview_product]": "additional_website",
      "metadata[billing_cycle]": cycle,
    },
  })
}

const product = await findOrCreateProduct()
const monthlyPrice = await findOrCreatePrice({ amount: 129, cycle: "monthly", productId: product.id })
const annualPrice = await findOrCreatePrice({ amount: 1548, cycle: "annual", productId: product.id })
const customer = await stripeRequest("/customers", {
  method: "POST",
  params: {
    email: `photoview-sandbox-${Date.now()}@example.com`,
    "metadata[purpose]": "additional_website_billing_verification",
  },
})

let subscription
try {
  subscription = await stripeRequest("/subscriptions", {
    method: "POST",
    params: {
      customer: customer.id,
      "items[0][price]": monthlyPrice.id,
      "items[0][quantity]": "1",
      trial_period_days: "1",
      "metadata[purpose]": "lifetime_additional_website",
      "metadata[workspaceId]": "sandbox-verification",
    },
  })
  const item = subscription.items?.data?.[0]
  if (!item?.id || item.quantity !== 1) throw new Error("Stripe did not create the expected quantity-one website item.")
  const updated = await stripeRequest(`/subscription_items/${item.id}`, {
    method: "POST",
    params: { proration_behavior: "none", quantity: "2" },
  })
  if (updated.quantity !== 2) throw new Error("Stripe did not persist the quantity-two website update.")
  const retrieved = await stripeRequest(`/subscriptions/${subscription.id}`)
  if (retrieved.items?.data?.[0]?.quantity !== 2) throw new Error("Stripe retrieval did not confirm the updated website quantity.")
  console.log(`STRIPE_ADDITIONAL_WEBSITE_MONTHLY_PRICE_ID=${monthlyPrice.id}`)
  console.log(`STRIPE_ADDITIONAL_WEBSITE_ANNUAL_PRICE_ID=${annualPrice.id}`)
  console.log("Sandbox PASS: created quantity 1, updated to quantity 2 without proration, and verified the result.")
} finally {
  if (subscription?.id) {
    await stripeRequest(`/subscriptions/${subscription.id}`, { method: "DELETE" }).catch(() => undefined)
  }
  await stripeRequest(`/customers/${customer.id}`, { method: "DELETE" }).catch(() => undefined)
}
