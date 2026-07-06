import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { createStripePortalSession } from "@/lib/stripe-rest"

function getAppUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
}

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
    const portalSession = await createStripePortalSession({
      customerId,
      returnUrl: `${getAppUrl(request)}/account`,
    })

    return NextResponse.redirect(portalSession.url, { status: 303 })
  } catch {
    return NextResponse.redirect(new URL("/account?billing=portal-error", request.url), { status: 303 })
  }
}
