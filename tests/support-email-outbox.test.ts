import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
}

test("support replies use a durable authenticated outbox", () => {
  const worker = read("src/lib/support-email-outbox.ts")
  const route = read("src/app/api/email/support-outbox/route.ts")
  const config = read("vercel.json")
  const script = read("scripts/queue-support-email.ts")
  const webhook = read("src/lib/resend-delivery-webhook.ts")

  assert.match(worker, /deliveryKey/)
  assert.match(worker, /sendTransactionalEmail/)
  assert.match(worker, /idempotencyKey: candidate\.deliveryKey/)
  assert.match(worker, /MAX_DELIVERY_ATTEMPTS = 8/)
  assert.match(worker, /status: "SENT"/)
  assert.match(worker, /targetReportStatus/)
  assert.match(worker, /recordOperationalEvent/)
  assert.match(route, /hasAuthorizedBearerSecret/)
  assert.match(config, /\/api\/email\/support-outbox/)
  assert.match(config, /\*\/5 \* \* \* \*/)
  assert.match(script, /body-base64/)
  assert.match(script, /subject-base64/)
  assert.match(webhook, /status: "DELIVERED"/)
  assert.match(webhook, /failedSupportMessages/)
})
