import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import {
  ADDITIONAL_WEBSITE_MONTHLY_CENTS,
  getAdditionalWebsiteMonthlyTotalCents,
  getAdditionalWebsiteQuantity,
  getLifetimeWebsiteAnnualQuote,
  isWebsitePubliclyAvailable,
  normalizeWebsiteName,
  websiteActivationLabel,
} from "../src/lib/multi-website-rules.ts"
import { findCanonicalAiHelpTopic, formatConciseAiHelpTopicAnswer } from "../src/lib/ai-help-knowledge.ts"

test("multi-website pricing is $1.29 per active add-on", () => {
  assert.equal(ADDITIONAL_WEBSITE_MONTHLY_CENTS, 129)
  assert.equal(getAdditionalWebsiteMonthlyTotalCents(0), 0)
  assert.equal(getAdditionalWebsiteMonthlyTotalCents(3), 387)
  assert.equal(websiteActivationLabel(2), "$2.58/month for 2 additional websites")
})

test("lifetime annual billing charges only through the account anniversary", () => {
  const quote = getLifetimeWebsiteAnnualQuote(
    new Date("2024-01-15T12:00:00.000Z"),
    new Date("2026-07-15T12:00:00.000Z"),
  )
  assert.equal(quote.anniversary.toISOString(), "2027-01-15T12:00:00.000Z")
  assert.ok(quote.balanceCents >= 770 && quote.balanceCents <= 780)
})

test("only active add-on websites count toward billing", () => {
  assert.equal(getAdditionalWebsiteQuantity([
    { billingType: "INCLUDED", status: "ACTIVE" },
    { billingType: "ADD_ON", status: "DRAFT" },
    { billingType: "ADD_ON", status: "ACTIVE" },
    { billingType: "ADD_ON", status: "DELETED" },
  ]), 1)
})

test("a website is public only while active", () => {
  assert.equal(isWebsitePubliclyAvailable("ACTIVE"), true)
  assert.equal(isWebsitePubliclyAvailable("DRAFT"), false)
  assert.equal(isWebsitePubliclyAvailable("BILLING_FAILED"), false)
  assert.equal(isWebsitePubliclyAvailable("DISABLED"), false)
  assert.equal(isWebsitePubliclyAvailable("DELETED"), false)
})

test("website names are normalized and capped", () => {
  assert.equal(normalizeWebsiteName("  Weddings   and   Events  "), "Weddings and Events")
  assert.equal(normalizeWebsiteName("x".repeat(100)).length, 80)
})

test("migration preserves the current website and does not grant URLs to new drafts", async () => {
  const migration = await readFile(new URL("../prisma/migrations/20261019190000_multi_website_foundation/migration.sql", import.meta.url), "utf8")
  const createRoute = await readFile(new URL("../src/app/api/websites/route.ts", import.meta.url), "utf8")
  assert.match(migration, /INSERT INTO "Website"/)
  assert.match(migration, /'INCLUDED'::"WebsiteBillingType"/)
  assert.match(migration, /photoviewpro-website-published/)
  assert.match(createRoute, /status: "DRAFT"/)
  assert.doesNotMatch(createRoute, /subdomain:/)
})

test("add-on billing stays on the existing renewal with no proration", async () => {
  const billing = await readFile(new URL("../src/lib/additional-website-billing.ts", import.meta.url), "utf8")
  const activation = await readFile(new URL("../src/lib/website-activation.ts", import.meta.url), "utf8")
  assert.match(billing, /proration_behavior: "none"/)
  assert.match(billing, /subscription: stripeSubscriptionId/)
  assert.match(activation, /await setAdditionalWebsiteQuantity/)
  assert.match(activation, /status: "ACTIVE"/)
  assert.match(activation, /subdomain,/)
})

test("draft, preview, publish, address, and domain operations stay website scoped", async () => {
  const dashboard = await readFile(new URL("../src/components/portfolio/portfolio-dashboard.tsx", import.meta.url), "utf8")
  const preview = await readFile(new URL("../src/components/site/website-draft-preview.tsx", import.meta.url), "utf8")
  const draftRoute = await readFile(new URL("../src/app/api/website/draft/route.ts", import.meta.url), "utf8")
  const domainRoute = await readFile(new URL("../src/app/api/website/domain/route.ts", import.meta.url), "utf8")
  assert.match(dashboard, /websiteId=\$\{encodeURIComponent\(activeWebsiteId\)\}/)
  assert.match(preview, /currentWebsiteQuery/)
  assert.match(draftRoute, /getOwnedWebsite\(workspace\.id, requestedWebsiteId\(request\)\)/)
  assert.match(domainRoute, /getOwnedWebsite\(workspaceId, websiteId\)/)
})

test("public lookup serves only active first-class website publications", async () => {
  const publication = await readFile(new URL("../src/lib/website-publication.ts", import.meta.url), "utf8")
  assert.match(publication, /publishedBody: \{ not: null \}/)
  assert.match(publication, /status: "ACTIVE"/)
  assert.match(publication, /subdomain: publicSiteSlug/)
  assert.match(publication, /customDomainVerifiedAt: \{ not: null \}/)
})

test("Stripe subscription webhooks keep the base plan separate from the website add-on item", async () => {
  const fulfillment = await readFile(new URL("../src/lib/stripe-webhook-fulfillment.ts", import.meta.url), "utf8")
  assert.match(fulfillment, /resolveStripePlan/)
  assert.match(fulfillment, /STRIPE_ADDITIONAL_WEBSITE_MONTHLY_PRICE_ID/)
  assert.match(fulfillment, /additionalWebsiteStripeItemId/)
  assert.match(fulfillment, /additionalWebsiteQuantity/)
})

test("lifetime website activation offers monthly or prorated annual checkout", async () => {
  const checkout = await readFile(new URL("../src/lib/lifetime-website-billing.ts", import.meta.url), "utf8")
  const activation = await readFile(new URL("../src/app/api/websites/[websiteId]/activate/route.ts", import.meta.url), "utf8")
  const fulfillment = await readFile(new URL("../src/lib/stripe-webhook-fulfillment.ts", import.meta.url), "utf8")
  assert.match(checkout, /first partial year/)
  assert.match(checkout, /trial_end/)
  assert.match(checkout, /mode: "subscription"/)
  assert.match(checkout, /integration_identifier/)
  assert.doesNotMatch(checkout, /payment_method_types/)
  assert.match(activation, /billingChoice: z\.enum\(\["annual", "monthly"\]\)/)
  assert.match(fulfillment, /lifetime_additional_website/)
})

test("health checks open a critical incident for website billing quantity mismatches", async () => {
  const health = await readFile(new URL("../src/app/api/health/check/route.ts", import.meta.url), "utf8")
  assert.match(health, /health:additional-website-quantity/)
  assert.match(health, /activeQuantity === billedQuantity/)
  assert.match(health, /stripeClient\.subscriptions\.retrieve/)
  assert.match(health, /stripeQuantity === billedQuantity/)
  assert.match(health, /severity: "CRITICAL"/)
})

test("health checks do not report temporary Stripe lookup failures as billing mismatches", async () => {
  const health = await readFile(new URL("../src/app/api/health/check/route.ts", import.meta.url), "utf8")
  assert.match(health, /subscriptionsWithWebsiteBilling/)
  assert.match(health, /additionalWebsiteQuantity > 0/)
  assert.match(health, /STRIPE_READ_CONCURRENCY = 5/)
  assert.match(health, /STRIPE_READ_ATTEMPTS = 3/)
  assert.match(health, /stripeQuantity === null \|\| stripeQuantity === billedQuantity/)
  assert.match(health, /health:stripe-website-quantity-verification/)
  assert.match(health, /severity: "WARNING"/)
})

test("the public site explains unlimited drafts and $1.29 activated websites", async () => {
  const page = await readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8")
  const header = await readFile(new URL("../src/components/site/site-header.tsx", import.meta.url), "utf8")
  assert.match(page, /Create unlimited website drafts/)
  assert.match(page, /\$1\.29 per month/)
  assert.match(page, /custom domain/)
  assert.match(page, /One body of work\. A website for every audience\./)
  assert.match(page, /data-testid="homepage-multiple-websites"/)
  assert.match(page, /M\.R\. Fine Art/)
  assert.match(page, /Russo \/ Studio/)
  assert.match(page, /Field Notes/)
  assert.match(page, /View collection/)
  assert.match(page, /View case study/)
  assert.match(page, /Read the story/)
  assert.match(header, /\["Websites", "\/#multiple-websites"\]/)
})

test("Help and Ask AI explain how to activate additional websites", async () => {
  const questions = [
    "How do I activate another website?",
    "How can I publish a second website?",
    "How does lifetime website billing work?",
  ]
  for (const question of questions) {
    assert.equal(findCanonicalAiHelpTopic(question)?.title, "Managing multiple websites", question)
  }

  const topic = findCanonicalAiHelpTopic(questions[0])
  assert.ok(topic)
  const answer = formatConciseAiHelpTopicAnswer(topic)
  assert.match(answer, /Settings, My Websites/)
  assert.match(answer, /Create free draft/)
  assert.match(answer, /Activate this website/)
  assert.match(answer, /Lifetime accounts/)
  assert.match(answer, /Stripe Checkout/)

  const settingsModel = await readFile(new URL("../src/components/portfolio/portfolio-dashboard-model.ts", import.meta.url), "utf8")
  const userGuide = await readFile(new URL("../docs/User-Guide.md", import.meta.url), "utf8")
  assert.match(settingsModel, /Draft has no public URL|draft has no public URL/i)
  assert.match(settingsModel, /lifetime accounts choose monthly billing or the displayed prorated annual balance/)
  assert.match(userGuide, /Create and activate more than one website/)
  assert.match(userGuide, /PhotoView assigns the public URL only after activation succeeds/)
})

test("AI help gives the exact menu path for a custom website URL", () => {
  const questions = [
    "How do I add a custom URL to my website?",
    "Where is the custom domain setup?",
    "How do I connect my own domain?",
  ]

  for (const question of questions) {
    assert.equal(findCanonicalAiHelpTopic(question)?.title, "Website address and custom domain", question)
  }

  const topic = findCanonicalAiHelpTopic(questions[0])
  assert.ok(topic)
  const answer = formatConciseAiHelpTopicAnswer(topic)
  assert.match(answer, /My Website/)
  assert.match(answer, /website dropdown/)
  assert.match(answer, /Address in the builder's top toolbar/)
  assert.match(answer, /must be activated/)
  assert.match(answer, /Purchased custom domain/)
  assert.match(answer, /Connect domain/)
})

test("My Website opens an account-backed selector and the builder identifies the selected website", async () => {
  const dashboard = await readFile(new URL("../src/components/portfolio/portfolio-dashboard.tsx", import.meta.url), "utf8")
  const toolbar = await readFile(new URL("../src/components/portfolio/website-builder/website-builder-toolbar.tsx", import.meta.url), "utf8")
  const help = await readFile(new URL("../src/lib/ai-help-knowledge.ts", import.meta.url), "utf8")

  assert.match(dashboard, /data-testid="dashboard-website-selector"/)
  assert.match(dashboard, /fetch\("\/api\/websites"/)
  assert.match(dashboard, /websiteChoices\.map/)
  assert.match(dashboard, /selectWebsiteToEdit\(website\.id\)/)
  assert.match(dashboard, /websiteName=\{activeWebsiteName\}/)
  assert.match(toolbar, /data-testid="website-builder-active-name"/)
  assert.match(toolbar, /Editing website/)
  assert.match(toolbar, /\{websiteName\}/)
  assert.match(help, /Select My Website in the dashboard menu, then choose the website you want to edit from the dropdown/)
})
