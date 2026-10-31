import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
}

test("support intake persists cases, attachments, acknowledgments, and dual owner alerts atomically", () => {
  const source = read("src/lib/support-engine.ts")
  const schema = read("prisma/schema.prisma")
  assert.match(source, /prisma\.\$transaction/)
  assert.match(source, /supportCaseAttachment\.createMany/)
  assert.match(source, /supportEmailOutbox\.create/)
  assert.match(source, /supportAlert\.create/)
  assert.match(source, /channel: "EMAIL"/)
  assert.match(source, /channel: "SMS"/)
  assert.match(schema, /intakeKey\s+String\?\s+@unique/)
  assert.match(schema, /model SupportCaseAttachment/)
  assert.match(schema, /model SupportAlertDelivery/)
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

test("bug completion waits for verified response delivery", () => {
  const completion = read("src/app/api/feedback/repair-complete/route.ts")
  const outbox = read("src/lib/support-email-outbox.ts")
  const workflow = read("src/lib/feedback-workflow.ts")
  const repairRunner = read(".github/workflows/autonomous-bug-repair.yml")
  assert.match(workflow, /lifecycleState: "REPAIR_VERIFIED"/)
  assert.match(workflow, /report\.leaseId !== leaseId/)
  assert.match(completion, /leaseId: z\.string\(\)\.uuid\(\)\.optional\(\)/)
  assert.match(repairRunner, /needs\.claim\.outputs\.lease_id/)
  assert.match(outbox, /verifySupportGmailSentMessage/)
  assert.match(outbox, /status: "DELIVERED"/)
  assert.match(outbox, /lifecycleState: \["ANSWERED", "FIXED"\]\.includes/)
  assert.doesNotMatch(outbox, /status: candidate\.targetReportStatus/)
})

test("mailbox ingestion captures unread or read inbox messages and preserves replies", () => {
  const gmail = read("src/lib/support-gmail.ts")
  const engine = read("src/lib/support-engine.ts")
  const outbox = read("src/lib/support-email-outbox.ts")
  assert.match(gmail, /in:inbox after:/)
  assert.doesNotMatch(gmail, /is:unread/)
  assert.match(gmail, /nextPageToken/)
  assert.match(gmail, /messages\.length < limit/)
  assert.match(gmail, /threadId: input\.threadId/)
  assert.match(engine, /gmail:\$\{message\.messageId\}/)
  assert.match(engine, /gmailRfcMessageId: message\.rfcMessageId/)
  assert.match(engine, /appendMailboxReply/)
  assert.match(engine, /providerMessageId/)
  assert.match(outbox, /inReplyTo: replyContext\?\.rfcMessageId/)
  assert.match(outbox, /threadId: candidate\.gmailThreadId/)
})

test("watchdogs are internal and independently scheduled with privacy-safe health", () => {
  const watchdog = read("src/lib/support-watchdog.ts")
  const route = read("src/app/api/support/health/route.ts")
  const workflow = read(".github/workflows/support-engine-watchdog.yml")
  const vercel = read("vercel.json")
  assert.match(watchdog, /support:worker-stale/)
  assert.match(watchdog, /support:responses-overdue/)
  assert.match(watchdog, /support:alerts-failed/)
  assert.match(route, /health\.ok \? 200 : 503/)
  assert.match(workflow, /audience=photoview-support-watchdog/)
  assert.match(workflow, /api\/support\/health/)
  assert.match(vercel, /\/api\/support\/watchdog/)
  assert.doesNotMatch(route, /reporterEmail|message|workspaceId/)
})
