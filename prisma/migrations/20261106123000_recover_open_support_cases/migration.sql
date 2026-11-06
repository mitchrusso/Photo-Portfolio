-- Francesco's SmugMug report was not a repairable product defect. PhotoView's
-- administrator OAuth credentials are not configured, the safe workaround was
-- delivered, and the subscriber explicitly acknowledged that answer. Preserve
-- the history while closing the incorrectly escalated repair case.
UPDATE "SubscriberFeedbackReport"
SET
  "type" = 'question',
  "status" = 'ANSWERED',
  "lifecycleState" = 'RESOLVED',
  "escalationReason" = NULL,
  "resolutionNote" = 'Explained that the SmugMug importer is unavailable until PhotoView administrator OAuth credentials are configured. Provided safe download and Photo Upload/Lightroom alternatives; subscriber acknowledged the answer.',
  "resolvedAt" = COALESCE("resolvedAt", NOW()),
  "updatedAt" = NOW()
WHERE "id" = 'cmw3wfpej007507kxp9p689ut'
  AND "lifecycleState" <> 'RESOLVED';

UPDATE "OperationalEvent"
SET
  "status" = 'RESOLVED',
  "resolvedAt" = COALESCE("resolvedAt", NOW()),
  "lastOccurredAt" = NOW()
WHERE "fingerprint" = 'feedback:repair:cmw3wfpej007507kxp9p689ut'
  AND "status" = 'OPEN';

-- Peter's prior branded answer was rejected by the recipient server as likely
-- spam. Queue a concise plain-text recovery message with the requested webinar
-- recording. The normal Gmail worker will send, verify, and resolve the case.
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
  'support_recovery_peter_webinar_20261106',
  'support-recovery:cmw0ph4ip000108l5nmznd00q:webinar-recording-v2',
  "brandKey",
  "gmailThreadId",
  (
    SELECT "rfcMessageId"
    FROM "SupportCaseMessage"
    WHERE "reportId" = 'cmw0ph4ip000108l5nmznd00q'
      AND "direction" = 'INBOUND'
    ORDER BY "receivedAt" DESC
    LIMIT 1
  ),
  "id",
  'support_delivery_recovery_plain_text',
  "reporterEmail",
  "reporterName",
  'Re: Help getting started with PhotoView.io',
  E'Hi Peter,\n\nHere is the PhotoView training recording you requested:\n\nhttps://us02web.zoom.us/rec/share/XBOldOWbBDJBFHz12vWEin5Qftr09Nd87xOucw_Ipnm8vy3TIrbdr3jCf1E_--Ue.y7aCIq1XbOlBb1qr\n\nPasscode: R5Lv3^ta\n\nIf you have any questions after watching it, please reply and we will help.\n\nBest,\nPhotoView.io Support',
  'ANSWERED',
  'Sent the requested PhotoView training recording and invited Peter to reply with questions.',
  'PENDING',
  0,
  NOW(),
  NOW(),
  NOW()
FROM "SubscriberFeedbackReport"
WHERE "id" = 'cmw0ph4ip000108l5nmznd00q'
  AND NOT EXISTS (
    SELECT 1
    FROM "SupportEmailOutbox"
    WHERE "deliveryKey" = 'support-recovery:cmw0ph4ip000108l5nmznd00q:webinar-recording-v2'
  );
