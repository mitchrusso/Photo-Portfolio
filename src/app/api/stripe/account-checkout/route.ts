import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { getPlanPriceEnv, getSubscriberPlan } from "@/lib/plans"
import { createStripeCheckoutSession, hasStripeCheckoutConfig } from "@/lib/stripe-rest"

const accountCheckoutSchema = z.object({
  billingCycle: z.enum(["monthly", "annual"]).default("annual"),
  planSlug: z.string().trim().optional(),
})

function getAppUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
}

function remainingTrialDays(trialEndsAt: Date | null) {
  if (!trialEndsAt) return 0
  const remainingMs = trialEndsAt.getTime() - Date.now()
  if (remainingMs <= 0) return 0
  return Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)))
}

function splitName(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  }
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 })
  }

  const formData = await request.formData().catch(() => null)
  const parsed = accountCheckoutSchema.safeParse({
    billingCycle: String(formData?.get("billingCycle") ?? "annual"),
    planSlug: String(formData?.get("planSlug") ?? ""),
  })
  const requestedPlanSlug = parsed.success ? parsed.data.planSlug : undefined
  const requestedBillingCycle = parsed.success ? parsed.data.billingCycle : "annual"
  const prisma = getPrismaClient()
  const workspace = await prisma.workspace.findUnique({
    include: {
      members: {
        include: {
          user: true,
        },
        where: {
          role: "OWNER",
        },
      },
      subscription: {
        include: {
          plan: true,
        },
      },
    },
    where: {
      id: session.user.workspaceId,
    },
  })

  const subscription = workspace?.subscription
  const owner = workspace?.members[0]?.user

  if (!workspace || !subscription || !owner) {
    return NextResponse.redirect(new URL("/account?billing=account-missing", request.url), { status: 303 })
  }

  if (subscription.stripeCustomerId) {
    return NextResponse.redirect(new URL("/account?billing=use-portal-for-plan", request.url), { status: 303 })
  }

  const plan = getSubscriberPlan(requestedPlanSlug || subscription.plan.slug)
  const billingCycle = requestedBillingCycle || (subscription.billingCycle === "MONTHLY" ? "monthly" : "annual")
  const priceEnv = getPlanPriceEnv(plan, billingCycle)
  const priceId = process.env[priceEnv]

  if (!hasStripeCheckoutConfig(priceId)) {
    return NextResponse.redirect(new URL("/account?billing=stripe-not-configured", request.url), { status: 303 })
  }

  const appUrl = getAppUrl(request)
  const nameParts = splitName(owner.name)
  const checkoutSession = await createStripeCheckoutSession({
    cancelUrl: `${appUrl}/account?billing=checkout-canceled`,
    customerEmail: owner.email,
    metadata: {
      billingCycle,
      email: owner.email,
      firstName: owner.firstName ?? nameParts.firstName,
      lastName: owner.lastName ?? nameParts.lastName,
      planSlug: plan.slug,
      source: "account_checkout",
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
    },
    phone: owner.phone ?? undefined,
    priceId: priceId!,
    successUrl: `${appUrl}/account?billing=checkout-started&session_id={CHECKOUT_SESSION_ID}`,
    trialDays: remainingTrialDays(subscription.trialEndsAt),
  })

  await prisma.$transaction([
    prisma.subscription.update({
      data: {
        stripeCheckoutSessionId: checkoutSession.id,
      },
      where: {
        id: subscription.id,
      },
    }),
    prisma.trialSignup.updateMany({
      data: {
        stripeCheckoutSessionId: checkoutSession.id,
      },
      where: {
        workspaceId: workspace.id,
      },
    }),
  ])

  if (!checkoutSession.url) {
    return NextResponse.redirect(new URL("/account?billing=checkout-error", request.url), { status: 303 })
  }

  return NextResponse.redirect(checkoutSession.url, { status: 303 })
}
