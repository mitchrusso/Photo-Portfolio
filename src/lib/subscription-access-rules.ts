export type SubscriptionAccessMode = "write" | "read-only" | "blocked"

export type SubscriptionAccessInput = {
  currentPeriodEnd?: Date | null
  status?: string | null
  trialEndsAt?: Date | null
}

export type SubscriptionAccessDecision = {
  code: string
  message: string
  mode: SubscriptionAccessMode
}

export function evaluateSubscriptionAccess(
  subscription: SubscriptionAccessInput | null | undefined,
  now = new Date(),
): SubscriptionAccessDecision {
  if (!subscription?.status) {
    return {
      code: "SUBSCRIPTION_MISSING",
      message: "We could not verify your plan in this login session. Sign out and sign back in to refresh access. If this continues, review billing or contact support.",
      mode: "blocked",
    }
  }

  if (subscription.status === "ACTIVE") {
    return {
      code: "SUBSCRIPTION_ACTIVE",
      message: "Your subscription is active.",
      mode: "write",
    }
  }

  if (subscription.status === "TRIALING") {
    const trialEndsAt = subscription.trialEndsAt ?? subscription.currentPeriodEnd
    if (!trialEndsAt) {
      return {
        code: "TRIAL_END_UNKNOWN",
        message: "This trial needs billing verification before more changes can be made.",
        mode: "read-only",
      }
    }

    if (trialEndsAt.getTime() <= now.getTime()) {
      return {
        code: "TRIAL_EXPIRED",
        message: "Your free trial has ended. Choose a plan to continue making changes; your existing work remains available to view.",
        mode: "read-only",
      }
    }

    return {
      code: "TRIAL_ACTIVE",
      message: "Your free trial is active.",
      mode: "write",
    }
  }

  const readOnlyMessages: Record<string, { code: string; message: string }> = {
    CANCELED: {
      code: "SUBSCRIPTION_CANCELED",
      message: "This subscription is canceled. Reactivate billing to make changes; your existing work remains available during the retention period.",
    },
    INCOMPLETE: {
      code: "BILLING_INCOMPLETE",
      message: "Billing setup is incomplete. Finish checkout before making portfolio changes.",
    },
    PAST_DUE: {
      code: "PAYMENT_PAST_DUE",
      message: "A payment needs attention. Update your payment method to resume portfolio changes.",
    },
    UNPAID: {
      code: "SUBSCRIPTION_UNPAID",
      message: "This account has an unpaid balance. Resolve billing to resume portfolio changes.",
    },
  }
  const readOnly = readOnlyMessages[subscription.status]

  if (readOnly) return { ...readOnly, mode: "read-only" }

  return {
    code: "SUBSCRIPTION_BLOCKED",
    message: "This account cannot make portfolio changes until billing is restored.",
    mode: "blocked",
  }
}
