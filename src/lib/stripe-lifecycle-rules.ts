export function isPaidStripeInvoice(amountPaid: unknown) {
  return typeof amountPaid === "number" && Number.isFinite(amountPaid) && amountPaid > 0
}

export function isStripeSubscriptionCancellationScheduled(subscription: Record<string, unknown>) {
  if (subscription.cancel_at_period_end === true) return true

  return typeof subscription.cancel_at === "number" &&
    Number.isFinite(subscription.cancel_at) &&
    subscription.cancel_at > 0
}

export function getInvoiceSubscriptionStatus(
  eventType: "invoice.payment_failed" | "invoice.payment_succeeded",
  amountPaid: unknown,
) {
  if (eventType === "invoice.payment_failed") return "PAST_DUE" as const
  return isPaidStripeInvoice(amountPaid) ? "ACTIVE" as const : null
}
