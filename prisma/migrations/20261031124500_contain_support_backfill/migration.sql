-- The first durable-support rollout scanned historical support inbox mail and
-- queued duplicate acknowledgments before the mailbox cursor existed. Preserve
-- the audit records, but make the incident rows terminal so they cannot send.
UPDATE "SupportEmailOutbox"
SET
  "status" = 'SUPPRESSED',
  "providerStatus" = 'SUPPRESSED',
  "lastError" = 'Suppressed historical mailbox backfill response during the 2026-10-31 support-engine rollout to prevent duplicate customer mail.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "createdAt" >= TIMESTAMP '2026-10-31 16:35:00'
  AND "source" IN ('support_case_acknowledgment', 'support_verified_answer')
  AND "status" IN ('PENDING', 'RETRY', 'PROCESSING', 'FAILED');

UPDATE "SupportAlertDelivery" AS delivery
SET
  "status" = 'SUPPRESSED',
  "providerStatus" = 'SUPPRESSED',
  "lastError" = 'Suppressed historical mailbox backfill alert during the 2026-10-31 support-engine rollout.',
  "updatedAt" = CURRENT_TIMESTAMP
FROM "SupportAlert" AS alert
WHERE
  delivery."alertId" = alert."id"
  AND alert."createdAt" >= TIMESTAMP '2026-10-31 16:35:00'
  AND delivery."status" IN ('PENDING', 'RETRY', 'PROCESSING', 'FAILED');

UPDATE "SupportAlert"
SET
  "status" = 'SUPPRESSED',
  "completedAt" = CURRENT_TIMESTAMP,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "createdAt" >= TIMESTAMP '2026-10-31 16:35:00'
  AND "status" = 'PENDING';

UPDATE "SubscriberFeedbackReport"
SET
  "status" = 'CLOSED',
  "lifecycleState" = 'RESOLVED',
  "resolvedAt" = CURRENT_TIMESTAMP,
  "leaseId" = NULL,
  "leaseExpiresAt" = NULL,
  "escalationReason" = 'Historical mailbox backfill was closed during the 2026-10-31 support-engine rollout to prevent duplicate customer mail.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "createdAt" >= TIMESTAMP '2026-10-31 16:35:00'
  AND "source" = 'GMAIL';

-- Existing in-app cases predate the durable lifecycle column. Initialize them
-- from their already-recorded support status instead of treating every old case
-- as newly queued work.
UPDATE "SubscriberFeedbackReport"
SET
  "lifecycleState" = CASE
    WHEN "status" IN ('FIXED', 'ANSWERED', 'CLOSED') THEN 'RESOLVED'
    WHEN "status" = 'AWAITING_APPROVAL' THEN 'AWAITING_PRODUCT_REVIEW'
    ELSE 'ESCALATED'
  END,
  "resolvedAt" = CASE
    WHEN "status" IN ('FIXED', 'ANSWERED', 'CLOSED') THEN COALESCE("resolvedAt", "fixedAt", "updatedAt")
    ELSE "resolvedAt"
  END,
  "leaseId" = NULL,
  "leaseExpiresAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "source" = 'IN_APP'
  AND "intakeKey" IS NULL;
