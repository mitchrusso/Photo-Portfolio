ALTER TABLE "LeadCapture"
ADD COLUMN "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "resumeTokenHash" TEXT,
ADD COLUMN "resumeExpiresAt" TIMESTAMP(3),
ADD COLUMN "convertedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "LeadCapture_resumeTokenHash_key" ON "LeadCapture"("resumeTokenHash");
CREATE INDEX "LeadCapture_source_status_idx" ON "LeadCapture"("source", "status");
