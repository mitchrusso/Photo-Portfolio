import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { ensureWorkspaceForSession } from "@/lib/dev-workspace"
import { ADDITIONAL_WEBSITE_MONTHLY_CENTS, normalizeWebsiteName } from "@/lib/multi-website-rules"
import { ensurePrimaryWebsite, serializeWebsiteSummary, websiteSummarySelect } from "@/lib/multi-website"
import { isSameOriginRequest } from "@/lib/request-origin"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"
import { getLifetimeWebsiteAnnualQuote } from "@/lib/lifetime-website-billing"

const createWebsiteSchema = z.object({
  name: z.string().trim().min(1).max(80),
})

async function getAccess() {
  const session = await auth()
  if (!session?.user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  const workspace = await ensureWorkspaceForSession(session.user.workspaceId)
  if (!workspace) return { response: NextResponse.json({ error: "Workspace not found" }, { status: 404 }) }
  return { session, workspace }
}

export async function GET() {
  const access = await getAccess()
  if ("response" in access) return access.response

  await ensurePrimaryWebsite(access.workspace.id)
  const prisma = getPrismaClient()
  const [websites, subscription] = await Promise.all([
    prisma.website.findMany({
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      select: websiteSummarySelect,
      where: { deletedAt: null, workspaceId: access.workspace.id },
    }),
    prisma.subscription.findUnique({
      select: {
        additionalWebsiteQuantity: true,
        billingCycle: true,
        createdAt: true,
        currentPeriodEnd: true,
        additionalWebsitePriceId: true,
        lifetimeAccess: true,
        status: true,
      },
      where: { workspaceId: access.workspace.id },
    }),
  ])
  const lifetimeQuote = subscription?.lifetimeAccess ? getLifetimeWebsiteAnnualQuote(subscription.createdAt) : null

  return NextResponse.json({
    billing: {
      additionalWebsiteMonthlyCents: ADDITIONAL_WEBSITE_MONTHLY_CENTS,
      additionalWebsiteQuantity: subscription?.additionalWebsiteQuantity ?? 0,
      billingCycle: subscription?.billingCycle ?? null,
      currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() ?? null,
      lifetimeAccess: subscription?.lifetimeAccess ?? false,
      lifetimeAnnualBalanceCents: lifetimeQuote?.balanceCents ?? null,
      lifetimeAnnualRenewsAt: lifetimeQuote?.anniversary.toISOString() ?? null,
      lifetimeBillingChoice: subscription?.additionalWebsitePriceId === process.env.STRIPE_ADDITIONAL_WEBSITE_MONTHLY_PRICE_ID
        ? "monthly"
        : subscription?.additionalWebsitePriceId === process.env.STRIPE_ADDITIONAL_WEBSITE_ANNUAL_PRICE_ID
          ? "annual"
          : null,
      subscriptionStatus: subscription?.status ?? null,
    },
    websites: websites.map(serializeWebsiteSummary),
  })
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  }
  const access = await getAccess()
  if ("response" in access) return access.response
  const writeBlock = await getSubscriptionWriteBlock(access.session.user.workspaceId)
  if (writeBlock) return writeBlock

  const parsed = createWebsiteSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a website name between 1 and 80 characters." }, { status: 400 })
  }

  const website = await getPrismaClient().website.create({
    data: {
      billingType: "ADD_ON",
      name: normalizeWebsiteName(parsed.data.name),
      status: "DRAFT",
      workspaceId: access.workspace.id,
    },
    select: websiteSummarySelect,
  })

  return NextResponse.json({
    message: "Draft created. It has no public URL and no charge until you activate it.",
    website: serializeWebsiteSummary(website),
  }, { status: 201 })
}
