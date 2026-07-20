import { claimEmailDelivery, finishEmailDelivery } from "@/lib/email-delivery-idempotency"
import { sendLifecycleEmail } from "@/lib/lifecycle-email"
import { buildTrialSignupAlert } from "@/lib/trial-signup-alert-message"

const DEFAULT_TRIAL_SIGNUP_ALERT_EMAIL = "mitch@photoview.io"

type TrialSignupAlertStatus =
  | "already_sent"
  | "failed"
  | "in_progress"
  | "missing_record"
  | "sent"

export async function sendTrialSignupAlert({
  subscriptionId,
  workspaceId,
}: {
  subscriptionId: string
  workspaceId: string
}): Promise<TrialSignupAlertStatus> {
  const recipient = process.env.TRIAL_SIGNUP_ALERT_EMAIL?.trim() || DEFAULT_TRIAL_SIGNUP_ALERT_EMAIL

  try {
    const { getPrismaClient } = await import("@/lib/db")
    const prisma = getPrismaClient()
    const [subscription, signup] = await Promise.all([
      prisma.subscription.findUnique({
        select: {
          billingCycle: true,
          plan: { select: { name: true } },
          trialEndsAt: true,
        },
        where: { id: subscriptionId },
      }),
      prisma.trialSignup.findFirst({
        orderBy: { createdAt: "desc" },
        select: {
          billingCycle: true,
          email: true,
          firstName: true,
          id: true,
          lastName: true,
          trialEndsAt: true,
          trialStartedAt: true,
        },
        where: { workspaceId },
      }),
    ])

    if (!subscription || !signup) return "missing_record"

    const deliveryKey = `internal-trial-signup:${signup.id}`
    const claim = await claimEmailDelivery({
      automationKey: "internal_trial_signup",
      deliveryKey,
      email: recipient,
      event: "trial_activated",
      metadata: {
        billingCycle: signup.billingCycle ?? subscription.billingCycle,
        planName: subscription.plan.name,
        subscriberEmail: signup.email,
        trialSignupId: signup.id,
      },
      subscriptionId,
      workspaceId,
    })

    if (!claim.acquired) {
      return claim.state === "already_sent" ? "already_sent" : "in_progress"
    }

    const message = buildTrialSignupAlert({
      billingCycle: String(signup.billingCycle ?? subscription.billingCycle ?? "ANNUAL"),
      email: signup.email,
      firstName: signup.firstName,
      lastName: signup.lastName,
      planName: subscription.plan.name,
      signupAt: signup.trialStartedAt,
      trialEndsAt: subscription.trialEndsAt ?? signup.trialEndsAt,
    })
    const providerStatus = await sendLifecycleEmail({ ...message, to: recipient }, { idempotencyKey: deliveryKey })
    await finishEmailDelivery({ deliveryKey, providerStatus })

    return providerStatus === "sent" ? "sent" : "failed"
  } catch (error) {
    console.error("Trial signup alert could not be sent", error)
    return "failed"
  }
}
