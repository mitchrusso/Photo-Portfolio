import { NextResponse } from "next/server"

import { hasAuthorizedBearerSecret } from "@/lib/bearer-auth"
import { sendDailyOperationsReport } from "@/lib/daily-operations-report"
import {
  recordOperationalEvent,
  resolveOperationalEventByFingerprint,
} from "@/lib/operational-monitoring"

function isAuthorized(request: Request) {
  return hasAuthorizedBearerSecret(request, [process.env.CRON_SECRET])
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await sendDailyOperationsReport()
    await resolveOperationalEventByFingerprint("cron:daily-operations-report")
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    await recordOperationalEvent({
      category: "EMAIL",
      fingerprint: "cron:daily-operations-report",
      message: error instanceof Error ? error.message : "Daily operations report failed",
      severity: "CRITICAL",
      source: "/api/email/daily-operations-report",
    })
    return NextResponse.json({ error: "Daily operations report failed", ok: false }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
