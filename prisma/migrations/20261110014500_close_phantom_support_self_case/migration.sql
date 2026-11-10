-- PhotoView ingested its own support-watchdog acknowledgement before the
-- support-mailbox self-sender guard was deployed. Preserve the audit trail,
-- but make the one known phantom case and its unsent artifacts terminal.
UPDATE "SupportEmailOutbox"
SET
  "status" = 'SUPPRESSED',
  "providerStatus" = 'SUPPRESSED',
  "lastError" = 'Suppressed support-self response for phantom case cmw9w34gc000g08jppcy5z4me.',
  "processingStartedAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "reportId" = 'cmw9w34gc000g08jppcy5z4me'
  AND "status" IN ('PENDING', 'RETRY', 'PROCESSING', 'FAILED');

UPDATE "SupportAlertDelivery" AS delivery
SET
  "status" = 'SUPPRESSED',
  "providerStatus" = 'SUPPRESSED',
  "lastError" = 'Suppressed alert delivery for phantom support-self case cmw9w34gc000g08jppcy5z4me.',
  "processingStartedAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
FROM "SupportAlert" AS alert
WHERE
  delivery."alertId" = alert."id"
  AND alert."reportId" = 'cmw9w34gc000g08jppcy5z4me'
  AND delivery."status" IN ('PENDING', 'RETRY', 'PROCESSING', 'FAILED');

UPDATE "SupportAlert"
SET
  "status" = 'SUPPRESSED',
  "completedAt" = COALESCE("completedAt", CURRENT_TIMESTAMP),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "reportId" = 'cmw9w34gc000g08jppcy5z4me'
  AND "status" = 'PENDING';

UPDATE "SubscriberFeedbackReport"
SET
  "status" = 'CLOSED',
  "lifecycleState" = 'RESOLVED',
  "resolutionNote" = 'Closed as a phantom case created when PhotoView ingested its own support-watchdog acknowledgement. The support-mailbox self-sender guard is deployed; no subscriber response is required.',
  "resolvedAt" = COALESCE("resolvedAt", CURRENT_TIMESTAMP),
  "escalatedAt" = NULL,
  "escalationReason" = NULL,
  "leaseId" = NULL,
  "leaseExpiresAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "id" = 'cmw9w34gc000g08jppcy5z4me'
  AND "lifecycleState" <> 'RESOLVED';

-- Resolve the watchdog fingerprints only when no real case still satisfies
-- the same predicates. The next worker cycle will independently re-open either
-- event if a separate case becomes overdue.
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
