import { z } from "zod"
import { Webhook } from "svix"

export const RESEND_DELIVERY_EVENT_TYPES = [
  "email.bounced",
  "email.complained",
  "email.delivered",
  "email.delivery_delayed",
  "email.failed",
  "email.suppressed",
] as const

const resendDeliveryEventSchema = z.object({
  created_at: z.string().datetime({ offset: true }),
  data: z.object({
    email_id: z.string().trim().min(1).max(190),
  }),
  type: z.enum(RESEND_DELIVERY_EVENT_TYPES),
})

export type ResendDeliveryEvent = z.infer<typeof resendDeliveryEventSchema>

export function parseResendDeliveryEvent(value: unknown) {
  return resendDeliveryEventSchema.safeParse(value)
}

export function resendEventDeliveryStatus(eventType: ResendDeliveryEvent["type"]) {
  return eventType.slice("email.".length).toUpperCase()
}

const RESEND_API_DELIVERY_STATUSES = new Set([
  "BOUNCED",
  "COMPLAINED",
  "DELIVERED",
  "DELIVERY_DELAYED",
  "FAILED",
  "SUPPRESSED",
])

export function resendApiDeliveryStatus(lastEvent: unknown) {
  if (typeof lastEvent !== "string") return null
  const normalized = lastEvent.trim().replaceAll(".", "_").toUpperCase()
  return RESEND_API_DELIVERY_STATUSES.has(normalized) ? normalized : null
}

export function shouldSuppressRecipientForDeliveryStatus(status: string) {
  return status === "BOUNCED" || status === "COMPLAINED" || status === "SUPPRESSED"
}

export function shouldOpenResendReconciliationIncident(input: {
  checked: number
  failed: number
  webhookConfigured: boolean
}) {
  return input.checked > 0 && input.failed === input.checked && !input.webhookConfigured
}

export function shouldSuppressRecipientForResendEvent(eventType: ResendDeliveryEvent["type"]) {
  return eventType === "email.bounced"
    || eventType === "email.complained"
    || eventType === "email.suppressed"
}

export function verifyResendWebhookPayload(input: {
  id: string
  payload: string
  secret: string
  signature: string
  timestamp: string
}) {
  return new Webhook(input.secret).verify(input.payload, {
    "svix-id": input.id,
    "svix-signature": input.signature,
    "svix-timestamp": input.timestamp,
  })
}
