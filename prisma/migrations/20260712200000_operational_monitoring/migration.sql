CREATE TABLE "OperationalEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "firstOccurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOccurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAlertedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "OperationalEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalEvent_fingerprint_key" ON "OperationalEvent"("fingerprint");
CREATE INDEX "OperationalEvent_status_severity_lastOccurredAt_idx" ON "OperationalEvent"("status", "severity", "lastOccurredAt");
CREATE INDEX "OperationalEvent_category_lastOccurredAt_idx" ON "OperationalEvent"("category", "lastOccurredAt");
CREATE INDEX "OperationalEvent_workspaceId_lastOccurredAt_idx" ON "OperationalEvent"("workspaceId", "lastOccurredAt");

ALTER TABLE "OperationalEvent"
ADD CONSTRAINT "OperationalEvent_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
