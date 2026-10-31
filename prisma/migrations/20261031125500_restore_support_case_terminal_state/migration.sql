-- The first durable mailbox reconciliation processed historical replies and
-- acknowledgments. A positive closing reply reopened one completed case, and
-- an older RECEIVED acknowledgment regressed another case that had since been
-- fully resolved. Restore the verified terminal states without deleting audit
-- records or changing any subscriber-facing delivery.
UPDATE "SubscriberFeedbackReport"
SET
  "status" = 'ANSWERED',
  "lifecycleState" = 'RESOLVED',
  "resolvedAt" = COALESCE("resolvedAt", "deliveredAt", CURRENT_TIMESTAMP),
  "escalatedAt" = NULL,
  "escalationReason" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "id" = 'cmvrf6hwo000008ley75t7hfo'
  AND EXISTS (
    SELECT 1
    FROM "SupportEmailOutbox"
    WHERE
      "deliveryKey" = 'feedback-report:cmvrf6hwo000008ley75t7hfo:studio-split-hero-controls-v1'
      AND "status" = 'DELIVERED'
  );

UPDATE "SubscriberFeedbackReport"
SET
  "status" = 'ANSWERED',
  "lifecycleState" = 'RESOLVED',
  "resolutionNote" = 'Verified the subscriber paid the legacy $29.99 annual Growth price. Corrected the account from Starter to Growth with 20 GB, updated billing sync to recognize the legacy price automatically, and confirmed no additional charge was made.',
  "resolvedAt" = COALESCE("resolvedAt", CURRENT_TIMESTAMP),
  "escalatedAt" = NULL,
  "escalationReason" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "id" = 'cmvvfalfg000108jonxkn5oti'
  AND EXISTS (
    SELECT 1
    FROM "SupportEmailOutbox"
    WHERE
      "source" = 'subscription_reconciliation'
      AND "subject" = 'Your PhotoView Growth plan is corrected'
      AND "status" = 'DELIVERED'
  );
