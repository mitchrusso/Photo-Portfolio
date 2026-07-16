-- Keep the public website address separate from the permanent workspace slug.
ALTER TABLE "Workspace" ADD COLUMN "websiteSubdomain" TEXT;

CREATE UNIQUE INDEX "Workspace_websiteSubdomain_key" ON "Workspace"("websiteSubdomain");
