import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 })
  }

  const prisma = getPrismaClient()
  const subscription = await prisma.subscription.findUnique({
    select: {
      id: true,
      status: true,
      stripeCustomerId: true,
    },
    where: {
      workspaceId: session.user.workspaceId,
    },
  })

  if (!subscription) {
    return NextResponse.redirect(new URL("/account?billing=account-missing", request.url), { status: 303 })
  }

  if (subscription.stripeCustomerId) {
    return NextResponse.redirect(new URL("/account?billing=use-portal-to-cancel", request.url), { status: 303 })
  }

  if (subscription.status !== "TRIALING") {
    return NextResponse.redirect(new URL("/account?billing=not-trialing", request.url), { status: 303 })
  }

  await prisma.subscription.update({
    data: {
      status: "CANCELED",
    },
    where: {
      id: subscription.id,
    },
  })

  return NextResponse.redirect(new URL(`/cancel-survey?subscription=${subscription.id}`, request.url), { status: 303 })
}
