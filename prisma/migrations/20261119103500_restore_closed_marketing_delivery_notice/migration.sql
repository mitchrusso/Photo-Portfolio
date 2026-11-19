-- Restore the closed non-support marketing intake after a temporary Gmail
-- delivery notice was incorrectly handled as a terminal subscriber bounce.
UPDATE "SubscriberFeedbackReport"
SET
  "escalationReason" = NULL,
  "lifecycleState" = 'RESOLVED',
  "resolutionNote" = 'Vendor marketing solicitation; ignored as non-support. A temporary delivery notice triggered an unnecessary plain-text recovery before the delivery-notice classifier was corrected.',
  "resolvedAt" = COALESCE("resolvedAt", NOW()),
  "status" = 'CLOSED',
  "updatedAt" = NOW()
WHERE "id" = 'cmwm7831s000008i9mb8dw9tg';

UPDATE "SupportEmailOutbox"
SET
  "resolutionNote" = 'Redundant recovery for a closed non-support marketing intake; retained for delivery audit only.',
  "targetReportStatus" = NULL,
  "updatedAt" = NOW()
WHERE "id" = 'cmwnomofp000d08jv08i8htox';
