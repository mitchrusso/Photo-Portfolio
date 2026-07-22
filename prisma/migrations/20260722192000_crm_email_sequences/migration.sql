-- CreateTable
CREATE TABLE "CrmEmailSequence" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'Professional and consultative',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "stopOnReply" BOOLEAN NOT NULL DEFAULT true,
    "approvedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmEmailSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmEmailStep" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "gmailMessageId" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmEmailStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrmEmailSequence_partnerId_status_idx" ON "CrmEmailSequence"("partnerId", "status");
CREATE INDEX "CrmEmailSequence_contactId_idx" ON "CrmEmailSequence"("contactId");
CREATE INDEX "CrmEmailSequence_createdById_status_idx" ON "CrmEmailSequence"("createdById", "status");
CREATE UNIQUE INDEX "CrmEmailStep_sequenceId_position_key" ON "CrmEmailStep"("sequenceId", "position");
CREATE INDEX "CrmEmailStep_status_scheduledAt_idx" ON "CrmEmailStep"("status", "scheduledAt");

-- AddForeignKey
ALTER TABLE "CrmEmailSequence" ADD CONSTRAINT "CrmEmailSequence_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "CrmPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmEmailSequence" ADD CONSTRAINT "CrmEmailSequence_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmEmailSequence" ADD CONSTRAINT "CrmEmailSequence_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmEmailStep" ADD CONSTRAINT "CrmEmailStep_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "CrmEmailSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
