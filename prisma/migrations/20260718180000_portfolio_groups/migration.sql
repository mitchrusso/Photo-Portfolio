CREATE TABLE "PortfolioGroup" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PortfolioGroup_workspaceId_name_key" ON "PortfolioGroup"("workspaceId", "name");
CREATE INDEX "PortfolioGroup_workspaceId_position_idx" ON "PortfolioGroup"("workspaceId", "position");

ALTER TABLE "PortfolioGroup"
ADD CONSTRAINT "PortfolioGroup_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
