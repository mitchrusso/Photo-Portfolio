import { getPrismaClient } from "@/lib/db"
import {
  getPlanPriceId,
  getSubscriberPlan,
  type SubscriberPlan,
} from "@/lib/plans"
import { resolveStripePlan } from "@/lib/stripe-plan-resolution"
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

function stripeManagedSubscriptionId(subscription: { id: string; lifetimeAccess: boolean } | null | undefined) {
  return subscription && !subscription.lifetimeAccess ? subscription.id : null
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

function getSubscriptionItems(subscription: JsonRecord) {
  const items = asObject(subscription.items)
  const data = Array.isArray(items?.data) ? items.data : []
  return data.map(asObject).filter((item): item is JsonRecord => Boolean(item))
}

function getSubscriptionItem(subscription: JsonRecord) {
  return getSubscriptionItems(subscription).find((item) => {
    const price = asObject(item.price)
    return Boolean(resolveStripePlan({
      id: asString(price?.id),
      interval: asString(asObject(price?.recurring)?.interval),
      unitAmount: typeof price?.unit_amount === "number" ? price.unit_amount : null,
    }))
  }) ?? getSubscriptionItems(subscription)[0] ?? null
}

function getSubscriptionPriceId(subscription: JsonRecord) {
  const item = getSubscriptionItem(subscription)
  const itemPrice = asObject(item?.price)
  return asString(itemPrice?.id)
}

function getSubscriptionPlan(subscription: JsonRecord) {
  const price = asObject(getSubscriptionItem(subscription)?.price)
  return resolveStripePlan({
    id: asString(price?.id),
    interval: asString(asObject(price?.recurring)?.interval),
    unitAmount: typeof price?.unit_amount === "number" ? price.unit_amount : null,
  })
}

function getAdditionalWebsiteItem(subscription: JsonRecord) {
  const priceIds = new Set([
    process.env.STRIPE_ADDITIONAL_WEBSITE_MONTHLY_PRICE_ID,
    process.env.STRIPE_ADDITIONAL_WEBSITE_ANNUAL_PRICE_ID,
  ].filter((value): value is string => Boolean(value)))
  return getSubscriptionItems(subscription).find((item) => {
    const priceId = asString(asObject(item.price)?.id)
    return Boolean(priceId && priceIds.has(priceId))
  }) ?? null
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
      select: { id: true, lifetimeAccess: true },
      where: { stripeSubscriptionId: subscriptionId },
    })
    const targetId = stripeManagedSubscriptionId(subscription)
    if (targetId) return targetId
  }

  if (checkoutSessionId) {
    const subscription = await prisma.subscription.findUnique({
      select: { id: true, lifetimeAccess: true },
      where: { stripeCheckoutSessionId: checkoutSessionId },
    })
    const targetId = stripeManagedSubscriptionId(subscription)
    if (targetId) return targetId
  }

  if (customerId) {
    const subscription = await prisma.subscription.findUnique({
      select: { id: true, lifetimeAccess: true },
      where: { stripeCustomerId: customerId },
    })
    const targetId = stripeManagedSubscriptionId(subscription)
    if (targetId) return targetId
  }

  if (email) {
    const trialSignup = await prisma.trialSignup.findFirst({
      orderBy: { createdAt: "desc" },
      select: { workspace: { select: { subscription: { select: { id: true, lifetimeAccess: true } } } } },
      where: { email },
    })

    const targetId = stripeManagedSubscriptionId(trialSignup?.workspace?.subscription)
    if (targetId) return targetId
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
  const resolvedPlan = getSubscriptionPlan(subscription)
  const plan = resolvedPlan?.plan ?? null
  const billingCycle = resolvedPlan?.billingCycle ?? null
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
  const additionalWebsiteItem = getAdditionalWebsiteItem(subscription)
  const additionalWebsitePriceId = asString(asObject(additionalWebsiteItem?.price)?.id)
  const additionalWebsiteQuantity = typeof additionalWebsiteItem?.quantity === "number"
    ? Math.max(0, Math.floor(additionalWebsiteItem.quantity))
    : 0
  await prisma.subscription.update({
    data: {
      additionalWebsitePriceId,
      additionalWebsiteQuantity,
      additionalWebsiteStripeItemId: asString(additionalWebsiteItem?.id),
    },
    where: { id: updatedSubscription.id },
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

async function fulfillLifetimeWebsiteCheckout(session: JsonRecord): Promise<FulfillmentResult> {
  const metadata = getMetadata(session)
  const workspaceId = asString(metadata.workspaceId)
  const websiteId = asString(metadata.websiteId)
  const subdomain = asString(metadata.subdomain)
  const subscriptionId = asString(session.subscription)
  const customerId = asString(session.customer)
  const billingChoice = asString(metadata.billingChoice) === "monthly" ? "monthly" : "annual"
  if (!workspaceId || !websiteId || !subdomain || !subscriptionId || !customerId) {
    return { handled: true, persisted: false, reason: "Website activation checkout metadata was incomplete." }
  }
  if (!new Set(["paid", "no_payment_required"]).has(asString(session.payment_status) ?? "")) {
    return { handled: true, persisted: false, reason: "Website activation checkout was not paid." }
  }
  const prisma = getPrismaClient()
  const website = await prisma.website.findFirst({ where: { deletedAt: null, id: websiteId, workspaceId } })
  if (!website || website.requestedSubdomain !== subdomain) {
    return { handled: true, persisted: false, reason: "The website activation reservation no longer matched checkout." }
  }
  const activatedAt = new Date()
  const priceId = billingChoice === "monthly"
    ? process.env.STRIPE_ADDITIONAL_WEBSITE_MONTHLY_PRICE_ID
    : process.env.STRIPE_ADDITIONAL_WEBSITE_ANNUAL_PRICE_ID
  await prisma.$transaction([
    prisma.subscription.update({
      data: {
        additionalWebsitePriceId: priceId,
        additionalWebsiteQuantity: 1,
        additionalWebsiteStripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
      },
      where: { workspaceId },
    }),
    prisma.website.update({
      data: { activatedAt, billingCommittedAt: activatedAt, status: "ACTIVE", subdomain },
      where: { id: websiteId },
    }),
  ])
  return { handled: true, persisted: true, workspaceId }
}

async function fulfillAdditionalWebsiteSubscription(subscription: JsonRecord): Promise<FulfillmentResult> {
  const metadata = getMetadata(subscription)
  const workspaceId = asString(metadata.workspaceId)
  const stripeSubscriptionId = asString(subscription.id)
  if (!workspaceId || !stripeSubscriptionId) return { handled: true, persisted: false, reason: "Website subscription metadata was incomplete." }
  const item = getAdditionalWebsiteItem(subscription)
  const quantity = typeof item?.quantity === "number" ? Math.max(0, Math.floor(item.quantity)) : 0
  const canceled = asString(subscription.status) === "canceled"
  const prisma = getPrismaClient()
  const local = await prisma.subscription.findUnique({ select: { id: true }, where: { workspaceId } })
  if (!local) return { handled: true, persisted: false, reason: "Website subscription account was not found." }
  await prisma.subscription.update({
    data: {
      additionalWebsitePriceId: canceled ? null : asString(asObject(item?.price)?.id),
      additionalWebsiteQuantity: canceled ? 0 : quantity,
      additionalWebsiteStripeItemId: canceled ? null : asString(item?.id),
      additionalWebsiteStripeSubscriptionId: canceled ? null : stripeSubscriptionId,
    },
    where: { id: local.id },
  })
  if (canceled) {
    await prisma.website.updateMany({
      data: { status: "BILLING_FAILED" },
      where: { billingType: "ADD_ON", deletedAt: null, status: "ACTIVE", workspaceId },
    })
  }
  return { handled: true, persisted: true, subscriptionId: local.id, workspaceId }
}

async function fulfillAdditionalWebsiteInvoice(invoice: JsonRecord, failed: boolean): Promise<FulfillmentResult | null> {
  const stripeSubscriptionId = asString(invoice.subscription)
    ?? asString(asObject(asObject(invoice.parent)?.subscription_details)?.subscription)
  if (!stripeSubscriptionId) return null
  const prisma = getPrismaClient()
  const subscription = await prisma.subscription.findUnique({
    select: { id: true, workspaceId: true },
    where: { additionalWebsiteStripeSubscriptionId: stripeSubscriptionId },
  })
  if (!subscription) return null
  await prisma.website.updateMany({
    data: { status: failed ? "BILLING_FAILED" : "ACTIVE" },
    where: {
      billingType: "ADD_ON",
      deletedAt: null,
      status: failed ? "ACTIVE" : "BILLING_FAILED",
      workspaceId: subscription.workspaceId,
    },
  })
  return { handled: true, persisted: true, subscriptionId: subscription.id, workspaceId: subscription.workspaceId }
}

export async function fulfillStripeWebhookEvent(event: StripeWebhookEvent): Promise<FulfillmentResult> {
  if (!process.env.DATABASE_URL) {
    return { handled: true, persisted: false, reason: "DATABASE_URL is not configured." }
  }

  const metadata = getMetadata(event.data.object)
  if (event.type === "checkout.session.completed" && metadata.purpose === "lifetime_additional_website") {
    return fulfillLifetimeWebsiteCheckout(event.data.object)
  }
  if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type) && metadata.purpose === "lifetime_additional_website") {
    return fulfillAdditionalWebsiteSubscription(event.data.object)
  }
  if (event.type === "invoice.payment_succeeded" || event.type === "invoice.payment_failed") {
    const websiteInvoice = await fulfillAdditionalWebsiteInvoice(event.data.object, event.type === "invoice.payment_failed")
    if (websiteInvoice) return websiteInvoice
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
