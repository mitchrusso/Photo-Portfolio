const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? ""

if (!secretKey.startsWith("sk_live_")) {
  console.error("A Stripe live secret key is required to create production website add-on prices.")
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

  const nameQuery = encodeURIComponent("active:'true' AND name:'PhotoView.io Additional Website'")
  const namedResult = await stripeRequest(`/products/search?query=${nameQuery}`)
  const namedProduct = namedResult.data?.find((product) => product.name === "PhotoView.io Additional Website")
  if (namedProduct) return namedProduct

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

async function findOrCreatePrice({ amount, cycle, envName, productId }) {
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
    && price.recurring?.interval_count === 1
  ))
  if (existing) return { envName, id: existing.id }

  const productPrices = await stripeRequest(`/prices?${new URLSearchParams({ active: "true", limit: "100", product: productId })}`)
  const existingProductPrice = productPrices.data?.find((price) => (
    price.unit_amount === amount
    && price.currency === "usd"
    && price.recurring?.interval === interval
    && price.recurring?.interval_count === 1
  ))
  if (existingProductPrice) return { envName, id: existingProductPrice.id }

  const price = await stripeRequest("/prices", {
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
      "metadata[catalog_version]": "2026-10",
    },
  })
  return { envName, id: price.id }
}

const product = await findOrCreateProduct()
const assignments = await Promise.all([
  findOrCreatePrice({
    amount: 129,
    cycle: "monthly",
    envName: "STRIPE_ADDITIONAL_WEBSITE_MONTHLY_PRICE_ID",
    productId: product.id,
  }),
  findOrCreatePrice({
    amount: 1548,
    cycle: "annual",
    envName: "STRIPE_ADDITIONAL_WEBSITE_ANNUAL_PRICE_ID",
    productId: product.id,
  }),
])

for (const assignment of assignments) console.log(`${assignment.envName}=${assignment.id}`)
console.error("Created or reused the live PhotoView.io Additional Website product and recurring prices.")
