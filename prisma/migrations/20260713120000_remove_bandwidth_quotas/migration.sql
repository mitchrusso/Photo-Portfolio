-- Cloudflare R2 does not charge egress, so PhotoViewPro plans no longer meter
-- delivery bandwidth or persist per-plan file-size allowances.
ALTER TABLE "Plan"
  DROP COLUMN "bandwidthLimitBytes",
  DROP COLUMN "maxUploadBytes";

ALTER TABLE "Subscription"
  DROP COLUMN "bandwidthAlertLevel",
  DROP COLUMN "bandwidthLimitBytes",
  DROP COLUMN "bandwidthPeriodEndsAt",
  DROP COLUMN "bandwidthPeriodStartedAt",
  DROP COLUMN "bandwidthUsedBytes",
  DROP COLUMN "bandwidthWarningSentAt",
  DROP COLUMN "maxUploadBytes";
