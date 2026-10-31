# PhotoView Support Engine

PhotoView support is centralized on `support@photoview.io`. The engine ingests both the in-product feedback form and every message in the support Gmail inbox, whether the message is read or unread.

## Case lifecycle

1. Intake is persisted with a unique intake key before any notification is attempted.
2. Attachments, the inbound message, the subscriber acknowledgement, and the owner alert are recorded in the same database transaction.
3. Acknowledgements and verified answers are delivered through the authenticated support Gmail connection.
4. Bugs enter the repair workflow. They are not marked fixed until the repair is verified and the subscriber response has passed delivery verification.
5. Feature requests remain in product review and are never implemented automatically.
6. Ambiguous or sensitive requests are escalated without guessing or promising an outcome.

Worker claims use expiring leases. Failed work retries with bounded backoff, and an expired lease is recoverable by another worker. Intake and delivery keys make every operation safe to retry.

## Subscriber responses

The system may answer automatically only when a current PhotoView help recipe is an exact, high-confidence match. Account access, ownership, billing, payments, refunds, cancellations, deletion, security, privacy, and domain-ownership questions always require review.

Gmail does not provide a positive recipient-delivery receipt. The engine therefore verifies that Gmail accepted the message into Sent, watches the support inbox for delivery-status notifications for 30 minutes, and marks delivery verified only if no bounce is detected during that window. A later bounce reopens and escalates the case.

## Owner alerts

Every actionable case creates two independent alert deliveries:

- Email to `support@photoview.io` through the authenticated Gmail connection.
- SMS through Twilio.

Each channel has its own status, retries, provider identifier, and terminal failure state. Success on one channel never suppresses the other.

Required production configuration:

- Existing support Gmail OAuth connection for `support@photoview.io`.
- `SUPPORT_OWNER_SMS_TO`.
- Twilio credentials plus either `TWILIO_SUPPORT_MESSAGING_SERVICE_SID` or `TWILIO_SUPPORT_ALERT_FROM`.
- `SUPPORT_WATCHDOG_SECRET` (or the existing email cron secret) for authenticated internal watchdog calls.

## Monitoring

Vercel runs `/api/support/watchdog` every five minutes. The independent GitHub Actions watchdog runs at offset intervals and authenticates with GitHub OIDC. Both perform mailbox ingestion, case processing, response delivery, owner-alert delivery, and health checks.

`/api/support/health` exposes aggregate health only. It never returns subscriber names, email addresses, message bodies, attachment details, or provider credentials.

The watchdog raises durable operational events for stale workers, overdue cases, expired leases, responses awaiting verification, failed owner-alert channels, and long-running escalations. Recovered incidents are resolved automatically.

## Deployment checklist

1. Apply the Prisma migration.
2. Configure the production SMS and watchdog variables.
3. Confirm the support Gmail OAuth connection is healthy.
4. Deploy the application and the external watchdog workflow.
5. Submit one test question and one test bug.
6. Verify the case, acknowledgement, email alert, SMS alert, response delivery state, and public aggregate health endpoint.
