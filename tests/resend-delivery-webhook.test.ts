import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"
import { Webhook } from "svix"

import {
  parseResendDeliveryEvent,
  RESEND_DELIVERY_EVENT_TYPES,
  resendEventDeliveryStatus,
  verifyResendWebhookPayload,
} from "../src/lib/resend-delivery-policy.ts"

test("Resend delivery events accept only tracked outcomes and discard email content", () => {
  const parsed = parseResendDeliveryEvent({
    created_at: "2026-08-02T17:14:29.917Z",
    data: {
      email_id: "provider-message-id",
      subject: "Private subject",
      to: ["subscriber@example.com"],
    },
    type: "email.delivered",
  })

  assert.equal(parsed.success, true)
  if (!parsed.success) return
  assert.deepEqual(parsed.data, {
    created_at: "2026-08-02T17:14:29.917Z",
    data: { email_id: "provider-message-id" },
    type: "email.delivered",
  })
  assert.equal(parseResendDeliveryEvent({
    created_at: "2026-08-02T17:14:29.917Z",
    data: { email_id: "provider-message-id" },
    type: "email.clicked",
  }).success, false)
})

test("Resend delivery outcomes map to stable status labels", () => {
  assert.deepEqual(RESEND_DELIVERY_EVENT_TYPES, [
    "email.bounced",
    "email.complained",
    "email.delivered",
    "email.delivery_delayed",
    "email.failed",
    "email.suppressed",
  ])
  assert.equal(resendEventDeliveryStatus("email.delivered"), "DELIVERED")
  assert.equal(resendEventDeliveryStatus("email.delivery_delayed"), "DELIVERY_DELAYED")
  assert.equal(resendEventDeliveryStatus("email.complained"), "COMPLAINED")
})

test("Resend webhook verification accepts authentic raw payloads and rejects tampering", () => {
  const secret = `whsec_${Buffer.from("photoview-webhook-test-secret").toString("base64")}`
  const webhook = new Webhook(secret)
  const webhookId = "msg_webhook_test"
  const timestamp = new Date()
  const payload = JSON.stringify({
    created_at: timestamp.toISOString(),
    data: { email_id: "provider-message-id" },
    type: "email.delivered",
  })
  const signature = webhook.sign(webhookId, timestamp, payload)
  const headersTimestamp = String(Math.floor(timestamp.getTime() / 1_000))

  assert.deepEqual(verifyResendWebhookPayload({
    id: webhookId,
    payload,
    secret,
    signature,
    timestamp: headersTimestamp,
  }), JSON.parse(payload))
  assert.throws(() => verifyResendWebhookPayload({
    id: webhookId,
    payload: `${payload} `,
    secret,
    signature,
    timestamp: headersTimestamp,
  }))
})

test("Resend webhook ingestion verifies the raw signed payload and is idempotent", () => {
  const routeSource = readFileSync(
    join(process.cwd(), "src/app/api/email/resend-webhook/route.ts"),
    "utf8",
  )
  const deliverySource = readFileSync(
    join(process.cwd(), "src/lib/resend-delivery-webhook.ts"),
    "utf8",
  )

  assert.match(routeSource, /const payload = await request\.text\(\)/)
  assert.doesNotMatch(routeSource, /request\.json\(\)/)
  assert.match(routeSource, /request\.headers\.get\("svix-id"\)/)
  assert.match(routeSource, /request\.headers\.get\("svix-timestamp"\)/)
  assert.match(routeSource, /request\.headers\.get\("svix-signature"\)/)
  assert.match(routeSource, /verifyResendWebhookPayload\(\{/)
  assert.match(deliverySource, /createMany\(\{/)
  assert.match(deliverySource, /skipDuplicates: true/)
  assert.match(deliverySource, /deliveryUpdatedAt: \{ lte: eventCreatedAt \}/)
})
