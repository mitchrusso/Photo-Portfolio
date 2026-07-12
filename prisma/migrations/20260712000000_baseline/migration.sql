-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'CLIENT');

-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('USER', 'SUPPORT', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'UNPAID');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "OveragePolicy" AS ENUM ('ASK_FIRST', 'AUTO_UPGRADE_NEXT_TIER', 'AUTO_BUY_BLOCKS');

-- CreateEnum
CREATE TYPE "GalleryPrivacy" AS ENUM ('PUBLIC', 'UNLISTED', 'PASSWORD', 'CLIENT_PORTAL', 'PRIVATE');

-- CreateEnum
CREATE TYPE "GalleryStatus" AS ENUM ('DRAFT', 'PROOFING', 'FOR_SALE', 'DELIVERED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PhotoKind" AS ENUM ('IMAGE', 'RAW', 'VIDEO');

-- CreateEnum
CREATE TYPE "WatermarkMode" AS ENUM ('TEXT', 'IMAGE', 'BOTH');

-- CreateEnum
CREATE TYPE "WatermarkPosition" AS ENUM ('TOP_LEFT', 'TOP_RIGHT', 'CENTER', 'BOTTOM_LEFT', 'BOTTOM_RIGHT');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('PAGE', 'BLOG', 'TRIP', 'ARTICLE', 'GEAR');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StorageEventType" AS ENUM ('ORIGINAL_UPLOADED', 'DISPLAY_GENERATED', 'THUMBNAIL_GENERATED', 'WATERMARK_UPLOADED', 'FILE_DELETED', 'IMPORTED', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "authProviderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "systemRole" "SystemRole" NOT NULL DEFAULT 'USER',
    "adminPermissions" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLoginToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "MagicLoginToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerName" TEXT,
    "publicBrandName" TEXT,
    "publicDomain" TEXT,
    "supportEmail" TEXT,
    "storageUsedBytes" BIGINT NOT NULL DEFAULT 0,
    "storageLimitBytes" BIGINT NOT NULL DEFAULT 10737418240,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stripePriceId" TEXT,
    "monthlyPriceCents" INTEGER NOT NULL,
    "annualPriceCents" INTEGER,
    "storageLimitBytes" BIGINT NOT NULL,
    "bandwidthLimitBytes" BIGINT NOT NULL DEFAULT 10737418240,
    "maxUploadBytes" BIGINT NOT NULL DEFAULT 104857600,
    "trialDays" INTEGER NOT NULL DEFAULT 14,
    "galleryLimit" INTEGER,
    "memberLimit" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "billingCycle" "BillingCycle",
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripePriceId" TEXT,
    "trialStartedAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "storagePurchasedBytes" BIGINT NOT NULL DEFAULT 0,
    "bandwidthLimitBytes" BIGINT NOT NULL DEFAULT 10737418240,
    "maxUploadBytes" BIGINT NOT NULL DEFAULT 104857600,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "autoRolloverEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bandwidthPeriodEndsAt" TIMESTAMP(3),
    "bandwidthPeriodStartedAt" TIMESTAMP(3),
    "bandwidthUsedBytes" BIGINT NOT NULL DEFAULT 0,
    "bandwidthWarningSentAt" TIMESTAMP(3),
    "overagePolicy" "OveragePolicy" NOT NULL DEFAULT 'ASK_FIRST',
    "storageWarningSentAt" TIMESTAMP(3),
    "bandwidthAlertLevel" INTEGER NOT NULL DEFAULT 0,
    "storageAlertLevel" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancellationSurvey" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "workspaceId" TEXT,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'CANCEL_SURVEY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CancellationSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAutomationDelivery" (
    "id" TEXT NOT NULL,
    "deliveryKey" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "workspaceId" TEXT,
    "email" TEXT NOT NULL,
    "automationKey" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "providerStatus" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailAutomationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialSignup" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "studioName" TEXT,
    "website" TEXT,
    "planSlug" TEXT NOT NULL,
    "billingCycle" "BillingCycle",
    "storageRequested" TEXT,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "autoresponderStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "trialStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trialEndsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "workspaceId" TEXT,
    "couponCodeId" TEXT,

    CONSTRAINT "TrialSignup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gallery" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "clientId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "GalleryStatus" NOT NULL DEFAULT 'DRAFT',
    "privacy" "GalleryPrivacy" NOT NULL DEFAULT 'PRIVATE',
    "passwordHash" TEXT,
    "coverPhotoId" TEXT,
    "allowDownloads" BOOLEAN NOT NULL DEFAULT true,
    "allowSocialSharing" BOOLEAN NOT NULL DEFAULT true,
    "watermarkEnabled" BOOLEAN NOT NULL DEFAULT false,
    "watermarkMode" "WatermarkMode" NOT NULL DEFAULT 'TEXT',
    "watermarkText" TEXT,
    "watermarkImageUrl" TEXT,
    "watermarkOpacity" INTEGER NOT NULL DEFAULT 55,
    "watermarkSize" INTEGER NOT NULL DEFAULT 140,
    "watermarkPosition" "WatermarkPosition" NOT NULL DEFAULT 'BOTTOM_RIGHT',
    "storageUsedBytes" BIGINT NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "coverImageUrl" TEXT,
    "settings" JSONB,

    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT,
    "fileName" TEXT NOT NULL,
    "kind" "PhotoKind" NOT NULL DEFAULT 'IMAGE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "originalUrl" TEXT NOT NULL,
    "displayUrl" TEXT,
    "thumbnailUrl" TEXT,
    "downloadUrl" TEXT,
    "sourceUrl" TEXT,
    "bytes" BIGINT NOT NULL DEFAULT 0,
    "displayBytes" BIGINT NOT NULL DEFAULT 0,
    "thumbnailBytes" BIGINT NOT NULL DEFAULT 0,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofSelection" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "clientName" TEXT,
    "clientEmail" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProofSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageUsageEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "galleryId" TEXT,
    "photoId" TEXT,
    "type" "StorageEventType" NOT NULL,
    "bytesDelta" BIGINT NOT NULL,
    "pathname" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorageUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPost" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT,
    "heroImageUrl" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "publishedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GearItem" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "amazonUrl" TEXT NOT NULL,
    "affiliateTag" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GearItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialShareEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "galleryId" TEXT,
    "network" TEXT NOT NULL,
    "shareUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialShareEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "referrer" TEXT,
    "visitorId" TEXT,
    "sessionId" TEXT,
    "deviceType" TEXT NOT NULL,
    "galleryId" TEXT,
    "durationMs" INTEGER,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "planSlug" TEXT NOT NULL,
    "freeDays" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "maxRedemptions" INTEGER,
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "leadMagnetTitle" TEXT,
    "leadMagnetNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CouponCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadCapture" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CAPTURED',
    "couponCodeId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadCapture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_authProviderId_key" ON "User"("authProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLoginToken_tokenHash_key" ON "MagicLoginToken"("tokenHash");

-- CreateIndex
CREATE INDEX "MagicLoginToken_email_idx" ON "MagicLoginToken"("email");

-- CreateIndex
CREATE INDEX "MagicLoginToken_expiresAt_idx" ON "MagicLoginToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_stripePriceId_key" ON "Plan"("stripePriceId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_workspaceId_key" ON "Subscription"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCheckoutSessionId_key" ON "Subscription"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "CancellationSurvey_subscriptionId_idx" ON "CancellationSurvey"("subscriptionId");

-- CreateIndex
CREATE INDEX "CancellationSurvey_workspaceId_idx" ON "CancellationSurvey"("workspaceId");

-- CreateIndex
CREATE INDEX "CancellationSurvey_email_idx" ON "CancellationSurvey"("email");

-- CreateIndex
CREATE INDEX "CancellationSurvey_createdAt_idx" ON "CancellationSurvey"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAutomationDelivery_deliveryKey_key" ON "EmailAutomationDelivery"("deliveryKey");

-- CreateIndex
CREATE INDEX "EmailAutomationDelivery_subscriptionId_idx" ON "EmailAutomationDelivery"("subscriptionId");

-- CreateIndex
CREATE INDEX "EmailAutomationDelivery_workspaceId_idx" ON "EmailAutomationDelivery"("workspaceId");

-- CreateIndex
CREATE INDEX "EmailAutomationDelivery_email_idx" ON "EmailAutomationDelivery"("email");

-- CreateIndex
CREATE INDEX "EmailAutomationDelivery_automationKey_idx" ON "EmailAutomationDelivery"("automationKey");

-- CreateIndex
CREATE INDEX "EmailAutomationDelivery_event_idx" ON "EmailAutomationDelivery"("event");

-- CreateIndex
CREATE INDEX "EmailAutomationDelivery_sentAt_idx" ON "EmailAutomationDelivery"("sentAt");

-- CreateIndex
CREATE INDEX "TrialSignup_email_idx" ON "TrialSignup"("email");

-- CreateIndex
CREATE INDEX "TrialSignup_planSlug_idx" ON "TrialSignup"("planSlug");

-- CreateIndex
CREATE INDEX "TrialSignup_trialEndsAt_idx" ON "TrialSignup"("trialEndsAt");

-- CreateIndex
CREATE INDEX "TrialSignup_couponCodeId_idx" ON "TrialSignup"("couponCodeId");

-- CreateIndex
CREATE INDEX "Client_workspaceId_email_idx" ON "Client"("workspaceId", "email");

-- CreateIndex
CREATE INDEX "Gallery_workspaceId_status_idx" ON "Gallery"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "Gallery_workspaceId_privacy_idx" ON "Gallery"("workspaceId", "privacy");

-- CreateIndex
CREATE UNIQUE INDEX "Gallery_workspaceId_slug_key" ON "Gallery"("workspaceId", "slug");

-- CreateIndex
CREATE INDEX "Photo_workspaceId_idx" ON "Photo"("workspaceId");

-- CreateIndex
CREATE INDEX "Photo_galleryId_sortOrder_idx" ON "Photo"("galleryId", "sortOrder");

-- CreateIndex
CREATE INDEX "Photo_galleryId_isHidden_idx" ON "Photo"("galleryId", "isHidden");

-- CreateIndex
CREATE INDEX "ProofSelection_galleryId_clientEmail_idx" ON "ProofSelection"("galleryId", "clientEmail");

-- CreateIndex
CREATE INDEX "ProofSelection_photoId_idx" ON "ProofSelection"("photoId");

-- CreateIndex
CREATE INDEX "StorageUsageEvent_workspaceId_createdAt_idx" ON "StorageUsageEvent"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "StorageUsageEvent_galleryId_idx" ON "StorageUsageEvent"("galleryId");

-- CreateIndex
CREATE INDEX "StorageUsageEvent_photoId_idx" ON "StorageUsageEvent"("photoId");

-- CreateIndex
CREATE INDEX "ContentPost_workspaceId_type_status_idx" ON "ContentPost"("workspaceId", "type", "status");

-- CreateIndex
CREATE INDEX "ContentPost_publishedAt_idx" ON "ContentPost"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentPost_workspaceId_slug_key" ON "ContentPost"("workspaceId", "slug");

-- CreateIndex
CREATE INDEX "GearItem_workspaceId_category_idx" ON "GearItem"("workspaceId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "GearItem_workspaceId_slug_key" ON "GearItem"("workspaceId", "slug");

-- CreateIndex
CREATE INDEX "ContactMessage_workspaceId_createdAt_idx" ON "ContactMessage"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "SocialShareEvent_workspaceId_createdAt_idx" ON "SocialShareEvent"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "SocialShareEvent_galleryId_idx" ON "SocialShareEvent"("galleryId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_userId_createdAt_idx" ON "AdminAuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_path_createdAt_idx" ON "AnalyticsEvent"("path", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_deviceType_createdAt_idx" ON "AnalyticsEvent"("deviceType", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_galleryId_createdAt_idx" ON "AnalyticsEvent"("galleryId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CouponCode_code_key" ON "CouponCode"("code");

-- CreateIndex
CREATE INDEX "CouponCode_code_idx" ON "CouponCode"("code");

-- CreateIndex
CREATE INDEX "CouponCode_expiresAt_idx" ON "CouponCode"("expiresAt");

-- CreateIndex
CREATE INDEX "CouponCode_isActive_idx" ON "CouponCode"("isActive");

-- CreateIndex
CREATE INDEX "LeadCapture_email_idx" ON "LeadCapture"("email");

-- CreateIndex
CREATE INDEX "LeadCapture_source_idx" ON "LeadCapture"("source");

-- CreateIndex
CREATE INDEX "LeadCapture_couponCodeId_idx" ON "LeadCapture"("couponCodeId");

-- CreateIndex
CREATE INDEX "LeadCapture_createdAt_idx" ON "LeadCapture"("createdAt");

-- AddForeignKey
ALTER TABLE "MagicLoginToken" ADD CONSTRAINT "MagicLoginToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationSurvey" ADD CONSTRAINT "CancellationSurvey_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationSurvey" ADD CONSTRAINT "CancellationSurvey_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialSignup" ADD CONSTRAINT "TrialSignup_couponCodeId_fkey" FOREIGN KEY ("couponCodeId") REFERENCES "CouponCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialSignup" ADD CONSTRAINT "TrialSignup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialSignup" ADD CONSTRAINT "TrialSignup_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_coverPhotoId_fkey" FOREIGN KEY ("coverPhotoId") REFERENCES "Photo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofSelection" ADD CONSTRAINT "ProofSelection_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofSelection" ADD CONSTRAINT "ProofSelection_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageUsageEvent" ADD CONSTRAINT "StorageUsageEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPost" ADD CONSTRAINT "ContentPost_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GearItem" ADD CONSTRAINT "GearItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialShareEvent" ADD CONSTRAINT "SocialShareEvent_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialShareEvent" ADD CONSTRAINT "SocialShareEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadCapture" ADD CONSTRAINT "LeadCapture_couponCodeId_fkey" FOREIGN KEY ("couponCodeId") REFERENCES "CouponCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
