ALTER TABLE "Workspace"
ADD COLUMN "accessDisabledAt" TIMESTAMP(3),
ADD COLUMN "deletionScheduledAt" TIMESTAMP(3),
ADD COLUMN "deletionReason" TEXT;

CREATE INDEX "Workspace_deletionScheduledAt_idx" ON "Workspace"("deletionScheduledAt");
