export const SUBSCRIBER_RETENTION_DAYS = 30

export function subscriberDeletionDate(now = new Date(), days = SUBSCRIBER_RETENTION_DAYS) {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
}
