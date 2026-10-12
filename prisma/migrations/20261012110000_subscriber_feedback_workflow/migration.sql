CREATE TABLE "SubscriberFeedbackReport" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "pageUrl" TEXT,
  "reporterEmail" TEXT NOT NULL,
  "reporterName" TEXT NOT NULL,
  "userId" TEXT,
  "workspaceId" TEXT,
  "workspaceLabel" TEXT,
  "attachmentCount" INTEGER NOT NULL DEFAULT 0,
  "approvedAt" TIMESTAMP(3),
  "fixedAt" TIMESTAMP(3),
  "resolutionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SubscriberFeedbackReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SubscriberFeedbackReport_type_status_createdAt_idx"
ON "SubscriberFeedbackReport"("type", "status", "createdAt");

CREATE INDEX "SubscriberFeedbackReport_workspaceId_createdAt_idx"
ON "SubscriberFeedbackReport"("workspaceId", "createdAt");

CREATE INDEX "SubscriberFeedbackReport_reporterEmail_createdAt_idx"
ON "SubscriberFeedbackReport"("reporterEmail", "createdAt");
