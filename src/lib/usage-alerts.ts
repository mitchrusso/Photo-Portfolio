import { autoresponderTags, notifyAutoresponder } from "@/lib/autoresponder"
import { getPrismaClient } from "@/lib/db"
import { sendUsageWarningEmail } from "@/lib/lifecycle-email"

type UsageAlertLevel = 0 | 75 | 90 | 100

type UsageCheckOptions = {
  workspaceId?: string
}

type UsageAlertResult = {
  bandwidthAlertsSent: number
  bandwidthEmailsSent: number
  checked: number
  resetAlerts: number
  storageAlertsSent: number
  storageEmailsSent: number
}

function numberFromBigInt(value: bigint | number | null | undefined) {
  if (typeof value === "bigint") return Number(value)
  return value ?? 0
}

function getUsagePercent(used: number, limit: number) {
  if (limit <= 0) return 0
  return Math.max(0, (used / limit) * 100)
}

export function getUsageAlertLevel(percent: number): UsageAlertLevel {
  if (percent >= 100) return 100
  if (percent >= 90) return 90
  if (percent >= 75) return 75
  return 0
}

function getStorageTags(level: UsageAlertLevel) {
  if (level === 100) return [autoresponderTags.storageExceeded]
  if (level === 90) return [autoresponderTags.storage90]
  if (level === 75) return [autoresponderTags.storage75]
  return []
}

function getBandwidthTags(level: UsageAlertLevel) {
  if (level === 100) return [autoresponderTags.bandwidthExceeded]
  if (level === 90) return [autoresponderTags.bandwidth90]
  if (level === 75) return [autoresponderTags.bandwidth75]
  return []
}

async function getSubscriptionsForUsageCheck(options: UsageCheckOptions) {
  const prisma = getPrismaClient()

  return prisma.subscription.findMany({
    include: {
      plan: true,
      workspace: {
        include: {
          members: {
            include: {
              user: true,
            },
            orderBy: [
              { role: "asc" },
              { createdAt: "asc" },
            ],
          },
        },
      },
    },
    where: {
      status: {
        in: ["ACTIVE", "TRIALING", "PAST_DUE"],
      },
      workspaceId: options.workspaceId,
    },
  })
}

type SubscriptionForUsageCheck = Awaited<ReturnType<typeof getSubscriptionsForUsageCheck>>[number]

function getOwner(subscription: SubscriptionForUsageCheck) {
  return subscription.workspace.members.find((member) => member.role === "OWNER") ?? subscription.workspace.members[0]
}

function getNotificationEmail(subscription: SubscriptionForUsageCheck) {
  const owner = getOwner(subscription)
  return subscription.workspace.supportEmail ?? owner?.user.email ?? null
}

async function sendUsageAlert({
  accountUrl,
  email,
  firstName,
  lastName,
  level,
  limit,
  metric,
  overagePolicy,
  planSlug,
  used,
  workspaceName,
}: {
  accountUrl: string
  email: string
  firstName?: string | null
  lastName?: string | null
  level: UsageAlertLevel
  limit: number
  metric: "storage" | "bandwidth"
  overagePolicy: string
  planSlug: string
  used: number
  workspaceName: string
}) {
  const addTags = metric === "storage" ? getStorageTags(level) : getBandwidthTags(level)
  if (!addTags.length) return "not_needed"
  const activeLevel = level as 75 | 90 | 100

  const autoresponderStatus = await notifyAutoresponder({
    addTags,
    email,
    event: `${metric}_threshold_reached`,
    firstName: firstName ?? undefined,
    lastName: lastName ?? undefined,
    metadata: {
      limitBytes: limit,
      metric,
      overagePolicy,
      percentUsed: Math.round(getUsagePercent(used, limit)),
      planSlug,
      threshold: level,
      usedBytes: used,
      workspaceName,
    },
  })
  const emailStatus = await sendUsageWarningEmail(email, {
    accountUrl,
    firstName,
    level: activeLevel,
    limitBytes: limit,
    metric,
    usedBytes: used,
    workspaceName,
  })

  return { autoresponderStatus, emailStatus }
}

export async function checkSubscriberUsageThresholds(options: UsageCheckOptions = {}): Promise<UsageAlertResult> {
  const prisma = getPrismaClient()
  const subscriptions = await getSubscriptionsForUsageCheck(options)
  const result: UsageAlertResult = {
    bandwidthAlertsSent: 0,
    bandwidthEmailsSent: 0,
    checked: subscriptions.length,
    resetAlerts: 0,
    storageAlertsSent: 0,
    storageEmailsSent: 0,
  }
  const accountUrl = `${(process.env.NEXT_PUBLIC_APP_URL ?? "https://photo-portfolio-azure.vercel.app").replace(/\/+$/, "")}/account`

  for (const subscription of subscriptions) {
    const owner = getOwner(subscription)
    const email = getNotificationEmail(subscription)
    const storageUsed = numberFromBigInt(subscription.workspace.storageUsedBytes)
    const storageLimit = numberFromBigInt(subscription.workspace.storageLimitBytes) + numberFromBigInt(subscription.storagePurchasedBytes)
    const bandwidthUsed = numberFromBigInt(subscription.bandwidthUsedBytes)
    const bandwidthLimit = numberFromBigInt(subscription.bandwidthLimitBytes)
    const storageLevel = getUsageAlertLevel(getUsagePercent(storageUsed, storageLimit))
    const bandwidthLevel = getUsageAlertLevel(getUsagePercent(bandwidthUsed, bandwidthLimit))
    const updates: {
      bandwidthAlertLevel?: number
      bandwidthWarningSentAt?: Date
      storageAlertLevel?: number
      storageWarningSentAt?: Date
    } = {}

    if (email && storageLevel > subscription.storageAlertLevel) {
      const status = await sendUsageAlert({
        accountUrl,
        email,
        firstName: owner?.user.firstName,
        lastName: owner?.user.lastName,
        level: storageLevel,
        limit: storageLimit,
        metric: "storage",
        overagePolicy: subscription.overagePolicy,
        planSlug: subscription.plan.slug,
        used: storageUsed,
        workspaceName: subscription.workspace.name,
      })

      if (status !== "not_needed" && status.autoresponderStatus === "sent") result.storageAlertsSent += 1
      if (status !== "not_needed" && status.emailStatus === "sent") result.storageEmailsSent += 1
      updates.storageAlertLevel = storageLevel
      updates.storageWarningSentAt = new Date()
    } else if (storageLevel < subscription.storageAlertLevel) {
      updates.storageAlertLevel = storageLevel
      result.resetAlerts += 1
    }

    if (email && bandwidthLevel > subscription.bandwidthAlertLevel) {
      const status = await sendUsageAlert({
        accountUrl,
        email,
        firstName: owner?.user.firstName,
        lastName: owner?.user.lastName,
        level: bandwidthLevel,
        limit: bandwidthLimit,
        metric: "bandwidth",
        overagePolicy: subscription.overagePolicy,
        planSlug: subscription.plan.slug,
        used: bandwidthUsed,
        workspaceName: subscription.workspace.name,
      })

      if (status !== "not_needed" && status.autoresponderStatus === "sent") result.bandwidthAlertsSent += 1
      if (status !== "not_needed" && status.emailStatus === "sent") result.bandwidthEmailsSent += 1
      updates.bandwidthAlertLevel = bandwidthLevel
      updates.bandwidthWarningSentAt = new Date()
    } else if (bandwidthLevel < subscription.bandwidthAlertLevel) {
      updates.bandwidthAlertLevel = bandwidthLevel
      result.resetAlerts += 1
    }

    if (Object.keys(updates).length) {
      await prisma.subscription.update({
        data: updates,
        where: {
          id: subscription.id,
        },
      })
    }
  }

  return result
}
