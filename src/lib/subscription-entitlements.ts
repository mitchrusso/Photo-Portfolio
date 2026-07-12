import { getPrismaClient } from "@/lib/db"
import { subscriberPlans } from "@/lib/plans"
import { evaluateSubscriptionAccess, type SubscriptionAccessDecision } from "@/lib/subscription-access-rules"

export type WorkspaceEntitlement = SubscriptionAccessDecision & {
  galleryCount: number
  galleryLimit: number | null
  maxUploadBytes: number
  storageLimitBytes: number
  storageUsedBytes: number
  subscriptionId: string | null
  workspaceId: string
}

function numberFromBigInt(value: bigint | number | null | undefined) {
  return typeof value === "bigint" ? Number(value) : value ?? 0
}

export async function getWorkspaceEntitlement(workspaceId: string, now = new Date()): Promise<WorkspaceEntitlement> {
  const workspace = await getPrismaClient().workspace.findUnique({
    include: {
      _count: { select: { galleries: true } },
      subscription: { include: { plan: true } },
    },
    where: { id: workspaceId },
  })
  const subscription = workspace?.subscription
  const canonicalPlan = subscription
    ? subscriberPlans.find((plan) => plan.slug === subscription.plan.slug || plan.aliases?.includes(subscription.plan.slug))
    : null
  const access = evaluateSubscriptionAccess(subscription, now)

  return {
    ...access,
    galleryCount: workspace?._count.galleries ?? 0,
    galleryLimit: subscription?.plan.galleryLimit ?? null,
    maxUploadBytes: canonicalPlan?.maxUploadBytes ?? numberFromBigInt(subscription?.maxUploadBytes ?? subscription?.plan.maxUploadBytes),
    storageLimitBytes: (canonicalPlan?.storageLimitBytes ?? numberFromBigInt(workspace?.storageLimitBytes)) + numberFromBigInt(subscription?.storagePurchasedBytes),
    storageUsedBytes: numberFromBigInt(workspace?.storageUsedBytes),
    subscriptionId: subscription?.id ?? null,
    workspaceId,
  }
}

export class SubscriptionWriteError extends Error {
  code: string
  mode: SubscriptionAccessDecision["mode"]

  constructor(decision: SubscriptionAccessDecision) {
    super(decision.message)
    this.name = "SubscriptionWriteError"
    this.code = decision.code
    this.mode = decision.mode
  }
}

export async function assertWorkspaceWriteAccess(workspaceId: string, now = new Date()) {
  const entitlement = await getWorkspaceEntitlement(workspaceId, now)
  if (entitlement.mode !== "write") throw new SubscriptionWriteError(entitlement)
  return entitlement
}
