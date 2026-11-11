import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { getAppUrl } from "@/lib/app-url"
import { getPrismaClient } from "@/lib/db"
import { getPlanPriceId, getSubscriberPlan } from "@/lib/plans"
import { isSameOriginRequest } from "@/lib/request-origin"
import {
  createStripeCheckoutSession,
  customerHasOpenStripeSubscription,
  hasStripeCheckoutConfig,
} from "@/lib/stripe-rest"

const COMEBACK_TRIAL_DAYS = 14
const COMEBACK_SOURCE = "comeback_trial_2026_11"

function splitName(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean)
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user?.workspaceId) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 })
  }

  const prisma = getPrismaClient()
  const workspace = await prisma.workspace.findUnique({
    include: {
      members: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
        where: { role: "OWNER" },
      },
      subscription: { include: { plan: true } },
    },
    where: { id: session.user.workspaceId },
  })
  const subscription = workspace?.subscription
  const owner = workspace?.members[0]?.user

  if (!workspace || !subscription || !owner) {
    return NextResponse.redirect(new URL("/account?billing=account-missing", request.url), { status: 303 })
  }
  if (subscription.status !== "CANCELED") {
    return NextResponse.redirect(new URL("/account?billing=comeback-not-eligible", request.url), { status: 303 })
  }
  if (subscription.comebackTrialRedeemedAt) {
    return NextResponse.redirect(new URL("/account?billing=comeback-already-used", request.url), { status: 303 })
  }
  if (subscription.stripeCustomerId && await customerHasOpenStripeSubscription(subscription.stripeCustomerId)) {
    return NextResponse.redirect(new URL("/account?billing=comeback-billing-active", request.url), { status: 303 })
  }

  const plan = getSubscriberPlan(subscription.plan.slug)
  const billingCycle = subscription.billingCycle === "MONTHLY" ? "monthly" : "annual"
  const priceId = getPlanPriceId(plan, billingCycle)
  if (!hasStripeCheckoutConfig(priceId)) {
    return NextResponse.redirect(new URL("/account?billing=stripe-not-configured", request.url), { status: 303 })
  }

  const appUrl = getAppUrl(request)
  const nameParts = splitName(owner.name)
  const checkout = await createStripeCheckoutSession({
    cancelUrl: `${appUrl}/account?billing=comeback-canceled`,
    customerEmail: owner.email,
    customerId: subscription.stripeCustomerId ?? undefined,
    metadata: {
      billingCycle,
      comebackTrial: "true",
      email: owner.email,
      expectedPriceId: priceId ?? "",
      firstName: owner.firstName ?? nameParts.firstName,
      lastName: owner.lastName ?? nameParts.lastName,
      planSlug: plan.slug,
      source: COMEBACK_SOURCE,
      storageLimitBytes: String(plan.storageLimitBytes),
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
    },
    phone: owner.phone ?? undefined,
    priceId: priceId!,
    successUrl: `${appUrl}/account?billing=comeback-started&session_id={CHECKOUT_SESSION_ID}`,
    trialDays: COMEBACK_TRIAL_DAYS,
  })

  await prisma.$transaction([
    prisma.subscription.update({
      data: {
        comebackOfferCheckoutStartedAt: new Date(),
        stripeCheckoutSessionId: checkout.id,
      },
      where: { id: subscription.id },
    }),
    prisma.trialSignup.updateMany({
      data: { stripeCheckoutSessionId: checkout.id },
      where: { workspaceId: workspace.id },
    }),
  ])

  if (!checkout.url) {
    return NextResponse.redirect(new URL("/account?billing=checkout-error", request.url), { status: 303 })
  }
  return NextResponse.redirect(checkout.url, { status: 303 })
}
