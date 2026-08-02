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
