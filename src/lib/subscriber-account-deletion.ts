import Stripe from "stripe"

import { getPrismaClient } from "@/lib/db"

export class SubscriberAccountDeletionError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.name = "SubscriberAccountDeletionError"
    this.code = code
    this.status = status
  }
}

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) throw new SubscriberAccountDeletionError("billing_not_configured", "Stripe billing is not configured.", 503)
  return new Stripe(key, { apiVersion: "2026-08-26.dahlia" })
}

export async function cancelAndDeleteEmptySubscriberAccount({
  confirmationEmail,
  userId,
}: {
  confirmationEmail: string
  userId: string
}) {
  const prisma = getPrismaClient()
  const user = await prisma.user.findUnique({
    include: {
      memberships: {
        include: {
          workspace: {
            include: {
              _count: { select: { galleries: true, members: true, websites: true } },
              subscription: true,
            },
          },
        },
      },
    },
    where: { id: userId },
  })

  if (!user || user.email.toLowerCase() !== confirmationEmail.trim().toLowerCase()) {
    throw new SubscriberAccountDeletionError("subscriber_mismatch", "The subscriber identity did not match.", 404)
  }
  if (user.memberships.length !== 1 || user.memberships[0].role !== "OWNER") {
    throw new SubscriberAccountDeletionError("shared_account", "This account requires manual shared-workspace review.", 409)
  }

  const workspace = user.memberships[0].workspace
  const subscription = workspace.subscription
  const photoCount = await prisma.photo.count({ where: { gallery: { workspaceId: workspace.id } } })
  if (
    workspace._count.members !== 1
    || workspace._count.galleries !== 0
    || workspace._count.websites !== 0
    || photoCount !== 0
    || workspace.storageUsedBytes !== BigInt(0)
  ) {
    throw new SubscriberAccountDeletionError(
      "stored_content_requires_cleanup",
      "Stored subscriber content must be deleted through the storage cleanup workflow first.",
      409,
    )
  }
  if (!subscription?.stripeSubscriptionId || !subscription.stripeCustomerId) {
    throw new SubscriberAccountDeletionError("billing_identity_missing", "The Stripe billing identity is incomplete.", 409)
  }

  const stripe = stripeClient()
  const liveSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)
  const liveCustomerId = typeof liveSubscription.customer === "string"
    ? liveSubscription.customer
    : liveSubscription.customer.id
  if (liveCustomerId !== subscription.stripeCustomerId) {
    throw new SubscriberAccountDeletionError("billing_identity_mismatch", "The Stripe customer did not match the account.", 409)
  }
  if (process.env.VERCEL_ENV === "production" && !liveSubscription.livemode) {
    throw new SubscriberAccountDeletionError("billing_mode_mismatch", "A live Stripe subscription was expected.", 409)
  }

  const canceledSubscription = liveSubscription.status === "canceled"
    ? liveSubscription
    : await stripe.subscriptions.cancel(
      liveSubscription.id,
      { invoice_now: false, prorate: false },
      { idempotencyKey: `subscriber-account-delete:${user.id}` },
    )
  if (canceledSubscription.status !== "canceled") {
    throw new SubscriberAccountDeletionError("billing_cancel_unverified", "Stripe did not confirm cancellation.", 502)
  }

  const anonymizedEmail = `deleted-${user.id}@photoview.invalid`
  await prisma.$transaction(async (tx) => {
    await tx.emailAutomationDelivery.deleteMany({
      where: {
        OR: [
          { email: user.email },
          { subscriptionId: subscription.id },
          { workspaceId: workspace.id },
        ],
      },
    })
    await tx.cancellationSurvey.deleteMany({
      where: {
        OR: [
          { email: user.email },
          { subscriptionId: subscription.id },
          { workspaceId: workspace.id },
        ],
      },
    })
    await tx.registrationEmailVerification.deleteMany({ where: { email: user.email } })
    await tx.leadCapture.deleteMany({ where: { email: user.email } })
    await tx.oneTimeAccessCode.deleteMany({ where: { recipientEmail: user.email } })
    await tx.trialSignup.deleteMany({
      where: {
        OR: [
          { email: user.email },
          { userId: user.id },
          { workspaceId: workspace.id },
        ],
      },
    })
    await tx.subscriberFeedbackReport.updateMany({
      data: {
        reporterEmail: anonymizedEmail,
        reporterName: "Deleted subscriber",
        userId: null,
        workspaceId: null,
        workspaceLabel: null,
      },
      where: {
        OR: [
          { reporterEmail: user.email },
          { userId: user.id },
          { workspaceId: workspace.id },
        ],
      },
    })
    await tx.workspace.delete({ where: { id: workspace.id } })
    await tx.user.delete({ where: { id: user.id } })
  })

  return {
    canceledAt: canceledSubscription.canceled_at
      ? new Date(canceledSubscription.canceled_at * 1000).toISOString()
      : new Date().toISOString(),
    email: user.email,
    stripeCustomerId: subscription.stripeCustomerId,
    stripeStatus: canceledSubscription.status,
    stripeSubscriptionId: canceledSubscription.id,
    userId: user.id,
    workspaceId: workspace.id,
  }
}
