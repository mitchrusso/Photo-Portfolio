-- CreateTable
CREATE TABLE "CrmPartner" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "valueCents" INTEGER NOT NULL,
    "website" TEXT NOT NULL,
    "nextStep" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "opportunity" TEXT NOT NULL,
    "painPoints" JSONB NOT NULL,
    "integration" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmContact" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT,
    "linkedin" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmActivity" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3),
    "displayDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmTask" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmMeeting" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmNote" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmOutreach" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "contactId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmOutreach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmGoogleConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "scopes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmGoogleConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrmPartner_slug_key" ON "CrmPartner"("slug");

-- CreateIndex
CREATE INDEX "CrmPartner_stage_score_idx" ON "CrmPartner"("stage", "score");

-- CreateIndex
CREATE INDEX "CrmContact_partnerId_isPrimary_idx" ON "CrmContact"("partnerId", "isPrimary");

-- CreateIndex
CREATE INDEX "CrmContact_email_idx" ON "CrmContact"("email");

-- CreateIndex
CREATE INDEX "CrmActivity_partnerId_createdAt_idx" ON "CrmActivity"("partnerId", "createdAt");

-- CreateIndex
CREATE INDEX "CrmTask_createdById_completedAt_dueAt_idx" ON "CrmTask"("createdById", "completedAt", "dueAt");

-- CreateIndex
CREATE INDEX "CrmTask_partnerId_idx" ON "CrmTask"("partnerId");

-- CreateIndex
CREATE INDEX "CrmMeeting_createdById_startsAt_idx" ON "CrmMeeting"("createdById", "startsAt");

-- CreateIndex
CREATE INDEX "CrmMeeting_partnerId_idx" ON "CrmMeeting"("partnerId");

-- CreateIndex
CREATE INDEX "CrmNote_partnerId_createdAt_idx" ON "CrmNote"("partnerId", "createdAt");

-- CreateIndex
CREATE INDEX "CrmNote_createdById_idx" ON "CrmNote"("createdById");

-- CreateIndex
CREATE INDEX "CrmOutreach_partnerId_createdAt_idx" ON "CrmOutreach"("partnerId", "createdAt");

-- CreateIndex
CREATE INDEX "CrmOutreach_createdById_status_idx" ON "CrmOutreach"("createdById", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CrmGoogleConnection_userId_key" ON "CrmGoogleConnection"("userId");

-- CreateIndex
CREATE INDEX "CrmGoogleConnection_email_idx" ON "CrmGoogleConnection"("email");

-- AddForeignKey
ALTER TABLE "CrmContact" ADD CONSTRAINT "CrmContact_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "CrmPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "CrmPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "CrmPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmMeeting" ADD CONSTRAINT "CrmMeeting_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "CrmPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmMeeting" ADD CONSTRAINT "CrmMeeting_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmNote" ADD CONSTRAINT "CrmNote_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "CrmPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmNote" ADD CONSTRAINT "CrmNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmOutreach" ADD CONSTRAINT "CrmOutreach_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "CrmPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmOutreach" ADD CONSTRAINT "CrmOutreach_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmGoogleConnection" ADD CONSTRAINT "CrmGoogleConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
