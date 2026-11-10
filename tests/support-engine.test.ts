import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import { rankAiHelpRecipes } from "../src/lib/ai-help-recipes.ts"
import { getSupportBrand } from "../src/lib/support-brands.ts"
import { ignoreSupportMailboxMessage } from "../src/lib/support-mail-filter.ts"

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
}

test("support intake persists cases, attachments, acknowledgments, and email owner alerts atomically", () => {
  const source = read("src/lib/support-engine.ts")
  const schema = read("prisma/schema.prisma")
  assert.match(source, /prisma\.\$transaction/)
  assert.match(source, /supportCaseAttachment\.createMany/)
  assert.match(source, /supportEmailOutbox\.create/)
  assert.match(source, /supportAlert\.create/)
  assert.match(source, /channel: "EMAIL"/)
  assert.doesNotMatch(source, /channel: "SMS"/)
  assert.match(schema, /intakeKey\s+String\?\s+@unique/)
  assert.match(schema, /model SupportCaseAttachment/)
  assert.match(schema, /model SupportAlertDelivery/)
})

test("all PhotoView support intake and completion mail routes through the support mailbox", () => {
  const brand = getSupportBrand()
  const alerts = read("src/lib/support-alerts.ts")
  const monitoring = read("src/lib/operational-monitoring.ts")
  const outbox = read("src/lib/support-email-outbox.ts")
  const feedback = read("src/components/feedback/subscriber-feedback.tsx")
  assert.equal(brand.supportEmail, "support@photoview.io")
  assert.equal("ownerCompletionEmail" in brand, false)
  assert.match(alerts, /to: brand\.supportEmail/)
  assert.match(monitoring, /sendSupportGmail/)
  assert.match(monitoring, /to: brand\.supportEmail/)
  assert.doesNotMatch(monitoring, /ADMIN_ALERT_EMAILS|ADMIN_EMAILS|api\.resend\.com\/emails/)
  assert.match(outbox, /toEmail: brand\.supportEmail/)
  assert.match(feedback, /bug report was sent to support@photoview\.io/)
  assert.match(feedback, /feature request was sent to support@photoview\.io/)
  assert.doesNotMatch(`${alerts}\n${outbox}\n${feedback}`, /sent to Mitch|mitch@photoview\.io/)
})

test("support mailbox ignores its own messages that reach the intake fallback", () => {
  const filter = read("src/lib/support-mail-filter.ts")
  assert.match(filter, /selfGeneratedOperationalAlert/)
  assert.match(filter, /support@photoview\.io/)
})

test("support mailbox never treats an automated owner completion copy as a human owner reply", () => {
  const engine = read("src/lib/support-engine.ts")
  assert.match(engine, /source: "support_resolution_owner_copy"/)
  assert.match(engine, /providerStatus: \{ endsWith: `:\$\{candidate\.id\}` \}/)
  assert.match(engine, /IGNORED_OWNER_COMPLETION_COPY/)
})

test("support mailbox ignores reaction-only email notifications", () => {
  assert.equal(ignoreSupportMailboxMessage({
    body: "[like] joe barta-iv.com reacted to your message:\nFrom: PhotoView Support <support@photoview.io>",
    fromEmail: "joe@barta-iv.com",
    subject: "RE: Your PhotoView.io QR code has been fixed",
  }), true)
  assert.equal(ignoreSupportMailboxMessage({
    body: "The QR code is still blank after refreshing.",
    fromEmail: "joe@barta-iv.com",
    subject: "RE: Your PhotoView.io QR code has been fixed",
  }), false)
})

test("the known reaction-only phantom case is closed without deleting its audit trail", () => {
  const migration = read("prisma/migrations/20261110021500_close_reaction_only_support_case/migration.sql")
  assert.match(migration, /cmw79vr210000azue0lqczyfb/)
  assert.match(migration, /reaction-only email notification/)
  assert.match(migration, /"lifecycleState" = 'RESOLVED'/)
  assert.match(migration, /"status" = 'SUPPRESSED'/)
  assert.match(migration, /support:escalations-open/)
  assert.match(migration, /NOT EXISTS/)
  assert.doesNotMatch(migration, /DELETE FROM/)
})

test("the known support-self phantom case is closed without deleting its audit trail", () => {
  const migration = read("prisma/migrations/20261110014500_close_phantom_support_self_case/migration.sql")
  assert.match(migration, /cmw9w34gc000g08jppcy5z4me/)
  assert.match(migration, /"status" = 'CLOSED'/)
  assert.match(migration, /"lifecycleState" = 'RESOLVED'/)
  assert.match(migration, /"status" = 'SUPPRESSED'/)
  assert.match(migration, /"status" IN \('PENDING', 'RETRY', 'PROCESSING', 'FAILED'\)/)
  assert.match(migration, /support:cases-overdue/)
  assert.match(migration, /support:escalations-open/)
  assert.match(migration, /NOT EXISTS/)
  assert.doesNotMatch(migration, /DELETE FROM/)
})

test("duplicate intake and delivery retries are idempotent and leases recover", () => {
  const cases = read("src/lib/support-engine.ts")
  const outbox = read("src/lib/support-email-outbox.ts")
  const alerts = read("src/lib/support-alerts.ts")
  assert.match(cases, /findUnique\(\{ where: \{ intakeKey \} \}\)/)
  assert.match(cases, /leaseExpiresAt: \{ lte: now \}/)
  assert.match(outbox, /deliveryKey/)
  assert.match(outbox, /processingStartedAt: \{ lte: leaseCutoff \}/)
  assert.match(alerts, /@@|updateMany/)
  assert.match(alerts, /candidate\.channel === "EMAIL"/)
  assert.match(alerts, /candidate\.channel === "SMS"/)
  assert.match(alerts, /SUPERADMIN_MFA_PHONE_E164/)
  assert.match(alerts, /TWILIO_API_KEY_SID/)
  assert.match(alerts, /const auth = accountCredential \?\? apiCredential/)
})

test("support SMS pauses duplicate alerts while A2P registration is pending", () => {
  const source = read("src/lib/support-alerts.ts")
  assert.match(source, /errorCode === 30034/)
  assert.match(source, /A2P_PROVIDER_STATUS/)
  assert.match(source, /status: canary \? "RETRY" : "PAUSED"/)
  assert.match(source, /resolveOperationalEventByFingerprint\(A2P_EVENT_FINGERPRINT\)/)
})

test("routine owner alerts suppress SMS while critical watchdogs retain one text channel", () => {
  const engine = read("src/lib/support-engine.ts")
  const alerts = read("src/lib/support-alerts.ts")
  const watchdog = read("src/lib/support-watchdog.ts")
  assert.doesNotMatch(engine, /channel: "SMS"/)
  assert.match(watchdog, /issue\.severity === "CRITICAL"/)
  assert.match(watchdog, /WATCHDOG_CRITICAL/)
  assert.match(alerts, /suppressed_by_owner_policy/)
  assert.match(alerts, /status: "SUPPRESSED"/)
})

test("verified answers are narrow and feature suggestions remain review-gated", () => {
  const source = read("src/lib/support-engine.ts")
  const admin = read("src/app/admin/feedback/page.tsx")
  assert.match(source, /first\.score < 100/)
  assert.match(source, /risky = \/\\b\(account\|billing/)
  assert.match(source, /AWAITING_PRODUCT_REVIEW/)
  assert.match(source, /Suggestions are reviewed before any product change is approved/)
  assert.match(admin, /Only feature requests can be approved/)
})

test("verified follow-up questions can be answered inside an existing support thread", () => {
  const source = read("src/lib/support-engine.ts")
  const [answer] = rankAiHelpRecipes(
    "Is there a maximum number of images per portfolio? Can I keep adding photographs to an existing portfolio?",
  )
  assert.ok(answer)
  assert.equal(answer.recipe.id, "portfolio-growth-limits")
  assert.ok(answer.score >= 100)
  assert.match(answer.recipe.steps.join(" "), /sets no separate image-count limit/)
  assert.match(answer.recipe.steps.join(" "), /Starter 5 GB/)
  assert.match(source, /verifiedSupportAnswer\(message\.body\)/)
  assert.match(source, /support_verified_followup_answer/)
  assert.match(source, /support-followup-answer:\$\{message\.messageId\}/)
  assert.match(source, /targetReportStatus: "ANSWERED"/)
})

test("bug completion waits for verified response delivery", () => {
  const completion = read("src/app/api/feedback/repair-complete/route.ts")
  const outbox = read("src/lib/support-email-outbox.ts")
  const workflow = read("src/lib/feedback-workflow.ts")
  const repairRunner = read(".github/workflows/autonomous-bug-repair.yml")
  assert.match(workflow, /lifecycleState: "REPAIR_VERIFIED"/)
  assert.match(workflow, /report\.leaseId !== leaseId/)
  assert.match(completion, /leaseId: z\.string\(\)\.uuid\(\)\.optional\(\)/)
  assert.match(completion, /z\.enum\(\["failed", "fixed", "retry"\]\)/)
  assert.match(completion, /state: "stale_lease_ignored"/)
  assert.match(completion, /state: "repair_requeued"/)
  assert.match(completion, /status: "PENDING_REPAIR"/)
  assert.match(completion, /dispatchAutomatedBugRepair\(report\)/)
  assert.match(repairRunner, /needs\.claim\.outputs\.lease_id/)
  assert.match(outbox, /verifySupportGmailSentMessage/)
  assert.match(outbox, /status: "DELIVERED"/)
  assert.match(outbox, /targetReportStatus === "FIXED" \? "OWNER_COPY_PENDING"/)
  assert.match(outbox, /targetReportStatus === "ANSWERED" \? "RESOLVED"/)
  assert.doesNotMatch(outbox, /status: candidate\.targetReportStatus/)
  assert.match(workflow, /previousFixedNotice && latestInbound/)
  assert.match(workflow, /feedback-bug-fixed:\$\{report\.id\}:\$\{latestInbound\.providerMessageId\}/)
})

test("mailbox ingestion captures unread or read inbox messages and preserves replies", () => {
  const gmail = read("src/lib/support-gmail.ts")
  const engine = read("src/lib/support-engine.ts")
  const outbox = read("src/lib/support-email-outbox.ts")
  const state = read("src/lib/support-case-state.ts")
  assert.match(gmail, /in:inbox after:/)
  assert.doesNotMatch(gmail, /is:unread/)
  assert.match(gmail, /listSupportOwnerReplyMessageIds/)
  assert.match(gmail, /in:sent after:/)
  assert.match(gmail, /from:\$\{google\.email\} subject:/)
  assert.match(gmail, /nextPageToken/)
  assert.match(gmail, /messages\.length < limit/)
  assert.match(gmail, /threadId: input\.threadId/)
  assert.match(engine, /gmail:\$\{message\.messageId\}/)
  assert.match(engine, /gmailRfcMessageId: message\.rfcMessageId/)
  assert.match(engine, /appendMailboxReply/)
  assert.match(engine, /appendOwnerReply/)
  assert.match(engine, /support_owner_reply/)
  assert.match(engine, /owner-reply:\$\{message\.messageId\}/)
  assert.match(engine, /message\.fromEmail !== getSupportBrand\(\)\.supportEmail/)
  assert.match(engine, /IGNORED_OWNER_ALERT_COPY/)
  assert.match(engine, /SUPPORT_SELF_ROUTING_START/)
  assert.match(engine, /2026-11-09T18:45:00\.000Z/)
  assert.match(state, /status: "PENDING_REPAIR"/)
  assert.match(state, /lifecycleState: "QUEUED"/)
  assert.match(engine, /providerMessageId/)
  assert.match(engine, /recordsClosureWithoutReopening/)
  assert.match(engine, /isBenignClosingReply\(message\.body\)/)
  assert.match(engine, /kind: reopenedBug \? "BUG_REPAIR" : "SUBSCRIBER_REPLY"/)
  assert.match(engine, /a new repair cycle is queued/)
  assert.match(engine, /PLAIN_TEXT_RECOVERY_SOURCE = "support_delivery_recovery_plain_text"/)
  assert.match(engine, /plain-text-recovery/)
  assert.match(engine, /bounced\.source !== PLAIN_TEXT_RECOVERY_SOURCE/)
  assert.match(engine, /where: \{ deliveryKey \}/)
  assert.match(outbox, /inReplyTo: replyContext\?\.rfcMessageId/)
  assert.match(outbox, /report\.gmailThreadId/)
  assert.match(outbox, /supportGmailMessageId\(latestOutgoing\.deliveryKey\)/)
  assert.match(outbox, /threadId: candidate\.gmailThreadId/)
})

test("mailbox ingestion has an explicit rollout boundary and suppresses historical backfill", () => {
  const engine = read("src/lib/support-engine.ts")
  const migration = read("prisma/migrations/20261031124500_contain_support_backfill/migration.sql")
  assert.match(engine, /SUPPORT_MAILBOX_BACKFILL_START/)
  assert.match(engine, /SUPPORT_MAILBOX_BACKFILL_START\?\.trim\(\)/)
  assert.match(engine, /2026-10-31T16:35:32\.000Z/)
  assert.match(migration, /support_case_acknowledgment/)
  assert.match(migration, /support_verified_answer/)
  assert.match(migration, /"status" = 'SUPPRESSED'/)
  assert.match(migration, /"source" = 'GMAIL'/)
  assert.match(migration, /"source" = 'IN_APP'/)
  assert.match(migration, /"status" IN \('FIXED', 'ANSWERED', 'CLOSED'\) THEN 'RESOLVED'/)
})

test("watchdogs are internal and independently scheduled with privacy-safe health", () => {
  const alerts = read("src/lib/support-alerts.ts")
  const watchdog = read("src/lib/support-watchdog.ts")
  const route = read("src/app/api/support/health/route.ts")
  const workflow = read(".github/workflows/support-engine-watchdog.yml")
  const vercel = read("vercel.json")
  assert.match(watchdog, /support:worker-stale/)
  assert.match(watchdog, /support:responses-overdue/)
  assert.match(watchdog, /support:alerts-failed/)
  assert.match(watchdog, /support:repairs-stalled/)
  assert.match(watchdog, /lifecycleState: "REPAIR_IN_PROGRESS"/)
  assert.match(watchdog, /inline-customer-content-v2/)
  assert.match(watchdog, /support_resolution_owner_copy/)
  assert.match(watchdog, /createdAt: \{ gte: SUPPORT_BACKFILL_START/)
  assert.match(route, /health\.ok \? 200 : 503/)
  assert.match(workflow, /audience=photoview-support-watchdog/)
  assert.match(workflow, /api\/support\/health/)
  assert.match(vercel, /\/api\/support\/watchdog/)
  assert.doesNotMatch(route, /reporterEmail|message|workspaceId/)
  assert.match(alerts, /support-watchdog:support:escalations-open/)
  assert.match(alerts, /lifecycleState: "ESCALATED"/)
  assert.match(alerts, /supportOwnerWatchdogMessage/)
})
