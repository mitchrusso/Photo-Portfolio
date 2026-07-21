import { getPrismaClient } from "@/lib/db"
import {
  getPlanBillingCycleFromPriceId,
  getPlanPriceId,
  getSubscriberPlan,
  planPriceMatches,
  subscriberPlans,
  type SubscriberPlan,
} from "@/lib/plans"
import { markReferralConvertedByEmail, markReferralTrialingByEmail } from "@/lib/referrals"
import {
  getInvoiceSubscriptionStatus,
  isStripeSubscriptionCancellationScheduled,
} from "@/lib/stripe-lifecycle-rules"

type JsonRecord = Record<string, unknown>

export type StripeWebhookEvent = {
  data: { object: JsonRecord }
  type: string
}

type FulfillmentResult = {
  email?: string | null
  firstName?: string | null
  handled: boolean
  planName?: string | null
  persisted: boolean
  reason?: string
  subscriptionId?: string | null
  trialEndsAt?: Date | null
  workspaceId?: string | null
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null
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

async function syncPlanRecord(plan: SubscriberPlan, priceId: string | null) {
  const data = {
    annualPriceCents: plan.annualPriceCents,
    isActive: true,
    monthlyPriceCents: plan.monthlyPriceCents,
    name: plan.name,
    storageLimitBytes: BigInt(plan.storageLimitBytes),
    trialDays: plan.trialDays,
  }

  return getPrismaClient().plan.upsert({
    create: { ...data, slug: plan.slug, stripePriceId: priceId },
    update: data,
    where: { slug: plan.slug },
  })
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
  const dbPlan = await syncPlanRecord(plan, priceId)
  const currentSubscription = await prisma.subscription.findUnique({
    select: { planId: true, status: true },
    where: { id: subscriptionRecordId },
  })
  const checkoutStatus = currentSubscription && ["ACTIVE", "PAST_DUE", "UNPAID", "CANCELED"].includes(currentSubscription.status)
    ? currentSubscription.status
    : "TRIALING"
  const updatedSubscription = await prisma.subscription.update({
    data: {
      billingCycle,
      cancelAtPeriodEnd: false,
      plan: { connect: { id: dbPlan.id } },
      stripeCheckoutSessionId: checkoutSessionId,
      stripeCustomerId: customerId,
      stripePriceId: priceId,
      stripeSubscriptionId: subscriptionId,
      status: checkoutStatus,
      trialEndsAt: asDateFromUnix(session.subscription_data && asObject(session.subscription_data)?.trial_end),
    },
    include: {
      plan: true,
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

  if (currentSubscription?.planId !== dbPlan.id) {
    await prisma.workspace.update({
      data: { storageLimitBytes: BigInt(plan.storageLimitBytes) },
      where: { id: updatedSubscription.workspaceId },
    })
  }

  await updateTrialSignupStripeLinks({ checkoutSessionId, customerId, email })
  await markReferralTrialingByEmail(email)
  const owner = updatedSubscription.workspace.members.find((member) => member.role === "OWNER") ?? updatedSubscription.workspace.members[0]

  return {
    email: updatedSubscription.workspace.supportEmail ?? owner?.user.email ?? email,
    firstName: owner?.user.firstName,
    handled: true,
    planName: updatedSubscription.plan.name,
    persisted: true,
    subscriptionId: updatedSubscription.id,
    trialEndsAt: updatedSubscription.trialEndsAt,
    workspaceId: updatedSubscription.workspaceId,
  }
}

async function fulfillSubscriptionChanged(subscription: JsonRecord): Promise<FulfillmentResult> {
  const subscriptionId = asString(subscription.id)
  const customerId = asString(subscription.customer)
  const metadata = getMetadata(subscription)
  const email = asString(metadata.email)?.toLowerCase() ?? null
  const priceId = getSubscriptionPriceId(subscription)
  const plan = getPlanFromPriceId(priceId)
  const billingCycle = getBillingCycleFromPriceId(priceId)
  const status = mapStripeStatus(asString(subscription.status))
  const subscriptionRecordId = await findSubscriptionTarget({ customerId, email, subscriptionId })

  if (!subscriptionRecordId) {
    return { handled: true, persisted: false, reason: "No matching subscriber record was found for this Stripe subscription." }
  }

  const prisma = getPrismaClient()
  const dbPlan = plan ? await syncPlanRecord(plan, priceId) : null
  const currentSubscription = await prisma.subscription.findUnique({
    select: { planId: true },
    where: { id: subscriptionRecordId },
  })
  const updatedSubscription = await prisma.subscription.update({
    data: {
      ...(billingCycle ? { billingCycle } : {}),
      cancelAtPeriodEnd: isStripeSubscriptionCancellationScheduled(subscription),
      currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
      currentPeriodStart: getSubscriptionPeriodStart(subscription),
      ...(plan ? {
        plan: { connect: { id: dbPlan!.id } },
      } : {}),
      stripeCustomerId: customerId,
      stripePriceId: priceId,
      stripeSubscriptionId: subscriptionId,
      status,
      trialEndsAt: asDateFromUnix(subscription.trial_end),
    },
    include: {
      plan: true,
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
  if (plan && dbPlan && currentSubscription?.planId !== dbPlan.id) {
    await prisma.workspace.update({
      data: { storageLimitBytes: BigInt(plan.storageLimitBytes) },
      where: { id: updatedSubscription.workspaceId },
    })
  }
  const owner = updatedSubscription.workspace.members.find((member) => member.role === "OWNER") ?? updatedSubscription.workspace.members[0]

  return {
    email: updatedSubscription.workspace.supportEmail ?? owner?.user.email,
    firstName: owner?.user.firstName,
    handled: true,
    planName: updatedSubscription.plan.name,
    persisted: true,
    subscriptionId: updatedSubscription.id,
    trialEndsAt: updatedSubscription.trialEndsAt,
    workspaceId: updatedSubscription.workspaceId,
  }
}

async function fulfillInvoiceEvent(invoice: JsonRecord, status: "ACTIVE" | "PAST_DUE" | null): Promise<FulfillmentResult> {
  const subscriptionId =
    asString(invoice.subscription) ??
    asString(asObject(invoice.parent)?.subscription_details && asObject(asObject(invoice.parent)?.subscription_details)?.subscription)
  const customerId = asString(invoice.customer)
  const email = getCustomerEmail(invoice)
  const subscriptionRecordId = await findSubscriptionTarget({ customerId, email, subscriptionId })

  if (!subscriptionRecordId) {
    return { handled: true, persisted: false, reason: "No matching subscriber record was found for this Stripe invoice." }
  }

  const prisma = getPrismaClient()
  const updatedSubscription = await prisma.subscription.update({
    data: status ? { status } : {},
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
  if (status === "ACTIVE") {
    await markReferralConvertedByEmail(updatedSubscription.workspace.supportEmail ?? owner?.user.email)
  }

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
      return fulfillInvoiceEvent(
        event.data.object,
        getInvoiceSubscriptionStatus("invoice.payment_succeeded", event.data.object.amount_paid),
      )
    case "invoice.payment_failed":
      return fulfillInvoiceEvent(
        event.data.object,
        getInvoiceSubscriptionStatus("invoice.payment_failed", event.data.object.amount_paid),
      )
    default:
      return { handled: false, persisted: false, reason: "Unhandled Stripe event type." }
  }
}
