-- If Peter's first recovery attempt bounced during the deployment window,
-- queue the same answer once through the now-live plain-text recovery path.
INSERT INTO "SupportEmailOutbox" (
  "id",
  "deliveryKey",
  "brandKey",
  "gmailThreadId",
  "inReplyTo",
  "reportId",
  "source",
  "toEmail",
  "recipientName",
  "subject",
  "body",
  "targetReportStatus",
  "resolutionNote",
  "status",
  "attemptCount",
  "nextAttemptAt",
  "createdAt",
  "updatedAt"
)
SELECT
  'support_recovery_peter_webinar_plain_20261106',
  LEFT("deliveryKey" || ':plain-text-recovery', 240),
  "brandKey",
  "gmailThreadId",
  "inReplyTo",
  "reportId",
  'support_delivery_recovery_plain_text',
  "toEmail",
  "recipientName",
  "subject",
  "body",
  "targetReportStatus",
  "resolutionNote",
  'PENDING',
  0,
  NOW(),
  NOW(),
  NOW()
FROM "SupportEmailOutbox" AS recovery
WHERE recovery."deliveryKey" = 'support-recovery:cmw0ph4ip000108l5nmznd00q:webinar-recording-v2'
  AND (
    recovery."status" = 'FAILED'
    OR recovery."providerStatus" = 'BOUNCED'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "SupportEmailOutbox"
    WHERE "deliveryKey" = LEFT(recovery."deliveryKey" || ':plain-text-recovery', 240)
  );
