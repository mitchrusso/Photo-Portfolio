import { NextResponse } from "next/server"
import { z } from "zod"

import { getPrismaClient } from "@/lib/db"
import { authorizeRepairRunnerRequest } from "@/lib/github-actions-oidc"
import { fulfillStripeWebhookEvent } from "@/lib/stripe-webhook-fulfillment"

const inputSchema = z.object({ email: z.string().trim().toLowerCase().email().max(320) })

export async function POST(request: Request) {
  if (!await authorizeRepairRunnerRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = inputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "A valid subscriber email is required." }, { status: 400 })

  const subscriber = await getPrismaClient().user.findUnique({
    select: {
      memberships: {
        orderBy: { createdAt: "asc" },
        select: {
          workspace: {
            select: {
              subscription: { select: { stripeSubscriptionId: true } },
            },
          },
        },
        where: { role: "OWNER" },
      },
    },
    where: { email: parsed.data.email },
  })
  const stripeSubscriptionId = subscriber?.memberships[0]?.workspace.subscription?.stripeSubscriptionId
  if (!stripeSubscriptionId) {
    return NextResponse.json({ error: "The subscriber does not have a Stripe subscription to reconcile." }, { status: 404 })
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!stripeKey) return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 })
  const stripeResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(stripeSubscriptionId)}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  })
  if (!stripeResponse.ok) {
    return NextResponse.json({ error: "Stripe subscription lookup failed." }, { status: 502 })
  }

  const stripeSubscription = await stripeResponse.json() as Record<string, unknown>
  const result = await fulfillStripeWebhookEvent({
    data: { object: stripeSubscription },
    type: "customer.subscription.updated",
  })
  if (!result.persisted) {
    return NextResponse.json({ error: result.reason || "The subscription could not be reconciled." }, { status: 409 })
  }

  return NextResponse.json({
    billingRecordReconciled: true,
    planName: result.planName,
    workspaceId: result.workspaceId,
  })
}
