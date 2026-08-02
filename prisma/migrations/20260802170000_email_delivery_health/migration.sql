CREATE TABLE "EmailDeliveryAttempt" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "recipientHash" TEXT NOT NULL,
    "recipientDomain" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'resend',
    "providerMessageId" TEXT,
    "status" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "errorCode" TEXT,
    "attempt" INTEGER NOT NULL,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailDeliveryAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailDeliveryAttempt_requestId_attempt_key"
ON "EmailDeliveryAttempt"("requestId", "attempt");

CREATE INDEX "EmailDeliveryAttempt_createdAt_idx"
ON "EmailDeliveryAttempt"("createdAt");

CREATE INDEX "EmailDeliveryAttempt_status_createdAt_idx"
ON "EmailDeliveryAttempt"("status", "createdAt");

CREATE INDEX "EmailDeliveryAttempt_messageType_createdAt_idx"
ON "EmailDeliveryAttempt"("messageType", "createdAt");

CREATE INDEX "EmailDeliveryAttempt_recipientHash_createdAt_idx"
ON "EmailDeliveryAttempt"("recipientHash", "createdAt");
