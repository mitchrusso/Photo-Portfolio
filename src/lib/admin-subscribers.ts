import { getPrismaClient } from "@/lib/db"

export type AdminSubscriberRow = {
  autoRolloverEnabled: boolean
  bandwidthLimitBytes: number
  bandwidthPercent: number
  bandwidthUsedBytes: number
  billingCycle: string
  cancelAtPeriodEnd: boolean
  clientCount: number
  currentPeriodEnd: string | null
  galleryCount: number
  ownerEmail: string
  ownerName: string
  photoCount: number
  planName: string
  planSlug: string
  status: string
  storageLimitBytes: number
  storagePercent: number
  storageUsedBytes: number
  stripeConnected: boolean
  trialEndsAt: string | null
  workspaceId: string
  workspaceName: string
  workspaceSlug: string
}

export type AdminSubscriberSummary = {
  active: number
  canceled: number
  pastDue: number
  stripeConnected: number
  total: number
  trialing: number
}

function numberFromBigInt(value: bigint | number | null | undefined) {
  if (typeof value === "bigint") return Number(value)
  return value ?? 0
}

function percent(used: number, limit: number) {
  if (limit <= 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : null
}

export async function getAdminSubscribers() {
  const prisma = getPrismaClient()
  const workspaces = await prisma.workspace.findMany({
    include: {
      _count: {
        select: {
          clients: true,
          galleries: true,
        },
      },
      galleries: {
        select: {
          _count: {
            select: {
              photos: true,
            },
          },
        },
      },
      members: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "asc",
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
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
  })

  const rows: AdminSubscriberRow[] = workspaces
    .filter((workspace) => workspace.subscription)
    .map((workspace) => {
      const subscription = workspace.subscription!
      const owner = workspace.members[0]?.user
      const storageUsedBytes = numberFromBigInt(workspace.storageUsedBytes)
      const storageLimitBytes = numberFromBigInt(workspace.storageLimitBytes) + numberFromBigInt(subscription.storagePurchasedBytes)
      const bandwidthUsedBytes = numberFromBigInt(subscription.bandwidthUsedBytes)
      const bandwidthLimitBytes = numberFromBigInt(subscription.bandwidthLimitBytes)
      const photoCount = workspace.galleries.reduce((total, gallery) => total + gallery._count.photos, 0)

      return {
        autoRolloverEnabled: subscription.autoRolloverEnabled,
        bandwidthLimitBytes,
        bandwidthPercent: percent(bandwidthUsedBytes, bandwidthLimitBytes),
        bandwidthUsedBytes,
        billingCycle: subscription.billingCycle ?? "NOT_SET",
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        clientCount: workspace._count.clients,
        currentPeriodEnd: iso(subscription.currentPeriodEnd),
        galleryCount: workspace._count.galleries,
        ownerEmail: owner?.email ?? workspace.supportEmail ?? "Unknown",
        ownerName: owner?.name ?? workspace.ownerName ?? "Unknown",
        photoCount,
        planName: subscription.plan.name,
        planSlug: subscription.plan.slug,
        status: subscription.status,
        storageLimitBytes,
        storagePercent: percent(storageUsedBytes, storageLimitBytes),
        storageUsedBytes,
        stripeConnected: Boolean(subscription.stripeCustomerId),
        trialEndsAt: iso(subscription.trialEndsAt),
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        workspaceSlug: workspace.slug,
      }
    })

  const summary: AdminSubscriberSummary = {
    active: rows.filter((row) => row.status === "ACTIVE").length,
    canceled: rows.filter((row) => row.status === "CANCELED").length,
    pastDue: rows.filter((row) => ["PAST_DUE", "UNPAID"].includes(row.status)).length,
    stripeConnected: rows.filter((row) => row.stripeConnected).length,
    total: rows.length,
    trialing: rows.filter((row) => row.status === "TRIALING").length,
  }

  return {
    rows,
    summary,
  }
}
