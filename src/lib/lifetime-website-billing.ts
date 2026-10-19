import { randomBytes } from "node:crypto"
import Stripe from "stripe"

import { getPrismaClient } from "@/lib/db"
import { normalizePublicSiteSubdomain } from "@/lib/site-domain"
import { AdditionalWebsiteBillingError } from "@/lib/additional-website-billing"
import { getLifetimeWebsiteAnnualQuote } from "@/lib/multi-website-rules"

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new AdditionalWebsiteBillingError("billing_not_configured", "Website billing is temporarily unavailable.", 503)
  return new Stripe(key, { apiVersion: "2026-08-26.dahlia" })
}

function priceId(cycle: "annual" | "monthly") {
  const value = cycle === "annual"
    ? process.env.STRIPE_ADDITIONAL_WEBSITE_ANNUAL_PRICE_ID
    : process.env.STRIPE_ADDITIONAL_WEBSITE_MONTHLY_PRICE_ID
  if (!value) throw new AdditionalWebsiteBillingError("website_price_not_configured", "Website billing is not configured yet.", 503)
  return value
}

export { getLifetimeWebsiteAnnualQuote } from "@/lib/multi-website-rules"

function integrationIdentifier() {
  const suffix = randomBytes(8).toString("hex").slice(0, 8)
  return `photoview-website-${suffix}`
}

export async function createLifetimeWebsiteCheckout({
  appUrl,
  billingChoice,
  requestedSubdomain,
  websiteId,
  workspaceId,
}: {
  appUrl: string
  billingChoice: "annual" | "monthly"
  requestedSubdomain: string
  websiteId: string
  workspaceId: string
}) {
  const subdomain = normalizePublicSiteSubdomain(requestedSubdomain)
  if (!subdomain) throw new AdditionalWebsiteBillingError("invalid_subdomain", "Choose a valid PhotoView.io address.", 400)
  const prisma = getPrismaClient()
  const [website, subscription] = await Promise.all([
    prisma.website.findFirst({ where: { deletedAt: null, id: websiteId, workspaceId } }),
    prisma.subscription.findUnique({
      include: { workspace: { include: { members: { include: { user: true }, orderBy: [{ role: "asc" }, { createdAt: "asc" }] } } } },
      where: { workspaceId },
    }),
  ])
  if (!website || !website.draftBody) throw new AdditionalWebsiteBillingError("website_not_built", "Build and save this website before activating it.", 409)
  if (!subscription?.lifetimeAccess) throw new AdditionalWebsiteBillingError("lifetime_required", "This checkout is only for lifetime accounts.", 409)
  const conflict = await prisma.website.findFirst({ select: { id: true }, where: { id: { not: websiteId }, subdomain } })
  if (conflict) throw new AdditionalWebsiteBillingError("subdomain_in_use", "That PhotoView.io address is already in use.", 409)

  const owner = subscription.workspace.members.find((member) => member.role === "OWNER") ?? subscription.workspace.members[0]
  const quote = getLifetimeWebsiteAnnualQuote(subscription.createdAt)
  const metadata = {
    billingChoice,
    purpose: "lifetime_additional_website",
    subdomain,
    websiteId,
    workspaceId,
  }
  const recurringLine: Stripe.Checkout.SessionCreateParams.LineItem = { price: priceId(billingChoice), quantity: 1 }
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [recurringLine]
  if (billingChoice === "annual") {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "PhotoView.io Additional Website — first partial year" },
        unit_amount: quote.balanceCents,
      },
      quantity: 1,
    })
  }

  await prisma.website.update({ data: { requestedSubdomain: subdomain }, where: { id: websiteId } })
  const session = await stripeClient().checkout.sessions.create({
    cancel_url: `${appUrl}/dashboard?panel=settings&settings=websites&websiteActivation=cancelled`,
    ...(subscription.stripeCustomerId
      ? { customer: subscription.stripeCustomerId }
      : { customer_email: subscription.workspace.supportEmail ?? owner?.user.email ?? undefined }),
    integration_identifier: integrationIdentifier(),
    line_items: lineItems,
    metadata,
    mode: "subscription",
    subscription_data: {
      metadata,
      ...(billingChoice === "annual" ? { trial_end: Math.floor(quote.anniversary.getTime() / 1000) } : {}),
    },
    success_url: `${appUrl}/dashboard?panel=settings&settings=websites&websiteActivation=success`,
  })
  if (!session.url) throw new AdditionalWebsiteBillingError("checkout_unavailable", "Stripe could not open website billing checkout.", 502)
  return { annualBalanceCents: quote.balanceCents, annualRenewsAt: quote.anniversary, checkoutUrl: session.url }
}
