-- Outlook-style reaction notifications are machine-generated acknowledgments,
-- not subscriber-authored support requests. Preserve the audit trail while
-- making the one known reaction-only case and its unsent artifacts terminal.
UPDATE "SupportEmailOutbox"
SET
  "status" = 'SUPPRESSED',
  "providerStatus" = 'SUPPRESSED',
  "lastError" = 'Suppressed response for reaction-only email notification cmw79vr210000azue0lqczyfb.',
  "processingStartedAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "reportId" = 'cmw79vr210000azue0lqczyfb'
  AND "status" IN ('PENDING', 'RETRY', 'PROCESSING', 'FAILED');

UPDATE "SupportAlertDelivery" AS delivery
SET
  "status" = 'SUPPRESSED',
  "providerStatus" = 'SUPPRESSED',
  "lastError" = 'Suppressed alert delivery for reaction-only email notification cmw79vr210000azue0lqczyfb.',
  "processingStartedAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
FROM "SupportAlert" AS alert
WHERE
  delivery."alertId" = alert."id"
  AND alert."reportId" = 'cmw79vr210000azue0lqczyfb'
  AND delivery."status" IN ('PENDING', 'RETRY', 'PROCESSING', 'FAILED');

UPDATE "SupportAlert"
SET
  "status" = 'SUPPRESSED',
  "completedAt" = COALESCE("completedAt", CURRENT_TIMESTAMP),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "reportId" = 'cmw79vr210000azue0lqczyfb'
  AND "status" = 'PENDING';

UPDATE "SubscriberFeedbackReport"
SET
  "status" = 'CLOSED',
  "lifecycleState" = 'RESOLVED',
  "resolutionNote" = 'Closed as a phantom case created from a reaction-only email notification. Reaction notifications are now filtered before support intake; no subscriber response is required.',
  "resolvedAt" = COALESCE("resolvedAt", CURRENT_TIMESTAMP),
  "escalatedAt" = NULL,
  "escalationReason" = NULL,
  "leaseId" = NULL,
  "leaseExpiresAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "id" = 'cmw79vr210000azue0lqczyfb'
  AND "lifecycleState" <> 'RESOLVED';

UPDATE "OperationalEvent"
SET
  "status" = 'RESOLVED',
  "resolvedAt" = COALESCE("resolvedAt", CURRENT_TIMESTAMP)
WHERE
  "fingerprint" = 'support:cases-overdue'
  AND "status" = 'OPEN'
  AND NOT EXISTS (
    SELECT 1
    FROM "SubscriberFeedbackReport"
    WHERE
      "createdAt" <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
      AND "lifecycleState" IN ('QUEUED', 'RETRYING')
  );

UPDATE "OperationalEvent"
SET
  "status" = 'RESOLVED',
  "resolvedAt" = COALESCE("resolvedAt", CURRENT_TIMESTAMP)
WHERE
  "fingerprint" = 'support:escalations-open'
  AND "status" = 'OPEN'
  AND NOT EXISTS (
    SELECT 1
    FROM "SubscriberFeedbackReport"
    WHERE
      "escalatedAt" <= CURRENT_TIMESTAMP - INTERVAL '1 hour'
      AND "lifecycleState" = 'ESCALATED'
      AND "resolvedAt" IS NULL
  );
