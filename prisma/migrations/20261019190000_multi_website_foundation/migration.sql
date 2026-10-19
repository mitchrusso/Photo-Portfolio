-- Add one first-class website record per published experience so a workspace can
-- safely own additional drafts without granting a URL before activation.
CREATE TYPE "WebsiteStatus" AS ENUM ('DRAFT', 'ACTIVE', 'BILLING_FAILED', 'DISABLED', 'DELETED');
CREATE TYPE "WebsiteBillingType" AS ENUM ('INCLUDED', 'ADD_ON');

ALTER TABLE "Subscription"
  ADD COLUMN "additionalWebsiteStripeItemId" TEXT,
  ADD COLUMN "additionalWebsiteStripeSubscriptionId" TEXT,
  ADD COLUMN "additionalWebsitePriceId" TEXT,
  ADD COLUMN "additionalWebsiteQuantity" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "Subscription_additionalWebsiteStripeItemId_key"
  ON "Subscription"("additionalWebsiteStripeItemId");
CREATE UNIQUE INDEX "Subscription_additionalWebsiteStripeSubscriptionId_key"
  ON "Subscription"("additionalWebsiteStripeSubscriptionId");

CREATE TABLE "Website" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "billingType" "WebsiteBillingType" NOT NULL DEFAULT 'ADD_ON',
  "status" "WebsiteStatus" NOT NULL DEFAULT 'DRAFT',
  "requestedSubdomain" TEXT,
  "subdomain" TEXT,
  "customDomain" TEXT,
  "customDomainVerifiedAt" TIMESTAMP(3),
  "customDomainLastCheckedAt" TIMESTAMP(3),
  "draftBody" TEXT,
  "publishedBody" TEXT,
  "publishedAt" TIMESTAMP(3),
  "billingCommittedAt" TIMESTAMP(3),
  "activatedAt" TIMESTAMP(3),
  "disabledAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Website_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Website_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Website_subdomain_key" ON "Website"("subdomain");
CREATE UNIQUE INDEX "Website_customDomain_key" ON "Website"("customDomain");
CREATE INDEX "Website_workspaceId_status_idx" ON "Website"("workspaceId", "status");
CREATE INDEX "Website_workspaceId_createdAt_idx" ON "Website"("workspaceId", "createdAt");
CREATE UNIQUE INDEX "Website_one_primary_per_workspace_key"
  ON "Website"("workspaceId") WHERE "isPrimary" = true AND "deletedAt" IS NULL;

-- Preserve the current website, its live address, domain, draft, and publication.
-- The legacy Workspace and ContentPost fields remain during the rollout so the
-- existing production routes keep working until all consumers use Website.
INSERT INTO "Website" (
  "id",
  "workspaceId",
  "name",
  "isPrimary",
  "billingType",
  "status",
  "subdomain",
  "customDomain",
  "customDomainVerifiedAt",
  "customDomainLastCheckedAt",
  "draftBody",
  "publishedBody",
  "publishedAt",
  "activatedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  'primary-' || w."id",
  w."id",
  CASE
    WHEN NULLIF(BTRIM(w."name"), '') IS NULL THEN 'My Website'
    ELSE w."name" || ' Website'
  END,
  true,
  'INCLUDED'::"WebsiteBillingType",
  CASE
    WHEN published."id" IS NOT NULL OR w."websiteSubdomain" IS NOT NULL OR w."customDomain" IS NOT NULL
      THEN 'ACTIVE'::"WebsiteStatus"
    ELSE 'DRAFT'::"WebsiteStatus"
  END,
  w."websiteSubdomain",
  w."customDomain",
  w."customDomainVerifiedAt",
  w."customDomainLastCheckedAt",
  draft."body",
  published."body",
  published."publishedAt",
  CASE
    WHEN published."id" IS NOT NULL OR w."websiteSubdomain" IS NOT NULL OR w."customDomain" IS NOT NULL
      THEN COALESCE(published."publishedAt", w."updatedAt")
    ELSE NULL
  END,
  w."createdAt",
  GREATEST(
    w."updatedAt",
    COALESCE(draft."updatedAt", w."updatedAt"),
    COALESCE(published."updatedAt", w."updatedAt")
  )
FROM "Workspace" w
LEFT JOIN "ContentPost" draft
  ON draft."workspaceId" = w."id" AND draft."slug" = 'photoviewpro-website-draft'
LEFT JOIN "ContentPost" published
  ON published."workspaceId" = w."id" AND published."slug" = 'photoviewpro-website-published';
