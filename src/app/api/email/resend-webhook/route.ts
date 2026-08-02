import { NextResponse } from "next/server"

import {
  recordResendDeliveryEvent,
} from "@/lib/resend-delivery-webhook"
import {
  parseResendDeliveryEvent,
  verifyResendWebhookPayload,
} from "@/lib/resend-delivery-policy"

const MAX_WEBHOOK_BYTES = 256 * 1024

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[resend-webhook] RESEND_WEBHOOK_SECRET is not configured.")
    return NextResponse.json({ error: "Webhook delivery is not configured." }, { status: 503 })
  }

  const contentLength = Number(request.headers.get("content-length"))
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 })
  }

  const webhookId = request.headers.get("svix-id")
  const webhookTimestamp = request.headers.get("svix-timestamp")
  const webhookSignature = request.headers.get("svix-signature")
  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return NextResponse.json({ error: "Webhook signature headers are required." }, { status: 400 })
  }

  const payload = await request.text()
  if (Buffer.byteLength(payload, "utf8") > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 })
  }

  let verifiedPayload: unknown
  try {
    verifiedPayload = verifyResendWebhookPayload({
      id: webhookId,
      payload,
      secret: webhookSecret,
      signature: webhookSignature,
      timestamp: webhookTimestamp,
    })
  } catch {
    return NextResponse.json({ error: "Webhook signature is invalid." }, { status: 400 })
  }

  const parsed = parseResendDeliveryEvent(verifiedPayload)
  if (!parsed.success) {
    return NextResponse.json({ ignored: true }, { status: 200 })
  }

  const result = await recordResendDeliveryEvent({
    event: parsed.data,
    webhookId: webhookId.slice(0, 240),
  })

  return NextResponse.json({
    duplicate: result.duplicate,
    matched: result.matchedAttempts,
    received: true,
  })
}
