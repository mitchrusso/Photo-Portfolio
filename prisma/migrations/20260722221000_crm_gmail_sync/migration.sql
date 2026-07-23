-- Keep Gmail and the partnership CRM synchronized without storing message bodies.
ALTER TABLE "CrmGoogleConnection"
  ADD COLUMN "lastSyncAt" TIMESTAMP(3),
  ADD COLUMN "lastSyncError" TEXT,
  ADD COLUMN "lastSyncMessageCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "CrmOutreach" ADD COLUMN "gmailMessageId" TEXT;
CREATE UNIQUE INDEX "CrmOutreach_gmailMessageId_key" ON "CrmOutreach"("gmailMessageId");

CREATE TABLE "CrmGmailMessage" (
  "id" TEXT NOT NULL,
  "gmailMessageId" TEXT NOT NULL,
  "threadId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "partnerId" TEXT,
  "contactId" TEXT,
  "direction" TEXT NOT NULL,
  "fromEmail" TEXT NOT NULL,
  "toEmails" JSONB NOT NULL,
  "subject" TEXT NOT NULL,
  "snippet" TEXT NOT NULL,
  "labels" JSONB NOT NULL,
  "gmailDate" TIMESTAMP(3) NOT NULL,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrmGmailMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CrmGmailMessage_gmailMessageId_key" ON "CrmGmailMessage"("gmailMessageId");
CREATE INDEX "CrmGmailMessage_threadId_idx" ON "CrmGmailMessage"("threadId");
CREATE INDEX "CrmGmailMessage_userId_gmailDate_idx" ON "CrmGmailMessage"("userId", "gmailDate");
CREATE INDEX "CrmGmailMessage_partnerId_gmailDate_idx" ON "CrmGmailMessage"("partnerId", "gmailDate");
CREATE INDEX "CrmGmailMessage_contactId_gmailDate_idx" ON "CrmGmailMessage"("contactId", "gmailDate");

ALTER TABLE "CrmGmailMessage" ADD CONSTRAINT "CrmGmailMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmGmailMessage" ADD CONSTRAINT "CrmGmailMessage_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "CrmPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmGmailMessage" ADD CONSTRAINT "CrmGmailMessage_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
