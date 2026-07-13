import { NextResponse } from "next/server"
import { checkSubscriberUsageThresholds } from "@/lib/usage-alerts"
import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET ?? process.env.USAGE_ALERT_SECRET
  if (!secret) return false

  return request.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await checkSubscriberUsageThresholds()
    await resolveOperationalEventByFingerprint("cron:usage-thresholds")
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    await recordOperationalEvent({
      category: "SYSTEM",
      fingerprint: "cron:usage-thresholds",
      message: error instanceof Error ? error.message : "Usage threshold check failed",
      severity: "CRITICAL",
      source: "/api/usage/check-thresholds",
    })
    return NextResponse.json({ error: "Usage threshold check failed", ok: false }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
