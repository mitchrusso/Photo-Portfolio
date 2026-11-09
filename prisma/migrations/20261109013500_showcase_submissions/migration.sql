CREATE TABLE "ShowcaseSubmission" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "galleryId" TEXT NOT NULL,
  "photoId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "photographer" TEXT NOT NULL,
  "portfolioName" TEXT NOT NULL,
  "gallerySlug" TEXT NOT NULL,
  "workspaceSlug" TEXT NOT NULL,
  "location" TEXT,
  "tags" JSONB,
  "status" TEXT NOT NULL DEFAULT 'APPROVED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShowcaseSubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShowcaseSubmission_workspaceId_galleryId_photoId_key"
  ON "ShowcaseSubmission"("workspaceId", "galleryId", "photoId");
CREATE INDEX "ShowcaseSubmission_status_createdAt_idx"
  ON "ShowcaseSubmission"("status", "createdAt");
CREATE INDEX "ShowcaseSubmission_workspaceId_createdAt_idx"
  ON "ShowcaseSubmission"("workspaceId", "createdAt");
ALTER TABLE "ShowcaseSubmission"
  ADD CONSTRAINT "ShowcaseSubmission_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
