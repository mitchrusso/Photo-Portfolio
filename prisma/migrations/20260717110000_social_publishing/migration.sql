CREATE TABLE "SocialConnection" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "providerAccountName" TEXT NOT NULL,
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" JSONB,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialDelivery" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "linkUrl" TEXT,
    "imageUrl" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),
    "lastError" TEXT,
    "providerPostId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SocialConnection_workspaceId_network_providerAccountId_key" ON "SocialConnection"("workspaceId", "network", "providerAccountId");
CREATE INDEX "SocialConnection_workspaceId_status_idx" ON "SocialConnection"("workspaceId", "status");
CREATE INDEX "SocialConnection_provider_status_idx" ON "SocialConnection"("provider", "status");
CREATE UNIQUE INDEX "SocialDelivery_idempotencyKey_key" ON "SocialDelivery"("idempotencyKey");
CREATE INDEX "SocialDelivery_status_scheduledFor_idx" ON "SocialDelivery"("status", "scheduledFor");
CREATE INDEX "SocialDelivery_workspaceId_scheduledFor_idx" ON "SocialDelivery"("workspaceId", "scheduledFor");
CREATE INDEX "SocialDelivery_connectionId_status_idx" ON "SocialDelivery"("connectionId", "status");
CREATE INDEX "SocialDelivery_galleryId_scheduledFor_idx" ON "SocialDelivery"("galleryId", "scheduledFor");

ALTER TABLE "SocialConnection" ADD CONSTRAINT "SocialConnection_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialDelivery" ADD CONSTRAINT "SocialDelivery_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialDelivery" ADD CONSTRAINT "SocialDelivery_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "SocialConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialDelivery" ADD CONSTRAINT "SocialDelivery_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialDelivery" ADD CONSTRAINT "SocialDelivery_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
