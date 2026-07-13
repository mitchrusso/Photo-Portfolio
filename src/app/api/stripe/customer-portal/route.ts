import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { createStripePortalSession } from "@/lib/stripe-rest"
import { getAppUrl } from "@/lib/app-url"
import { recordOperationalEvent } from "@/lib/operational-monitoring"

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 })
  }

  const prisma = getPrismaClient()
  const workspace = await prisma.workspace.findUnique({
    include: {
      subscription: {
        select: {
          stripeCustomerId: true,
        },
      },
    },
    where: {
      id: session.user.workspaceId,
    },
  })

  const customerId = workspace?.subscription?.stripeCustomerId

  if (!customerId) {
    return NextResponse.redirect(new URL("/account?billing=missing-customer", request.url), { status: 303 })
  }

  try {
    const formData = await request.formData()
    const requestedFlow = formData.get("flow")
    const flowType = requestedFlow === "payment_method_update" ? requestedFlow : undefined
    const portalSession = await createStripePortalSession({
      customerId,
      flowType,
      returnUrl: `${getAppUrl(request)}/account`,
    })

    return NextResponse.redirect(portalSession.url, { status: 303 })
  } catch (error) {
    await recordOperationalEvent({
      category: "BILLING",
      fingerprint: "stripe:customer-portal",
      message: error instanceof Error ? error.message : "Stripe customer portal could not be opened",
      severity: "ERROR",
      source: "/api/stripe/customer-portal",
      workspaceId: session.user.workspaceId,
    })
    return NextResponse.redirect(new URL("/account?billing=portal-error", request.url), { status: 303 })
  }
}
