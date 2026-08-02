import { getPrismaClient } from "@/lib/db"
import {
  resendEventDeliveryStatus,
  type ResendDeliveryEvent,
} from "@/lib/resend-delivery-policy"

export async function recordResendDeliveryEvent(input: {
  event: ResendDeliveryEvent
  webhookId: string
}) {
  const prisma = getPrismaClient()
  const eventCreatedAt = new Date(input.event.created_at)
  const deliveryStatus = resendEventDeliveryStatus(input.event.type)

  return prisma.$transaction(async (transaction) => {
    const created = await transaction.emailDeliveryWebhookEvent.createMany({
      data: [{
        eventCreatedAt,
        eventType: input.event.type,
        providerMessageId: input.event.data.email_id,
        webhookId: input.webhookId,
      }],
      skipDuplicates: true,
    })

    if (created.count === 0) {
      return { duplicate: true, matchedAttempts: 0 }
    }

    const matched = await transaction.emailDeliveryAttempt.updateMany({
      data: {
        deliveryStatus,
        deliveryUpdatedAt: eventCreatedAt,
      },
      where: {
        OR: [
          { deliveryUpdatedAt: null },
          { deliveryUpdatedAt: { lte: eventCreatedAt } },
        ],
        providerMessageId: input.event.data.email_id,
      },
    })

    await transaction.emailDeliveryWebhookEvent.update({
      data: { matchedAttempts: matched.count },
      where: { webhookId: input.webhookId },
    })

    return { duplicate: false, matchedAttempts: matched.count }
  })
}
