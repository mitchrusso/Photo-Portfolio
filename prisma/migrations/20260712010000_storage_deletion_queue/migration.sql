-- CreateEnum
CREATE TYPE "StorageDeletionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Workspace" ALTER COLUMN "storageLimitBytes" SET DEFAULT 2147483648;

-- AlterTable
ALTER TABLE "Plan" ALTER COLUMN "bandwidthLimitBytes" SET DEFAULT 5368709120;

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "bandwidthLimitBytes" SET DEFAULT 5368709120;

-- CreateTable
CREATE TABLE "StorageDeletionJob" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "galleryId" TEXT,
    "photoId" TEXT,
    "reference" TEXT NOT NULL,
    "status" "StorageDeletionStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageDeletionJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StorageDeletionJob_status_createdAt_idx" ON "StorageDeletionJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "StorageDeletionJob_workspaceId_status_idx" ON "StorageDeletionJob"("workspaceId", "status");

-- AddForeignKey
ALTER TABLE "StorageDeletionJob" ADD CONSTRAINT "StorageDeletionJob_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
