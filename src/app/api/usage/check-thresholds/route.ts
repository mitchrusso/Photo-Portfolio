import { NextResponse } from "next/server"
import { checkSubscriberUsageThresholds } from "@/lib/usage-alerts"

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET ?? process.env.USAGE_ALERT_SECRET
  if (!secret) return false

  return request.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await checkSubscriberUsageThresholds()
  return NextResponse.json({ ok: true, result })
}

export async function POST(request: Request) {
  return GET(request)
}
