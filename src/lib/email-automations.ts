import type { Prisma } from "@/generated/prisma/client"
import { getPrismaClient } from "@/lib/db"
import {
  sendHelpNudgeEmail,
  sendPaidWelcomeEmail,
  sendPaymentFailedEmail,
  sendSequenceEmail,
  sendSubscriptionCanceledEmail,
  type CustomerEducationKey,
  type TrialEducationKey,
} from "@/lib/lifecycle-email"

type AutomationRunResult = {
  checked: number
  failed: number
  sent: number
  skipped: number
}

type BillingEmailKind = "customer_welcome" | "payment_failed" | "subscription_canceled"
type HelpNudgeKey = "trial_no_uploads_day_7" | "trial_no_cover_day_7"

const trialSequence: Array<{ day: number; key: TrialEducationKey }> = [
  { day: 1, key: "trial_day_1_cover" },
  { day: 2, key: "trial_day_2_upload" },
  { day: 3, key: "trial_day_3_mobile" },
  { day: 4, key: "trial_day_4_hide" },
  { day: 5, key: "trial_day_5_sharing" },
  { day: 6, key: "trial_day_6_homepage" },
  { day: 7, key: "trial_day_7_watermark" },
  { day: 8, key: "trial_day_8_embed" },
  { day: 9, key: "trial_day_9_lightroom" },
  { day: 10, key: "trial_day_10_storage" },
  { day: 11, key: "trial_day_11_social" },
  { day: 12, key: "trial_day_12_polish" },
  { day: 13, key: "trial_day_13_expiring" },
]

const customerSequence: Array<{ day: number; key: CustomerEducationKey }> = [
  { day: 2, key: "customer_day_2_sharing" },
  { day: 5, key: "customer_day_5_storage" },
  { day: 10, key: "customer_day_10_editing" },
]

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://photoviewpro.com").replace(/\/+$/, "")
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function buildDeliveryKey(subscriptionId: string, automationKey: string) {
  return `${subscriptionId}:${automationKey}`
}

async function hasDelivery(deliveryKey: string) {
  const prisma = getPrismaClient()
  const existing = await prisma.emailAutomationDelivery.findUnique({
    select: { id: true },
    where: { deliveryKey },
  })

  return Boolean(existing)
}

async function recordDelivery({
  automationKey,
  email,
  event,
  metadata,
  providerStatus,
  status,
  subscriptionId,
  workspaceId,
}: {
  automationKey: string
  email: string
  event: string
  metadata?: Prisma.InputJsonValue
  providerStatus: string
  status: "FAILED" | "SENT"
  subscriptionId: string
  workspaceId: string
}) {
  const prisma = getPrismaClient()
  const deliveryKey = buildDeliveryKey(subscriptionId, automationKey)

  await prisma.emailAutomationDelivery.upsert({
    create: {
      automationKey,
      deliveryKey,
      email,
      event,
      metadata,
      providerStatus,
      sentAt: status === "SENT" ? new Date() : null,
      status,
      subscriptionId,
      workspaceId,
    },
    update: {
      metadata,
      providerStatus,
      sentAt: status === "SENT" ? new Date() : undefined,
      status,
    },
    where: { deliveryKey },
  })
}

async function getSubscriberSubscriptions() {
  const prisma = getPrismaClient()

  return prisma.subscription.findMany({
    include: {
      plan: true,
      workspace: {
        include: {
          galleries: {
            select: {
              _count: {
                select: {
                  photos: true,
                },
              },
              coverPhotoId: true,
            },
          },
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
    },
  })
}

type SubscriptionForAutomation = Awaited<ReturnType<typeof getSubscriberSubscriptions>>[number]

function getOwner(subscription: SubscriptionForAutomation) {
  return subscription.workspace.members.find((member) => member.role === "OWNER") ?? subscription.workspace.members[0]
}

function getEmail(subscription: SubscriptionForAutomation) {
  const owner = getOwner(subscription)
  return subscription.workspace.supportEmail ?? owner?.user.email ?? null
}

function getCustomerStart(subscription: SubscriptionForAutomation) {
  return subscription.currentPeriodStart ?? subscription.trialStartedAt ?? subscription.createdAt
}

function getWorkspacePhotoCount(subscription: SubscriptionForAutomation) {
  return subscription.workspace.galleries.reduce((total, gallery) => total + gallery._count.photos, 0)
}

function hasSelectedPortfolioCover(subscription: SubscriptionForAutomation) {
  return subscription.workspace.galleries.some((gallery) => Boolean(gallery.coverPhotoId))
}

async function sendSequenceIfDue({
  dueAt,
  email,
  event,
  firstName,
  key,
  metadata,
  now,
  subscription,
}: {
  dueAt: Date
  email: string
  event: "customer_sequence" | "trial_sequence"
  firstName?: string | null
  key: CustomerEducationKey | TrialEducationKey
  metadata: Prisma.InputJsonValue
  now: Date
  subscription: SubscriptionForAutomation
}) {
  if (dueAt > now) return "skipped" as const

  const deliveryKey = buildDeliveryKey(subscription.id, key)
  if (await hasDelivery(deliveryKey)) return "skipped" as const

  const providerStatus = await sendSequenceEmail(email, {
    accountUrl: `${getAppUrl()}/account`,
    firstName,
    key,
  })

  await recordDelivery({
    automationKey: key,
    email,
    event,
    metadata,
    providerStatus,
    status: providerStatus === "sent" ? "SENT" : "FAILED",
    subscriptionId: subscription.id,
    workspaceId: subscription.workspaceId,
  })

  return providerStatus === "sent" ? "sent" as const : "failed" as const
}

async function sendHelpNudgeIfDue({
  dueAt,
  email,
  firstName,
  key,
  kind,
  metadata,
  now,
  subscription,
}: {
  dueAt: Date
  email: string
  firstName?: string | null
  key: HelpNudgeKey
  kind: "no_uploads" | "no_cover"
  metadata: Prisma.InputJsonValue
  now: Date
  subscription: SubscriptionForAutomation
}) {
  if (dueAt > now) return "skipped" as const

  const deliveryKey = buildDeliveryKey(subscription.id, key)
  if (await hasDelivery(deliveryKey)) return "skipped" as const

  const providerStatus = await sendHelpNudgeEmail(email, {
    accountUrl: `${getAppUrl()}/account`,
    firstName,
    kind,
  })

  await recordDelivery({
    automationKey: key,
    email,
    event: "trial_help_nudge",
    metadata,
    providerStatus,
    status: providerStatus === "sent" ? "SENT" : "FAILED",
    subscriptionId: subscription.id,
    workspaceId: subscription.workspaceId,
  })

  return providerStatus === "sent" ? "sent" as const : "failed" as const
}

export async function runEmailAutomations(now = new Date()): Promise<AutomationRunResult> {
  if (!process.env.DATABASE_URL) {
    return { checked: 0, failed: 0, sent: 0, skipped: 0 }
  }

  const subscriptions = await getSubscriberSubscriptions()
  const result: AutomationRunResult = { checked: subscriptions.length, failed: 0, sent: 0, skipped: 0 }

  for (const subscription of subscriptions) {
    const owner = getOwner(subscription)
    const email = getEmail(subscription)
    if (!email) {
      result.skipped += 1
      continue
    }

    const firstName = owner?.user.firstName
    const baseMetadata = {
      planSlug: subscription.plan.slug,
      status: subscription.status,
      workspaceName: subscription.workspace.name,
    }

    if (subscription.status === "TRIALING" && subscription.trialStartedAt) {
      const photoCount = getWorkspacePhotoCount(subscription)
      const hasCover = hasSelectedPortfolioCover(subscription)

      for (const item of trialSequence) {
        const status = await sendSequenceIfDue({
          dueAt: addDays(subscription.trialStartedAt, item.day),
          email,
          event: "trial_sequence",
          firstName,
          key: item.key,
          metadata: { ...baseMetadata, day: item.day },
          now,
          subscription,
        })
        result[status === "sent" ? "sent" : status === "failed" ? "failed" : "skipped"] += 1
      }

      if (photoCount === 0) {
        const status = await sendHelpNudgeIfDue({
          dueAt: addDays(subscription.trialStartedAt, 7),
          email,
          firstName,
          key: "trial_no_uploads_day_7",
          kind: "no_uploads",
          metadata: { ...baseMetadata, day: 7, reason: "no_uploads" },
          now,
          subscription,
        })
        result[status === "sent" ? "sent" : status === "failed" ? "failed" : "skipped"] += 1
      }

      if (photoCount > 0 && subscription.workspace.galleries.length > 0 && !hasCover) {
        const status = await sendHelpNudgeIfDue({
          dueAt: addDays(subscription.trialStartedAt, 7),
          email,
          firstName,
          key: "trial_no_cover_day_7",
          kind: "no_cover",
          metadata: { ...baseMetadata, day: 7, reason: "no_cover_selected" },
          now,
          subscription,
        })
        result[status === "sent" ? "sent" : status === "failed" ? "failed" : "skipped"] += 1
      }
    }

    if (subscription.status !== "TRIALING" && (subscription.stripeCustomerId || subscription.status === "ACTIVE")) {
      const customerStart = getCustomerStart(subscription)
      for (const item of customerSequence) {
        const status = await sendSequenceIfDue({
          dueAt: addDays(customerStart, item.day),
          email,
          event: "customer_sequence",
          firstName,
          key: item.key,
          metadata: { ...baseMetadata, day: item.day },
          now,
          subscription,
        })
        result[status === "sent" ? "sent" : status === "failed" ? "failed" : "skipped"] += 1
      }
    }
  }

  return result
}

export async function sendBillingLifecycleEmail({
  email,
  firstName,
  kind,
  metadata,
  subscriptionId,
  workspaceId,
}: {
  email: string
  firstName?: string | null
  kind: BillingEmailKind
  metadata?: Prisma.InputJsonValue
  subscriptionId?: string | null
  workspaceId?: string | null
}) {
  if (!subscriptionId || !workspaceId) return "missing_subscription"

  const deliveryKey = buildDeliveryKey(subscriptionId, kind)
  if (await hasDelivery(deliveryKey)) return "already_sent"

  const accountUrl = `${getAppUrl()}/account`
  const cancellationSurveyUrl = `${getAppUrl()}/cancel-survey?email=${encodeURIComponent(email)}&subscription=${encodeURIComponent(subscriptionId)}`
  const providerStatus = kind === "customer_welcome"
    ? await sendPaidWelcomeEmail(email, { accountUrl, firstName })
    : kind === "payment_failed"
      ? await sendPaymentFailedEmail(email, { accountUrl, firstName })
      : await sendSubscriptionCanceledEmail(email, { accountUrl, firstName, surveyUrl: cancellationSurveyUrl })

  await recordDelivery({
    automationKey: kind,
    email,
    event: "billing_lifecycle",
    metadata,
    providerStatus,
    status: providerStatus === "sent" ? "SENT" : "FAILED",
    subscriptionId,
    workspaceId,
  })

  return providerStatus
}
