type RegistrationReadinessInput = {
  couponApplied: boolean
  priceId?: string
}

export type SubscriberRegistrationReadiness = {
  missing: string[]
  ready: boolean
}

function configured(name: string) {
  return Boolean(process.env[name]?.trim())
}

export function getSubscriberRegistrationReadiness({
  couponApplied,
  priceId,
}: RegistrationReadinessInput): SubscriberRegistrationReadiness {
  const missing = [
    !configured("DATABASE_URL") ? "subscriber database" : null,
    !configured("AUTH_SECRET") ? "secure login" : null,
    !(configured("RESEND_API_KEY") && (configured("EMAIL_FROM") || configured("RESEND_FROM_EMAIL")))
      ? "subscriber email"
      : null,
    !couponApplied && !configured("STRIPE_SECRET_KEY") ? "Stripe billing" : null,
    !couponApplied && !priceId ? "selected plan price" : null,
  ].filter((value): value is string => Boolean(value))

  return {
    missing,
    ready: missing.length === 0,
  }
}
