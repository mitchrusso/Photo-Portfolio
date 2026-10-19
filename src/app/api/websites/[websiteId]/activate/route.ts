import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { AdditionalWebsiteBillingError } from "@/lib/additional-website-billing"
import { ensureWorkspaceForSession } from "@/lib/dev-workspace"
import { serializeWebsiteSummary } from "@/lib/multi-website"
import { isSameOriginRequest } from "@/lib/request-origin"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"
import { activateAdditionalWebsite, WebsiteActivationError } from "@/lib/website-activation"
import { getPrismaClient } from "@/lib/db"
import { getAppUrl } from "@/lib/app-url"
import { createLifetimeWebsiteCheckout, getLifetimeWebsiteAnnualQuote } from "@/lib/lifetime-website-billing"

const activationSchema = z.object({
  billingChoice: z.enum(["annual", "monthly"]).optional(),
  subdomain: z.string().trim().min(1).max(63),
})

export async function GET(_request: Request, { params }: { params: Promise<{ websiteId: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { websiteId } = await params
  const subscription = await getPrismaClient().subscription.findUnique({
    select: { additionalWebsitePriceId: true, createdAt: true, lifetimeAccess: true },
    where: { workspaceId: session.user.workspaceId },
  })
  const website = await getPrismaClient().website.findFirst({ select: { id: true }, where: { deletedAt: null, id: websiteId, workspaceId: session.user.workspaceId } })
  if (!website || !subscription) return NextResponse.json({ error: "Website or subscription not found" }, { status: 404 })
  const quote = getLifetimeWebsiteAnnualQuote(subscription.createdAt)
  return NextResponse.json({
    annualBalanceCents: quote.balanceCents,
    annualRenewsAt: quote.anniversary.toISOString(),
    existingBillingChoice: subscription.additionalWebsitePriceId === process.env.STRIPE_ADDITIONAL_WEBSITE_MONTHLY_PRICE_ID
      ? "monthly"
      : subscription.additionalWebsitePriceId === process.env.STRIPE_ADDITIONAL_WEBSITE_ANNUAL_PRICE_ID
        ? "annual"
        : null,
    lifetimeAccess: subscription.lifetimeAccess,
  })
}

export async function POST(request: Request, { params }: { params: Promise<{ websiteId: string }> }) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const writeBlock = await getSubscriptionWriteBlock(session.user.workspaceId)
  if (writeBlock) return writeBlock
  const workspace = await ensureWorkspaceForSession(session.user.workspaceId)
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  const parsed = activationSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Choose a PhotoView.io address before activation." }, { status: 400 })
  const { websiteId } = await params

  try {
    const subscription = await getPrismaClient().subscription.findUnique({
      select: { additionalWebsiteStripeSubscriptionId: true, lifetimeAccess: true },
      where: { workspaceId: workspace.id },
    })
    if (subscription?.lifetimeAccess && !subscription.additionalWebsiteStripeSubscriptionId) {
      if (!parsed.data.billingChoice) {
        return NextResponse.json({ code: "billing_choice_required", error: "Choose monthly billing or the prorated annual balance." }, { status: 400 })
      }
      const checkout = await createLifetimeWebsiteCheckout({
        appUrl: getAppUrl(request),
        billingChoice: parsed.data.billingChoice,
        requestedSubdomain: parsed.data.subdomain,
        websiteId,
        workspaceId: workspace.id,
      })
      return NextResponse.json({ checkoutUrl: checkout.checkoutUrl })
    }
    const website = await activateAdditionalWebsite({
      requestedSubdomain: parsed.data.subdomain,
      websiteId,
      workspaceId: workspace.id,
    })
    return NextResponse.json({
      billing: "The $1.29 monthly equivalent is consolidated onto your existing subscription and begins on its next renewal date. No prorated charge was created.",
      website: serializeWebsiteSummary(website),
    })
  } catch (error) {
    if (error instanceof WebsiteActivationError || error instanceof AdditionalWebsiteBillingError) {
      return NextResponse.json({ code: error.code, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "The website could not be activated. No URL was assigned." }, { status: 502 })
  }
}
