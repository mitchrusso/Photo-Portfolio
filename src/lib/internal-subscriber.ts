const INTERNAL_SUBSCRIBER_EMAILS = new Set([
  "mitchrusso@yahoo.com",
])

export function isInternalSubscriberEmail(email: string | null | undefined) {
  return INTERNAL_SUBSCRIBER_EMAILS.has(email?.trim().toLowerCase() ?? "")
}
