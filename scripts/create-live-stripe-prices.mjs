const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? ""

if (!secretKey.startsWith("sk_live_")) {
  console.error("A Stripe sk_live_ key is required to create production prices.")
  process.exit(1)
}

const catalog = [
  { plan: "starter", name: "Starter", monthly: 399, annual: 3999 },
  { plan: "growth", name: "Growth", monthly: 599, annual: 5999 },
  { plan: "studio", name: "Studio", monthly: 799, annual: 7999 },
  { plan: "premier", name: "Premier", monthly: 1199, annual: 11999 },
]

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

  if (!response.ok) {
    throw new Error(body?.error?.message || `Stripe API returned HTTP ${response.status}`)
  }

  return body
}

async function findOrCreateProduct(entry) {
  const result = await stripeRequest("/products/search?query=" + encodeURIComponent(`active:'true' AND metadata['photoview_plan']:'${entry.plan}'`))
  const existing = result.data?.find((product) => product.name === `PhotoView.io ${entry.name}`)
  if (existing) return existing

  return stripeRequest("/products", {
    method: "POST",
    params: {
      name: `PhotoView.io ${entry.name}`,
      description: `${entry.name} subscription for PhotoView.io`,
      "metadata[photoview_plan]": entry.plan,
      "metadata[catalog_version]": "2026-07",
    },
  })
}

async function findOrCreatePrice({ amount, cycle, envName, plan, productId }) {
  const lookupKey = `photoview_${plan}_${cycle}_2026_07`
  const query = new URLSearchParams({ active: "true", limit: "10" })
  query.append("lookup_keys[]", lookupKey)
  const result = await stripeRequest(`/prices?${query}`)
  const interval = cycle === "monthly" ? "month" : "year"
  const existing = result.data?.find((price) => (
    price.product === productId
    && price.unit_amount === amount
    && price.currency === "usd"
    && price.recurring?.interval === interval
    && price.recurring?.interval_count === 1
  ))

  if (existing) return { envName, id: existing.id }

  const price = await stripeRequest("/prices", {
    method: "POST",
    params: {
      product: productId,
      currency: "usd",
      unit_amount: String(amount),
      "recurring[interval]": interval,
      lookup_key: lookupKey,
      nickname: `${cycle === "monthly" ? "Monthly" : "Annual"} ${plan} 2026-07`,
      "metadata[photoview_plan]": plan,
      "metadata[billing_cycle]": cycle,
      "metadata[catalog_version]": "2026-07",
    },
  })

  return { envName, id: price.id }
}

const assignments = []

for (const entry of catalog) {
  const product = await findOrCreateProduct(entry)
  assignments.push(await findOrCreatePrice({
    amount: entry.monthly,
    cycle: "monthly",
    envName: `STRIPE_PRICE_${entry.plan.toUpperCase()}_MONTHLY`,
    plan: entry.plan,
    productId: product.id,
  }))
  assignments.push(await findOrCreatePrice({
    amount: entry.annual,
    cycle: "annual",
    envName: `STRIPE_PRICE_${entry.plan.toUpperCase()}_YEARLY`,
    plan: entry.plan,
    productId: product.id,
  }))
}

for (const assignment of assignments) console.log(`${assignment.envName}=${assignment.id}`)
console.error("Created or reused eight PhotoView.io live recurring prices. Existing subscriptions and legacy prices were not changed.")
