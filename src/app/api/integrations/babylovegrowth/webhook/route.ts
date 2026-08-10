import { NextResponse } from "next/server"

import { hasAuthorizedBearerSecret } from "@/lib/bearer-auth"
import { storeBabyLoveGrowthArticle } from "@/lib/babylovegrowth-sync"

const MAX_WEBHOOK_BYTES = 2 * 1024 * 1024

export async function POST(request: Request) {
  const webhookSecret = process.env.BABYLOVEGROWTH_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[babylovegrowth-webhook] BABYLOVEGROWTH_WEBHOOK_SECRET is not configured.")
    return NextResponse.json({ error: "Webhook delivery is not configured." }, { status: 503 })
  }
  if (!hasAuthorizedBearerSecret(request, [webhookSecret])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() || ""
  if (!contentType.startsWith("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json." }, { status: 415 })
  }

  const contentLength = Number(request.headers.get("content-length"))
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 })
  }

  const payload = await request.text()
  if (Buffer.byteLength(payload, "utf8") > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 })
  }

  try {
    const result = await storeBabyLoveGrowthArticle(JSON.parse(payload) as unknown)
    return NextResponse.json({ action: result.action, received: true })
  } catch (error) {
    if (error instanceof SyntaxError || (error && typeof error === "object" && "issues" in error)) {
      return NextResponse.json({ error: "Webhook payload is invalid." }, { status: 400 })
    }
    console.error("[babylovegrowth-webhook] Article synchronization failed.", error)
    return NextResponse.json({ error: "Article synchronization failed." }, { status: 500 })
  }
}
