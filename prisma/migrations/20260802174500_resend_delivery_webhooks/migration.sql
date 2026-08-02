ALTER TABLE "EmailDeliveryAttempt"
ADD COLUMN "deliveryStatus" TEXT,
ADD COLUMN "deliveryUpdatedAt" TIMESTAMP(3);

CREATE INDEX "EmailDeliveryAttempt_deliveryStatus_deliveryUpdatedAt_idx"
ON "EmailDeliveryAttempt"("deliveryStatus", "deliveryUpdatedAt");

CREATE TABLE "EmailDeliveryWebhookEvent" (
    "webhookId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "providerMessageId" TEXT NOT NULL,
    "eventCreatedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchedAttempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EmailDeliveryWebhookEvent_pkey" PRIMARY KEY ("webhookId")
);

CREATE INDEX "EmailDeliveryWebhookEvent_eventType_eventCreatedAt_idx"
ON "EmailDeliveryWebhookEvent"("eventType", "eventCreatedAt");

CREATE INDEX "EmailDeliveryWebhookEvent_providerMessageId_idx"
ON "EmailDeliveryWebhookEvent"("providerMessageId");
