-- Repair failures can be superseded by a later verified manual or automated fix.
-- Clear the two stale events whose reports are now fixed/closed; preserve the
-- event rows and occurrence history for auditability.
UPDATE "OperationalEvent"
SET
  "resolvedAt" = NOW(),
  "status" = 'RESOLVED'
WHERE
  "fingerprint" IN (
    'feedback:repair:cmw79vr210000azue0lqczyfb',
    'feedback:repair:cmw86otlq000x07l8suiuokup'
  )
  AND "status" = 'OPEN';
