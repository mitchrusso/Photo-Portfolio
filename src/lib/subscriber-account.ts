import { getPrismaClient } from "@/lib/db"
import { getSubscriberPlanIndex, subscriberPlans } from "@/lib/plans"
import { getReferralProgramSummary, type ReferralProgramSummary } from "@/lib/referrals"

export type SubscriberAccountSummary = {
  autoRolloverEnabled: boolean
  billingCycle: "MONTHLY" | "ANNUAL" | null
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
  currentPeriodStart: string | null
  nextPlanSlug: string | null
  overagePolicy: "ASK_FIRST" | "AUTO_UPGRADE_NEXT_TIER" | "AUTO_BUY_BLOCKS"
  planName: string
  planSlug: string
  referral: ReferralProgramSummary
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  status: string
  storageLimitBytes: number
  storagePercent: number
  storageUsedBytes: number
  subscriptionId: string
  trialEndsAt: string | null
  workspaceName: string
  workspaceSlug: string
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

function getNextPlanSlug(planSlug: string) {
  const index = getSubscriberPlanIndex(planSlug)
  if (index < 0 || index >= subscriberPlans.length - 1) return null
  return subscriberPlans[index + 1].slug
}

export function formatAccountBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(bytes >= 10 * 1024 ** 3 ? 0 : 1)} GB`
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

export async function getSubscriberAccountSummary(workspaceId?: string | null): Promise<SubscriberAccountSummary | null> {
  if (!workspaceId) return null
  if (!process.env.DATABASE_URL) return null

  const prisma = getPrismaClient()
  const workspace = await prisma.workspace.findUnique({
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
    },
    where: {
      id: workspaceId,
    },
  })

  if (!workspace?.subscription) return null

  const subscription = workspace.subscription
  const storageUsedBytes = numberFromBigInt(workspace.storageUsedBytes)
  const storageLimitBytes = numberFromBigInt(workspace.storageLimitBytes) + numberFromBigInt(subscription.storagePurchasedBytes)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://photoview.io"
  const referral = await getReferralProgramSummary({
    appUrl,
    workspaceSlug: workspace.slug,
  })

  return {
    autoRolloverEnabled: subscription.autoRolloverEnabled,
    billingCycle: subscription.billingCycle,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentPeriodEnd: iso(subscription.currentPeriodEnd),
    currentPeriodStart: iso(subscription.currentPeriodStart),
    nextPlanSlug: getNextPlanSlug(subscription.plan.slug),
    overagePolicy: subscription.overagePolicy,
    planName: subscription.plan.name,
    planSlug: subscription.plan.slug,
    referral,
    stripeCustomerId: subscription.stripeCustomerId,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    status: subscription.status,
    storageLimitBytes,
    storagePercent: percent(storageUsedBytes, storageLimitBytes),
    storageUsedBytes,
    subscriptionId: subscription.id,
    trialEndsAt: iso(subscription.trialEndsAt),
    workspaceName: workspace.name,
    workspaceSlug: workspace.slug,
  }
}
