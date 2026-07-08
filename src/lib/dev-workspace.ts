import { getPrismaClient } from "@/lib/db"
import { getSubscriberPlan } from "@/lib/plans"

export const DEVELOPMENT_WORKSPACE_ID = "dev-workspace"
export const DEVELOPMENT_USER_EMAIL = "dev@example.com"
export const DEVELOPMENT_USER_ID = "dev-admin-001"

export async function ensureDevelopmentWorkspace() {
  if (process.env.NODE_ENV === "production" || !process.env.DATABASE_URL) return null

  const prisma = getPrismaClient()
  const plan = getSubscriberPlan("archive")

  return prisma.$transaction(async (tx) => {
    const dbPlan = await tx.plan.upsert({
      create: {
        annualPriceCents: 0,
        bandwidthLimitBytes: BigInt(plan.bandwidthLimitBytes),
        maxUploadBytes: BigInt(plan.maxUploadBytes),
        monthlyPriceCents: 0,
        name: "Developer Sandbox",
        slug: "dev",
        storageLimitBytes: BigInt(plan.storageLimitBytes),
        trialDays: plan.trialDays,
      },
      update: {
        bandwidthLimitBytes: BigInt(plan.bandwidthLimitBytes),
        isActive: true,
        maxUploadBytes: BigInt(plan.maxUploadBytes),
        storageLimitBytes: BigInt(plan.storageLimitBytes),
      },
      where: {
        slug: "dev",
      },
    })

    const user = await tx.user.upsert({
      create: {
        adminPermissions: ["subscribers", "stats", "plans", "financials", "coupons", "audit", "security", "rights"],
        email: DEVELOPMENT_USER_EMAIL,
        id: DEVELOPMENT_USER_ID,
        name: "Dev Admin",
        systemRole: "SUPERADMIN",
      },
      update: {
        adminPermissions: ["subscribers", "stats", "plans", "financials", "coupons", "audit", "security", "rights"],
        name: "Dev Admin",
        systemRole: "SUPERADMIN",
      },
      where: {
        email: DEVELOPMENT_USER_EMAIL,
      },
    })

    const workspace = await tx.workspace.upsert({
      create: {
        id: DEVELOPMENT_WORKSPACE_ID,
        name: "PhotoViewPro Developer Sandbox",
        ownerName: "Dev Admin",
        publicBrandName: "PhotoViewPro",
        slug: "dev",
        storageLimitBytes: BigInt(plan.storageLimitBytes),
        supportEmail: DEVELOPMENT_USER_EMAIL,
      },
      update: {
        name: "PhotoViewPro Developer Sandbox",
        storageLimitBytes: BigInt(plan.storageLimitBytes),
        supportEmail: DEVELOPMENT_USER_EMAIL,
      },
      where: {
        id: DEVELOPMENT_WORKSPACE_ID,
      },
    })

    await tx.workspaceMember.upsert({
      create: {
        role: "OWNER",
        userId: user.id,
        workspaceId: workspace.id,
      },
      update: {
        role: "OWNER",
      },
      where: {
        workspaceId_userId: {
          userId: user.id,
          workspaceId: workspace.id,
        },
      },
    })

    await tx.subscription.upsert({
      create: {
        bandwidthLimitBytes: BigInt(plan.bandwidthLimitBytes),
        maxUploadBytes: BigInt(plan.maxUploadBytes),
        planId: dbPlan.id,
        status: "ACTIVE",
        storagePurchasedBytes: BigInt(0),
        workspaceId: workspace.id,
      },
      update: {
        bandwidthLimitBytes: BigInt(plan.bandwidthLimitBytes),
        maxUploadBytes: BigInt(plan.maxUploadBytes),
        planId: dbPlan.id,
        status: "ACTIVE",
      },
      where: {
        workspaceId: workspace.id,
      },
    })

    return workspace
  })
}

export async function ensureWorkspaceForSession(workspaceId: string) {
  if (!process.env.DATABASE_URL) return null

  if (process.env.NODE_ENV !== "production" && workspaceId === DEVELOPMENT_WORKSPACE_ID) {
    return ensureDevelopmentWorkspace()
  }

  return getPrismaClient().workspace.findUnique({
    select: {
      id: true,
    },
    where: {
      id: workspaceId,
    },
  })
}
