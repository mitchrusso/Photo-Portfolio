ALTER TABLE "SubscriberFeedbackReport"
ADD COLUMN "brandKey" TEXT NOT NULL DEFAULT 'photoview',
ADD COLUMN "intakeKey" TEXT,
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'IN_APP',
ADD COLUMN "lifecycleState" TEXT NOT NULL DEFAULT 'QUEUED',
ADD COLUMN "gmailMessageId" TEXT,
ADD COLUMN "gmailThreadId" TEXT,
ADD COLUMN "leaseId" TEXT,
ADD COLUMN "leaseExpiresAt" TIMESTAMP(3),
ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN "responseAcceptedAt" TIMESTAMP(3),
ADD COLUMN "deliveredAt" TIMESTAMP(3),
ADD COLUMN "escalatedAt" TIMESTAMP(3),
ADD COLUMN "escalationReason" TEXT,
ADD COLUMN "resolvedAt" TIMESTAMP(3);

ALTER TABLE "SupportEmailOutbox"
ADD COLUMN "brandKey" TEXT NOT NULL DEFAULT 'photoview',
ADD COLUMN "gmailThreadId" TEXT,
ADD COLUMN "inReplyTo" TEXT;

CREATE UNIQUE INDEX "SubscriberFeedbackReport_intakeKey_key"
ON "SubscriberFeedbackReport"("intakeKey");
CREATE UNIQUE INDEX "SubscriberFeedbackReport_gmailMessageId_key"
ON "SubscriberFeedbackReport"("gmailMessageId");
CREATE INDEX "SubscriberFeedbackReport_brandKey_lifecycleState_nextAttemptAt_idx"
ON "SubscriberFeedbackReport"("brandKey", "lifecycleState", "nextAttemptAt");
CREATE INDEX "SubscriberFeedbackReport_gmailThreadId_createdAt_idx"
ON "SubscriberFeedbackReport"("gmailThreadId", "createdAt");
CREATE INDEX "SubscriberFeedbackReport_leaseExpiresAt_idx"
ON "SubscriberFeedbackReport"("leaseExpiresAt");

CREATE TABLE "SupportCaseAttachment" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "sha256" TEXT NOT NULL,
  "payload" BYTEA,
  "providerRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportCaseAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportCaseMessage" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "providerMessageId" TEXT NOT NULL,
  "providerThreadId" TEXT,
  "rfcMessageId" TEXT,
  "direction" TEXT NOT NULL,
  "senderEmail" TEXT NOT NULL,
  "senderName" TEXT,
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportCaseMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportAlert" (
  "id" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "brandKey" TEXT NOT NULL DEFAULT 'photoview',
  "reportId" TEXT,
  "kind" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "adminUrl" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportAlert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportAlertDelivery" (
  "id" TEXT NOT NULL,
  "alertId" TEXT NOT NULL,
  "brandKey" TEXT NOT NULL DEFAULT 'photoview',
  "channel" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processingStartedAt" TIMESTAMP(3),
  "providerId" TEXT,
  "providerStatus" TEXT,
  "lastError" TEXT,
  "acceptedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportAlertDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportWorkerHeartbeat" (
  "name" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportWorkerHeartbeat_pkey" PRIMARY KEY ("name")
);

CREATE TABLE "SupportMailboxReceipt" (
  "messageId" TEXT NOT NULL,
  "disposition" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportMailboxReceipt_pkey" PRIMARY KEY ("messageId")
);

CREATE INDEX "SupportMailboxReceipt_disposition_receivedAt_idx"
ON "SupportMailboxReceipt"("disposition", "receivedAt");

CREATE INDEX "SupportCaseAttachment_reportId_createdAt_idx"
ON "SupportCaseAttachment"("reportId", "createdAt");
CREATE UNIQUE INDEX "SupportCaseMessage_providerMessageId_key"
ON "SupportCaseMessage"("providerMessageId");
CREATE INDEX "SupportCaseMessage_reportId_receivedAt_idx"
ON "SupportCaseMessage"("reportId", "receivedAt");
CREATE INDEX "SupportCaseMessage_providerThreadId_receivedAt_idx"
ON "SupportCaseMessage"("providerThreadId", "receivedAt");
CREATE UNIQUE INDEX "SupportAlert_eventKey_key" ON "SupportAlert"("eventKey");
CREATE INDEX "SupportAlert_brandKey_status_createdAt_idx"
ON "SupportAlert"("brandKey", "status", "createdAt");
CREATE INDEX "SupportAlert_reportId_createdAt_idx"
ON "SupportAlert"("reportId", "createdAt");
CREATE UNIQUE INDEX "SupportAlertDelivery_alertId_channel_key"
ON "SupportAlertDelivery"("alertId", "channel");
CREATE INDEX "SupportAlertDelivery_status_nextAttemptAt_idx"
ON "SupportAlertDelivery"("status", "nextAttemptAt");
CREATE INDEX "SupportAlertDelivery_brandKey_channel_status_idx"
ON "SupportAlertDelivery"("brandKey", "channel", "status");

ALTER TABLE "SupportCaseAttachment"
ADD CONSTRAINT "SupportCaseAttachment_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "SubscriberFeedbackReport"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupportCaseMessage"
ADD CONSTRAINT "SupportCaseMessage_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "SubscriberFeedbackReport"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupportAlert"
ADD CONSTRAINT "SupportAlert_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "SubscriberFeedbackReport"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupportAlertDelivery"
ADD CONSTRAINT "SupportAlertDelivery_alertId_fkey"
FOREIGN KEY ("alertId") REFERENCES "SupportAlert"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
