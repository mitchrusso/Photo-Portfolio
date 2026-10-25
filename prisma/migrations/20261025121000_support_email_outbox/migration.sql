CREATE TABLE "SupportEmailOutbox" (
  "id" TEXT NOT NULL,
  "deliveryKey" TEXT NOT NULL,
  "reportId" TEXT,
  "source" TEXT NOT NULL,
  "toEmail" TEXT NOT NULL,
  "recipientName" TEXT,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "targetReportStatus" TEXT,
  "resolutionNote" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "providerStatus" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processingStartedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SupportEmailOutbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupportEmailOutbox_deliveryKey_key" ON "SupportEmailOutbox"("deliveryKey");
CREATE INDEX "SupportEmailOutbox_status_nextAttemptAt_idx" ON "SupportEmailOutbox"("status", "nextAttemptAt");
CREATE INDEX "SupportEmailOutbox_reportId_createdAt_idx" ON "SupportEmailOutbox"("reportId", "createdAt");
CREATE INDEX "SupportEmailOutbox_toEmail_createdAt_idx" ON "SupportEmailOutbox"("toEmail", "createdAt");
