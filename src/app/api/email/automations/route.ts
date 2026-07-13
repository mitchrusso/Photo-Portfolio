import { NextResponse } from "next/server"
import { runEmailAutomations } from "@/lib/email-automations"
import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET ?? process.env.EMAIL_AUTOMATION_SECRET
  if (!secret) return false

  return request.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await runEmailAutomations()
    await resolveOperationalEventByFingerprint("cron:email-automations")
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    await recordOperationalEvent({
      category: "EMAIL",
      fingerprint: "cron:email-automations",
      message: error instanceof Error ? error.message : "Email automation job failed",
      severity: "CRITICAL",
      source: "/api/email/automations",
    })
    return NextResponse.json({ error: "Email automation failed", ok: false }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
