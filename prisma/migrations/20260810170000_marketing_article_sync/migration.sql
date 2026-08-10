CREATE TABLE "MarketingArticle" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceArticleId" TEXT NOT NULL,
    "sourceSlug" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "excerpt" TEXT,
    "contentHtml" TEXT NOT NULL,
    "heroImageUrl" TEXT,
    "keywords" JSONB NOT NULL,
    "languageCode" TEXT NOT NULL DEFAULT 'en',
    "faqJsonLd" JSONB,
    "contentHash" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sourceCreatedAt" TIMESTAMP(3),
    "sourceUpdatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingArticle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketingArticle_slug_key" ON "MarketingArticle"("slug");
CREATE UNIQUE INDEX "MarketingArticle_contentHash_key" ON "MarketingArticle"("contentHash");
CREATE UNIQUE INDEX "MarketingArticle_source_sourceArticleId_key" ON "MarketingArticle"("source", "sourceArticleId");
CREATE INDEX "MarketingArticle_isPublished_publishedAt_idx" ON "MarketingArticle"("isPublished", "publishedAt");
CREATE INDEX "MarketingArticle_source_isPublished_idx" ON "MarketingArticle"("source", "isPublished");
