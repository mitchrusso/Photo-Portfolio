import { getPrismaClient } from "@/lib/db"

export type AdminSubscriberRow = {
  autoRolloverEnabled: boolean
  bandwidthLimitBytes: number
  bandwidthPercent: number
  bandwidthUsedBytes: number
  billingCycle: string
  cancelAtPeriodEnd: boolean
  clientCount: number
  createdAt: string
  currentPeriodEnd: string | null
  galleryCount: number
  ownerEmail: string
  ownerName: string
  photoCount: number
  planAnnualPriceCents: number | null
  planMonthlyPriceCents: number
  planName: string
  planSlug: string
  status: string
  storageLimitBytes: number
  storagePercent: number
  storageUsedBytes: number
  stripeConnected: boolean
  trialStartedAt: string | null
  trialEndsAt: string | null
  workspaceId: string
  workspaceName: string
  workspaceSlug: string
}

export type AdminSubscriberSummary = {
  active: number
  activeArrCents: number
  activeMrrCents: number
  bandwidthLimitBytes: number
  bandwidthUsedBytes: number
  canceled: number
  galleryCount: number
  needsAttention: number
  pastDue: number
  photoCount: number
  planCounts: Array<{
    count: number
    planName: string
    planSlug: string
  }>
  stripeConnected: number
  storageLimitBytes: number
  storageUsedBytes: number
  total: number
  trialing: number
  trialPipelineArrCents: number
  trialPipelineMrrCents: number
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

function monthlyValueCents(row: AdminSubscriberRow) {
  const plan = row.planMonthlyPriceCents
  if (row.billingCycle === "ANNUAL" && row.planAnnualPriceCents) return Math.round(row.planAnnualPriceCents / 12)
  return plan
}

function annualValueCents(row: AdminSubscriberRow) {
  if (row.billingCycle === "MONTHLY") return row.planMonthlyPriceCents * 12
  return row.planAnnualPriceCents ?? row.planMonthlyPriceCents * 12
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
        createdAt: iso(workspace.createdAt) ?? new Date().toISOString(),
        galleryCount: workspace._count.galleries,
        ownerEmail: owner?.email ?? workspace.supportEmail ?? "Unknown",
        ownerName: owner?.name ?? workspace.ownerName ?? "Unknown",
        photoCount,
        planAnnualPriceCents: subscription.plan.annualPriceCents,
        planMonthlyPriceCents: subscription.plan.monthlyPriceCents,
        planName: subscription.plan.name,
        planSlug: subscription.plan.slug,
        status: subscription.status,
        storageLimitBytes,
        storagePercent: percent(storageUsedBytes, storageLimitBytes),
        storageUsedBytes,
        stripeConnected: Boolean(subscription.stripeCustomerId),
        trialStartedAt: iso(subscription.trialStartedAt),
        trialEndsAt: iso(subscription.trialEndsAt),
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        workspaceSlug: workspace.slug,
      }
    })

  const activeRows = rows.filter((row) => row.status === "ACTIVE")
  const trialRows = rows.filter((row) => row.status === "TRIALING")
  const needsAttentionRows = rows.filter((row) =>
    row.storagePercent >= 90 ||
    row.bandwidthPercent >= 90 ||
    ["PAST_DUE", "UNPAID", "CANCELED"].includes(row.status) ||
    row.cancelAtPeriodEnd,
  )
  const planCounts = Array.from(
    rows.reduce((counts, row) => {
      const current = counts.get(row.planSlug) ?? { count: 0, planName: row.planName, planSlug: row.planSlug }
      current.count += 1
      counts.set(row.planSlug, current)
      return counts
    }, new Map<string, { count: number; planName: string; planSlug: string }>()),
  ).map(([, value]) => value)

  const summary: AdminSubscriberSummary = {
    active: activeRows.length,
    activeArrCents: activeRows.reduce((sum, row) => sum + annualValueCents(row), 0),
    activeMrrCents: activeRows.reduce((sum, row) => sum + monthlyValueCents(row), 0),
    bandwidthLimitBytes: rows.reduce((sum, row) => sum + row.bandwidthLimitBytes, 0),
    bandwidthUsedBytes: rows.reduce((sum, row) => sum + row.bandwidthUsedBytes, 0),
    canceled: rows.filter((row) => row.status === "CANCELED").length,
    galleryCount: rows.reduce((sum, row) => sum + row.galleryCount, 0),
    needsAttention: needsAttentionRows.length,
    pastDue: rows.filter((row) => ["PAST_DUE", "UNPAID"].includes(row.status)).length,
    photoCount: rows.reduce((sum, row) => sum + row.photoCount, 0),
    planCounts,
    stripeConnected: rows.filter((row) => row.stripeConnected).length,
    storageLimitBytes: rows.reduce((sum, row) => sum + row.storageLimitBytes, 0),
    storageUsedBytes: rows.reduce((sum, row) => sum + row.storageUsedBytes, 0),
    total: rows.length,
    trialing: trialRows.length,
    trialPipelineArrCents: trialRows.reduce((sum, row) => sum + annualValueCents(row), 0),
    trialPipelineMrrCents: trialRows.reduce((sum, row) => sum + monthlyValueCents(row), 0),
  }

  return {
    rows,
    summary,
  }
}
