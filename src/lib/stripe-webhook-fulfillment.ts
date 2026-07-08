import { getPrismaClient } from "@/lib/db"
import {
  getPlanBillingCycleFromPriceId,
  getPlanPriceId,
  getSubscriberPlan,
  planPriceMatches,
  subscriberPlans,
} from "@/lib/plans"
import { markReferralConvertedByEmail, markReferralTrialingByEmail } from "@/lib/referrals"

type JsonRecord = Record<string, unknown>

export type StripeWebhookEvent = {
  data: { object: JsonRecord }
  type: string
}

type FulfillmentResult = {
  email?: string | null
  firstName?: string | null
  handled: boolean
  persisted: boolean
  reason?: string
  subscriptionId?: string | null
  workspaceId?: string | null
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null
}

function asObject(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null ? value as JsonRecord : null
}

function asDateFromUnix(value: unknown) {
  return typeof value === "number" ? new Date(value * 1000) : undefined
}

function getCustomerEmail(object: JsonRecord) {
  const directEmail = asString(object.customer_email)
  if (directEmail) return directEmail.toLowerCase()

  const customerDetails = asObject(object.customer_details)
  const customerDetailsEmail = customerDetails ? asString(customerDetails.email) : null
  return customerDetailsEmail?.toLowerCase() ?? null
}

function getMetadata(object: JsonRecord) {
  return asObject(object.metadata) ?? {}
}

function mapStripeStatus(status: string | null) {
  switch (status) {
    case "trialing":
      return "TRIALING"
    case "active":
      return "ACTIVE"
    case "past_due":
      return "PAST_DUE"
    case "canceled":
      return "CANCELED"
    case "unpaid":
      return "UNPAID"
    case "incomplete":
    case "incomplete_expired":
    default:
      return "INCOMPLETE"
  }
}

function getPlanFromPriceId(priceId: string | null) {
  if (!priceId) return null

  return subscriberPlans.find((plan) => planPriceMatches(plan, priceId)) ?? null
}

function getBillingCycleFromPriceId(priceId: string | null) {
  if (!priceId) return null

  const plan = subscriberPlans.find((candidate) => planPriceMatches(candidate, priceId))

  if (!plan) return null
  return getPlanBillingCycleFromPriceId(plan, priceId)
}

function getSubscriptionItem(subscription: JsonRecord) {
  const items = asObject(subscription.items)
  const data = Array.isArray(items?.data) ? items.data : []
  return asObject(data[0])
}

function getSubscriptionPriceId(subscription: JsonRecord) {
  const item = getSubscriptionItem(subscription)
  const itemPrice = asObject(item?.price)
  return asString(itemPrice?.id)
}

function getSubscriptionPeriodStart(subscription: JsonRecord) {
  return asDateFromUnix(subscription.current_period_start) ?? asDateFromUnix(getSubscriptionItem(subscription)?.current_period_start)
}

function getSubscriptionPeriodEnd(subscription: JsonRecord) {
  return asDateFromUnix(subscription.current_period_end) ?? asDateFromUnix(getSubscriptionItem(subscription)?.current_period_end)
}

async function findSubscriptionTarget({
  checkoutSessionId,
  customerId,
  email,
  subscriptionId,
}: {
  checkoutSessionId?: string | null
  customerId?: string | null
  email?: string | null
  subscriptionId?: string | null
}) {
  const prisma = getPrismaClient()

  if (subscriptionId) {
    const subscription = await prisma.subscription.findUnique({
      select: { id: true },
      where: { stripeSubscriptionId: subscriptionId },
    })
    if (subscription) return subscription.id
  }

  if (checkoutSessionId) {
    const subscription = await prisma.subscription.findUnique({
      select: { id: true },
      where: { stripeCheckoutSessionId: checkoutSessionId },
    })
    if (subscription) return subscription.id
  }

  if (customerId) {
    const subscription = await prisma.subscription.findUnique({
      select: { id: true },
      where: { stripeCustomerId: customerId },
    })
    if (subscription) return subscription.id
  }

  if (email) {
    const trialSignup = await prisma.trialSignup.findFirst({
      orderBy: { createdAt: "desc" },
      select: { workspace: { select: { subscription: { select: { id: true } } } } },
      where: { email },
    })

    if (trialSignup?.workspace?.subscription) return trialSignup.workspace.subscription.id
  }

  return null
}

async function updateTrialSignupStripeLinks({
  checkoutSessionId,
  customerId,
  email,
}: {
  checkoutSessionId?: string | null
  customerId?: string | null
  email?: string | null
}) {
  if (!email && !checkoutSessionId) return

  const prisma = getPrismaClient()
  const where = checkoutSessionId ? { stripeCheckoutSessionId: checkoutSessionId } : { email: email! }

  await prisma.trialSignup.updateMany({
    data: {
      stripeCheckoutSessionId: checkoutSessionId ?? undefined,
      stripeCustomerId: customerId ?? undefined,
    },
    where,
  })
}

async function fulfillCheckoutCompleted(session: JsonRecord): Promise<FulfillmentResult> {
  const checkoutSessionId = asString(session.id)
  const customerId = asString(session.customer)
  const subscriptionId = asString(session.subscription)
  const email = getCustomerEmail(session)
  const metadata = getMetadata(session)
  const planSlug = asString(metadata.planSlug)
  const billingCycle = asString(metadata.billingCycle) === "monthly" ? "MONTHLY" : "ANNUAL"
  const plan = getSubscriberPlan(planSlug)
  const priceId = getPlanPriceId(plan, billingCycle === "MONTHLY" ? "monthly" : "annual") ?? null
  const subscriptionRecordId = await findSubscriptionTarget({ checkoutSessionId, customerId, email, subscriptionId })

  if (!subscriptionRecordId) {
    return { handled: true, persisted: false, reason: "No matching subscriber record was found for this checkout session." }
  }

  const prisma = getPrismaClient()
  const updatedSubscription = await prisma.subscription.update({
    data: {
      billingCycle,
      cancelAtPeriodEnd: false,
      plan: {
        connectOrCreate: {
          create: {
            annualPriceCents: plan.annualPriceCents,
            bandwidthLimitBytes: BigInt(plan.bandwidthLimitBytes),
            isActive: true,
            maxUploadBytes: BigInt(plan.maxUploadBytes),
            monthlyPriceCents: plan.monthlyPriceCents,
            name: plan.name,
            slug: plan.slug,
            storageLimitBytes: BigInt(plan.storageLimitBytes),
            stripePriceId: priceId,
            trialDays: plan.trialDays,
          },
          where: { slug: plan.slug },
        },
      },
      stripeCheckoutSessionId: checkoutSessionId,
      stripeCustomerId: customerId,
      stripePriceId: priceId,
      stripeSubscriptionId: subscriptionId,
      status: "TRIALING",
      trialEndsAt: asDateFromUnix(session.subscription_data && asObject(session.subscription_data)?.trial_end),
    },
    include: {
      workspace: {
        include: {
          members: {
            include: { user: true },
            orderBy: [
              { role: "asc" },
              { createdAt: "asc" },
            ],
          },
        },
      },
    },
    where: { id: subscriptionRecordId },
  })

  await updateTrialSignupStripeLinks({ checkoutSessionId, customerId, email })
  await markReferralTrialingByEmail(email)
  const owner = updatedSubscription.workspace.members.find((member) => member.role === "OWNER") ?? updatedSubscription.workspace.members[0]

  return {
    email: updatedSubscription.workspace.supportEmail ?? owner?.user.email ?? email,
    firstName: owner?.user.firstName,
    handled: true,
    persisted: true,
    subscriptionId: updatedSubscription.id,
    workspaceId: updatedSubscription.workspaceId,
  }
}

async function fulfillSubscriptionChanged(subscription: JsonRecord): Promise<FulfillmentResult> {
  const subscriptionId = asString(subscription.id)
  const customerId = asString(subscription.customer)
  const priceId = getSubscriptionPriceId(subscription)
  const plan = getPlanFromPriceId(priceId)
  const billingCycle = getBillingCycleFromPriceId(priceId)
  const subscriptionRecordId = await findSubscriptionTarget({ customerId, subscriptionId })

  if (!subscriptionRecordId) {
    return { handled: true, persisted: false, reason: "No matching subscriber record was found for this Stripe subscription." }
  }

  const prisma = getPrismaClient()
  const updatedSubscription = await prisma.subscription.update({
    data: {
      ...(billingCycle ? { billingCycle } : {}),
      cancelAtPeriodEnd: asBoolean(subscription.cancel_at_period_end) ?? false,
      currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
      currentPeriodStart: getSubscriptionPeriodStart(subscription),
      ...(plan ? {
        bandwidthLimitBytes: BigInt(plan.bandwidthLimitBytes),
        maxUploadBytes: BigInt(plan.maxUploadBytes),
        plan: {
          connectOrCreate: {
            create: {
              annualPriceCents: plan.annualPriceCents,
              bandwidthLimitBytes: BigInt(plan.bandwidthLimitBytes),
              isActive: true,
              maxUploadBytes: BigInt(plan.maxUploadBytes),
              monthlyPriceCents: plan.monthlyPriceCents,
              name: plan.name,
              slug: plan.slug,
              storageLimitBytes: BigInt(plan.storageLimitBytes),
              stripePriceId: priceId,
              trialDays: plan.trialDays,
            },
            where: { slug: plan.slug },
          },
        },
      } : {}),
      stripeCustomerId: customerId,
      stripePriceId: priceId,
      stripeSubscriptionId: subscriptionId,
      status: mapStripeStatus(asString(subscription.status)),
      trialEndsAt: asDateFromUnix(subscription.trial_end),
    },
    include: {
      workspace: {
        include: {
          members: {
            include: { user: true },
            orderBy: [
              { role: "asc" },
              { createdAt: "asc" },
            ],
          },
        },
      },
    },
    where: { id: subscriptionRecordId },
  })
  if (status === "ACTIVE") {
    const ownerEmail = updatedSubscription.workspace.supportEmail ?? updatedSubscription.workspace.members.find((member) => member.role === "OWNER")?.user.email
    await markReferralConvertedByEmail(ownerEmail)
  }
  const owner = updatedSubscription.workspace.members.find((member) => member.role === "OWNER") ?? updatedSubscription.workspace.members[0]

  return {
    email: updatedSubscription.workspace.supportEmail ?? owner?.user.email,
    firstName: owner?.user.firstName,
    handled: true,
    persisted: true,
    subscriptionId: updatedSubscription.id,
    workspaceId: updatedSubscription.workspaceId,
  }
}

async function fulfillInvoiceEvent(invoice: JsonRecord, status: "ACTIVE" | "PAST_DUE"): Promise<FulfillmentResult> {
  const subscriptionId =
    asString(invoice.subscription) ??
    asString(asObject(invoice.parent)?.subscription_details && asObject(asObject(invoice.parent)?.subscription_details)?.subscription)
  const customerId = asString(invoice.customer)
  const subscriptionRecordId = await findSubscriptionTarget({ customerId, subscriptionId })

  if (!subscriptionRecordId) {
    return { handled: true, persisted: false, reason: "No matching subscriber record was found for this Stripe invoice." }
  }

  const prisma = getPrismaClient()
  const updatedSubscription = await prisma.subscription.update({
    data: {
      status,
    },
    include: {
      workspace: {
        include: {
          members: {
            include: { user: true },
            orderBy: [
              { role: "asc" },
              { createdAt: "asc" },
            ],
          },
        },
      },
    },
    where: { id: subscriptionRecordId },
  })
  const owner = updatedSubscription.workspace.members.find((member) => member.role === "OWNER") ?? updatedSubscription.workspace.members[0]

  return {
    email: updatedSubscription.workspace.supportEmail ?? owner?.user.email,
    firstName: owner?.user.firstName,
    handled: true,
    persisted: true,
    subscriptionId: updatedSubscription.id,
    workspaceId: updatedSubscription.workspaceId,
  }
}

export async function fulfillStripeWebhookEvent(event: StripeWebhookEvent): Promise<FulfillmentResult> {
  if (!process.env.DATABASE_URL) {
    return { handled: true, persisted: false, reason: "DATABASE_URL is not configured." }
  }

  switch (event.type) {
    case "checkout.session.completed":
      return fulfillCheckoutCompleted(event.data.object)
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return fulfillSubscriptionChanged(event.data.object)
    case "invoice.payment_succeeded":
      return fulfillInvoiceEvent(event.data.object, "ACTIVE")
    case "invoice.payment_failed":
      return fulfillInvoiceEvent(event.data.object, "PAST_DUE")
    default:
      return { handled: false, persisted: false, reason: "Unhandled Stripe event type." }
  }
}
