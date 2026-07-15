export const CRITICAL_ALERT_COOLDOWN_MS = 30 * 60 * 1000
export const STRIPE_WEBHOOK_STALE_MS = 5 * 60 * 1000

export function criticalAlertCooldownElapsed(
  lastAlertedAt: Date | null,
  now: Date,
  cooldownMs = CRITICAL_ALERT_COOLDOWN_MS,
) {
  return !lastAlertedAt || now.getTime() - lastAlertedAt.getTime() >= cooldownMs
}

export function stripeWebhookStaleBefore(now: Date) {
  return new Date(now.getTime() - STRIPE_WEBHOOK_STALE_MS)
}

export function usageAlertWasDelivered(status: {
  autoresponderStatus: string
  emailStatus: string
}) {
  return status.autoresponderStatus === "sent" || status.emailStatus === "sent"
}
