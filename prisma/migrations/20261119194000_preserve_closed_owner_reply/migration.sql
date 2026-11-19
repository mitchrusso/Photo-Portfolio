-- A human owner may intentionally reply from the support mailbox to a thread
-- that was already classified and closed. Preserve the delivery audit without
-- reopening the closed report's lifecycle.
UPDATE "SubscriberFeedbackReport"
SET
  "lifecycleState" = 'RESOLVED',
  "resolvedAt" = COALESCE("resolvedAt", "deliveredAt", "responseAcceptedAt", "updatedAt", NOW()),
  "updatedAt" = NOW()
WHERE "status" = 'CLOSED'
  AND "lifecycleState" = 'RESPONSE_QUEUED';
