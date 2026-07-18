CREATE TABLE "ImportCredential" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ImportCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ImportCredential_workspaceId_key" ON "ImportCredential"("workspaceId");
CREATE UNIQUE INDEX "ImportCredential_tokenHash_key" ON "ImportCredential"("tokenHash");
CREATE INDEX "ImportCredential_expiresAt_idx" ON "ImportCredential"("expiresAt");

ALTER TABLE "ImportCredential"
  ADD CONSTRAINT "ImportCredential_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
