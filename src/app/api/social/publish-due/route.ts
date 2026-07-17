import { NextResponse } from "next/server"
import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"
import { runSocialPublishing } from "@/lib/social-publishing"

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const result = await runSocialPublishing()
    await resolveOperationalEventByFingerprint("cron:social-publishing")
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    await recordOperationalEvent({
      category: "SYSTEM",
      fingerprint: "cron:social-publishing",
      message: error instanceof Error ? error.message : "Social publishing job failed.",
      severity: "CRITICAL",
      source: "/api/social/publish-due",
    })
    return NextResponse.json({ error: "Social publishing failed", ok: false }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
