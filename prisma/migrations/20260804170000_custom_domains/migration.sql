-- Store one self-service custom website domain per subscriber workspace.
ALTER TABLE "Workspace"
ADD COLUMN "customDomain" TEXT,
ADD COLUMN "customDomainVerifiedAt" TIMESTAMP(3),
ADD COLUMN "customDomainLastCheckedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Workspace_customDomain_key" ON "Workspace"("customDomain");
