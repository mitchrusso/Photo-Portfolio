import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = process.cwd()
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8")

test("registration captures contact details before the plan and checkout step", () => {
  const page = read("src/app/register/page.tsx")
  const leadRoute = read("src/app/api/trial/lead/route.ts")

  assert.match(page, /registrationStep === "contact"/)
  assert.match(page, /Continue to plans/)
  assert.match(page, /What do you want PhotoView to help you publish\?/) 
  assert.match(page, /marketingConsent/)
  assert.match(leadRoute, /randomBytes\(32\)/)
  assert.match(leadRoute, /resumeExpiresAt/)
  assert.match(leadRoute, /prospect\.marketingConsent\s*\?\s*await notifyAutoresponder/)
})

test("abandoned checkout prospects use their own TinyEmail audience and leave it after conversion", () => {
  const autoresponder = read("src/lib/autoresponder.ts")
  const registerRoute = read("src/app/api/trial/register/route.ts")
  const stripeWebhook = read("src/app/api/stripe/webhook/route.ts")

  assert.match(autoresponder, /PhotoView\.io Abandoned Checkout Prospects/)
  assert.match(autoresponder, /photoviewpro:abandoned-checkout/)
  assert.match(autoresponder, /unAssignMembers/)
  assert.match(registerRoute, /markAbandonedCheckoutStatus\(prospect\.email, "CHECKOUT_STARTED"\)/)
  assert.match(stripeWebhook, /removeLists: \[autoresponderAudiences\.abandonedCheckout\]/)
  assert.match(stripeWebhook, /markAbandonedCheckoutStatus\(email, "CONVERTED"\)/)
})

test("the four-message TinyEmail series includes delays, resume links, and a clear final stop", () => {
  const series = read("docs/marketing/photoview-abandoned-checkout-series.md")

  assert.equal((series.match(/^## Email /gm) ?? []).length, 4)
  assert.match(series, /Email 1 — immediately/)
  assert.match(series, /Email 2 — wait 24 hours/)
  assert.equal((series.match(/wait 48 hours/g) ?? []).length, 2)
  assert.match(series, /\[CUSTOMER_LAST_PURCHASE_ORDER\]/)
  assert.match(series, /last reminder in this series/i)
})
