import type { Prisma } from "@/generated/prisma/client"
import { getPrismaClient } from "@/lib/db"
import { createCancellationSurveyToken } from "@/lib/cancellation-survey-token"
import { isDeliverableAutomationEmail } from "@/lib/email-address-safety"
import { claimEmailDelivery, finishEmailDelivery } from "@/lib/email-delivery-idempotency"
import {
  featureAcademyLaunchAt,
  featureAcademySequence,
  type FeatureAcademyKey,
} from "@/lib/feature-academy"
import {
  sendHelpNudgeEmail,
  sendPaidWelcomeEmail,
  sendPaymentFailedEmail,
  sendSequenceEmail,
  sendSubscriptionCanceledEmail,
  sendTrialWelcomeEmail,
  type CustomerEducationKey,
  type TrialEducationKey,
} from "@/lib/lifecycle-email"

type AutomationRunResult = {
  checked: number
  failed: number
  sent: number
  skipped: number
}

type BillingEmailKind = "customer_welcome" | "payment_failed" | "subscription_canceled" | "trial_started"
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
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://photoview.io").replace(/\/+$/, "")
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function buildDeliveryKey(subscriptionId: string, automationKey: string) {
  return `${subscriptionId}:${automationKey}`
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
          trialSignups: {
            orderBy: { createdAt: "desc" },
            select: { startupSequenceEnabled: true },
            take: 1,
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
  event: "customer_sequence" | "feature_academy" | "trial_sequence"
  firstName?: string | null
  key: CustomerEducationKey | FeatureAcademyKey | TrialEducationKey
  metadata: Prisma.InputJsonValue
  now: Date
  subscription: SubscriptionForAutomation
}) {
  if (dueAt > now) return "skipped" as const

  const deliveryKey = buildDeliveryKey(subscription.id, key)
  const claim = await claimEmailDelivery({
    automationKey: key,
    deliveryKey,
    email,
    event,
    metadata,
    subscriptionId: subscription.id,
    workspaceId: subscription.workspaceId,
  })
  if (!claim.acquired) return "skipped" as const

  const providerStatus = await sendSequenceEmail(email, {
    accountUrl: `${getAppUrl()}/account`,
    firstName,
    key,
  }, deliveryKey)

  await finishEmailDelivery({
    deliveryKey,
    providerStatus,
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
  const claim = await claimEmailDelivery({
    automationKey: key,
    deliveryKey,
    email,
    event: "trial_help_nudge",
    metadata,
    subscriptionId: subscription.id,
    workspaceId: subscription.workspaceId,
  })
  if (!claim.acquired) return "skipped" as const

  const providerStatus = await sendHelpNudgeEmail(email, {
    accountUrl: `${getAppUrl()}/account`,
    firstName,
    kind,
  }, deliveryKey)

  await finishEmailDelivery({
    deliveryKey,
    providerStatus,
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
    if (!email || !isDeliverableAutomationEmail(email)) {
      result.skipped += 1
      continue
    }

    const firstName = owner?.user.firstName
    const baseMetadata = {
      planSlug: subscription.plan.slug,
      status: subscription.status,
      workspaceName: subscription.workspace.name,
    }

    if (subscription.workspace.trialSignups[0]?.startupSequenceEnabled === false) {
      result.skipped += 1
      continue
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
      if (subscription.status === "ACTIVE") {
        for (const item of featureAcademySequence) {
          const customerDueAt = addDays(customerStart, item.customerDay)
          const rolloutDueAt = addDays(featureAcademyLaunchAt, item.rolloutDay)
          const status = await sendSequenceIfDue({
            dueAt: customerDueAt > rolloutDueAt ? customerDueAt : rolloutDueAt,
            email,
            event: "feature_academy",
            firstName,
            key: item.key,
            metadata: {
              ...baseMetadata,
              customerDay: item.customerDay,
              rolloutDay: item.rolloutDay,
              series: "feature_academy",
            },
            now,
            subscription,
          })
          result[status === "sent" ? "sent" : status === "failed" ? "failed" : "skipped"] += 1
        }
      }
    }
  }

  return result
}

export async function sendBillingLifecycleEmail({
  email,
  eventId,
  firstName,
  kind,
  metadata,
  planName,
  subscriptionId,
  workspaceId,
  trialEndsAt,
}: {
  email: string
  eventId?: string | null
  firstName?: string | null
  kind: BillingEmailKind
  metadata?: Prisma.InputJsonValue
  planName?: string | null
  subscriptionId?: string | null
  workspaceId?: string | null
  trialEndsAt?: Date | null
}) {
  if (!subscriptionId || !workspaceId) return "missing_subscription"

  const deliveryKey = buildDeliveryKey(subscriptionId, eventId ? `${kind}:${eventId}` : kind)
  const claim = await claimEmailDelivery({
    automationKey: kind,
    deliveryKey,
    email,
    event: "billing_lifecycle",
    metadata,
    subscriptionId,
    workspaceId,
  })
  if (!claim.acquired) return claim.state

  const accountUrl = `${getAppUrl()}/account`
  const surveyToken = createCancellationSurveyToken({ email, subscriptionId })
  const cancellationSurveyUrl = `${getAppUrl()}/cancel-survey?token=${encodeURIComponent(surveyToken)}`
  const providerStatus = kind === "trial_started"
    ? await sendTrialWelcomeEmail(email, {
        dashboardUrl: `${getAppUrl()}/dashboard`,
        firstName: firstName ?? "there",
        planName: planName ?? "PhotoView.io",
        trialEndsAt: trialEndsAt ?? new Date(),
      }, deliveryKey)
    : kind === "customer_welcome"
      ? await sendPaidWelcomeEmail(email, { accountUrl, firstName }, deliveryKey)
    : kind === "payment_failed"
      ? await sendPaymentFailedEmail(email, { accountUrl, firstName }, deliveryKey)
      : await sendSubscriptionCanceledEmail(
          email,
          { accountUrl, firstName, surveyUrl: cancellationSurveyUrl },
          deliveryKey,
        )

  await finishEmailDelivery({
    deliveryKey,
    providerStatus,
  })

  if (providerStatus !== "sent") {
    throw new Error(`Billing lifecycle email ${kind} was not delivered (${providerStatus}).`)
  }

  return providerStatus
}
