-- Portfolio AI failures return a successful rule-based response. An older
-- warning remained open even after the request recovered, which caused the
-- daily operations report to stay DEGRADED indefinitely.
UPDATE "OperationalEvent"
SET
  "status" = 'RESOLVED',
  "resolvedAt" = CURRENT_TIMESTAMP
WHERE
  "fingerprint" = 'ai:portfolio-assistant'
  AND "status" = 'OPEN';
