-- CreateTable
CREATE TABLE "OneTimeAccessCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "recipientName" TEXT,
    "recipientEmail" TEXT,
    "planSlug" TEXT NOT NULL DEFAULT 'starter',
    "freeDays" INTEGER NOT NULL DEFAULT 14,
    "startupSequenceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "invitationSentAt" TIMESTAMP(3),
    "invitationEmailStatus" TEXT NOT NULL DEFAULT 'NOT_ASSIGNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OneTimeAccessCode_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "TrialSignup"
ADD COLUMN "oneTimeAccessCodeId" TEXT,
ADD COLUMN "startupSequenceEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "OneTimeAccessCode_code_key" ON "OneTimeAccessCode"("code");
CREATE INDEX "OneTimeAccessCode_assignedAt_redeemedAt_idx" ON "OneTimeAccessCode"("assignedAt", "redeemedAt");
CREATE INDEX "OneTimeAccessCode_recipientEmail_idx" ON "OneTimeAccessCode"("recipientEmail");
CREATE INDEX "OneTimeAccessCode_isActive_idx" ON "OneTimeAccessCode"("isActive");
CREATE UNIQUE INDEX "TrialSignup_oneTimeAccessCodeId_key" ON "TrialSignup"("oneTimeAccessCodeId");
CREATE INDEX "TrialSignup_oneTimeAccessCodeId_idx" ON "TrialSignup"("oneTimeAccessCodeId");

-- AddForeignKey
ALTER TABLE "TrialSignup" ADD CONSTRAINT "TrialSignup_oneTimeAccessCodeId_fkey"
FOREIGN KEY ("oneTimeAccessCodeId") REFERENCES "OneTimeAccessCode"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
