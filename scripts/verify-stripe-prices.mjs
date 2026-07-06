#!/usr/bin/env node
import fs from "node:fs"

const envFile = process.argv[2] ?? ".env.local"

function parseEnv(src) {
  const env = {}
  for (const line of src.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const index = trimmed.indexOf("=")
    if (index < 0) continue
    const key = trimmed.slice(0, index).trim().replace(/^export\s+/, "")
    let value = trimmed.slice(index + 1).trim()
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

const plans = [
  ["Starter", "monthly", 199, "STRIPE_PRICE_STARTER_MONTHLY"],
  ["Starter", "yearly", 1999, "STRIPE_PRICE_STARTER_YEARLY"],
  ["Growth", "monthly", 299, "STRIPE_PRICE_GROWTH_MONTHLY"],
  ["Growth", "yearly", 2999, "STRIPE_PRICE_GROWTH_YEARLY"],
  ["Studio", "monthly", 599, "STRIPE_PRICE_STUDIO_MONTHLY"],
  ["Studio", "yearly", 5999, "STRIPE_PRICE_STUDIO_YEARLY"],
  ["Archive", "monthly", 999, "STRIPE_PRICE_ARCHIVE_MONTHLY"],
  ["Archive", "yearly", 9999, "STRIPE_PRICE_ARCHIVE_YEARLY"],
]

function keyMode(key) {
  if (key.startsWith("sk_live_")) return "LIVE"
  if (key.startsWith("sk_test_")) return "TEST"
  return "UNKNOWN"
}

function maskPriceId(priceId) {
  if (!priceId) return "empty"
  return `${priceId.slice(0, 14)}...`
}

if (!fs.existsSync(envFile)) {
  console.error(`Env file not found: ${envFile}`)
  process.exit(1)
}

const env = parseEnv(fs.readFileSync(envFile, "utf8"))
const secretKey = env.STRIPE_SECRET_KEY ?? ""
const mode = keyMode(secretKey)

console.log(`Checking Stripe prices from ${envFile}`)
console.log(`Stripe key mode: ${mode}`)

if (mode === "UNKNOWN") {
  console.error("STRIPE_SECRET_KEY is missing or not a Stripe secret key.")
  process.exit(1)
}

let failed = false

for (const [plan, cycle, expectedAmount, envName] of plans) {
  const priceId = env[envName] ?? ""
  if (!priceId) {
    failed = true
    console.log(`${envName}: MISSING`)
    continue
  }

  const response = await fetch(`https://api.stripe.com/v1/prices/${priceId}?expand[]=product`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  })

  if (!response.ok) {
    failed = true
    console.log(`${envName}: ERROR ${response.status}`)
    continue
  }

  const price = await response.json()
  const expectedInterval = cycle === "monthly" ? "month" : "year"
  const status = [
    price.active ? "active" : "INACTIVE",
    price.livemode ? "live" : "test",
    price.unit_amount === expectedAmount ? "amount-ok" : `AMOUNT ${price.unit_amount} expected ${expectedAmount}`,
    price.recurring?.interval === expectedInterval ? "interval-ok" : `INTERVAL ${price.recurring?.interval} expected ${expectedInterval}`,
  ]

  if (!price.active || price.unit_amount !== expectedAmount || price.recurring?.interval !== expectedInterval) failed = true
  if ((mode === "LIVE") !== price.livemode) failed = true

  console.log(`${envName}: ${maskPriceId(price.id)} ${plan} ${cycle} product="${price.product?.name ?? price.product}" ${status.join(", ")}`)
}

if (failed) process.exit(1)
