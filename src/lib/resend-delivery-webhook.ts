import { getPrismaClient } from "@/lib/db"
import {
  resendEventDeliveryStatus,
  shouldSuppressRecipientForResendEvent,
  type ResendDeliveryEvent,
} from "@/lib/resend-delivery-policy"

export async function recordResendDeliveryEvent(input: {
  event: ResendDeliveryEvent
  webhookId: string
}) {
  const prisma = getPrismaClient()
  const eventCreatedAt = new Date(input.event.created_at)
  const deliveryStatus = resendEventDeliveryStatus(input.event.type)
  const shouldSuppress = shouldSuppressRecipientForResendEvent(input.event.type)

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

    const attempts = await transaction.emailDeliveryAttempt.findMany({
      select: { recipientHash: true, requestId: true },
      where: { providerMessageId: input.event.data.email_id },
    })
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

    if (shouldSuppress) {
      for (const recipientHash of new Set(attempts.map((attempt) => attempt.recipientHash))) {
        await transaction.emailSuppression.upsert({
          create: { reason: deliveryStatus, recipientHash },
          update: { reason: deliveryStatus, source: "resend_webhook" },
          where: { recipientHash },
        })
      }
    }

    const supportDeliveryKeys = Array.from(new Set(attempts.map((attempt) => attempt.requestId)))
    let failedSupportMessages: Array<{ id: string; reportId: string | null; source: string }> = []
    if (supportDeliveryKeys.length > 0 && deliveryStatus === "DELIVERED") {
      await transaction.supportEmailOutbox.updateMany({
        data: { lastError: null, providerStatus: deliveryStatus, status: "DELIVERED" },
        where: { deliveryKey: { in: supportDeliveryKeys }, status: "SENT" },
      })
    } else if (supportDeliveryKeys.length > 0 && ["BOUNCED", "COMPLAINED", "FAILED", "SUPPRESSED"].includes(deliveryStatus)) {
      failedSupportMessages = await transaction.supportEmailOutbox.findMany({
        select: { id: true, reportId: true, source: true },
        where: { deliveryKey: { in: supportDeliveryKeys }, status: { in: ["SENT", "DELIVERED"] } },
      })
      await transaction.supportEmailOutbox.updateMany({
        data: { lastError: deliveryStatus, providerStatus: deliveryStatus, status: "FAILED" },
        where: { id: { in: failedSupportMessages.map((message) => message.id) } },
      })
    }

    await transaction.emailDeliveryWebhookEvent.update({
      data: { matchedAttempts: matched.count },
      where: { webhookId: input.webhookId },
    })

    return { duplicate: false, failedSupportMessages, matchedAttempts: matched.count }
  })
}
