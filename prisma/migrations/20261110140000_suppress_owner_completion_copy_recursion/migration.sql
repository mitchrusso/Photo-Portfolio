-- An automated support-resolution owner copy was briefly visible to the
-- owner-reply scanner before the completion-copy guard was deployed. Preserve
-- its audit record, but make the exact unsent subscriber artifact terminal.
UPDATE "SupportEmailOutbox"
SET
  "status" = 'SUPERSEDED',
  "lastError" = 'Suppressed exact internal owner-copy self-ingestion artifact before delivery; no subscriber email sent.',
  "processingStartedAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "id" = 'cmwar5yf0000308l5kv3526cv'
  AND "status" IN ('PENDING', 'RETRY', 'PROCESSING', 'FAILED');

INSERT INTO "SupportMailboxReceipt" ("messageId", "disposition", "receivedAt", "createdAt")
VALUES (
  '1a1c5bdf17f86961',
  'IGNORED_OWNER_COMPLETION_COPY',
  TIMESTAMP '2026-11-10 13:55:22',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("messageId") DO NOTHING;
