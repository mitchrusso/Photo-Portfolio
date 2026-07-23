import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedCrmSession, hasSameOrigin } from "@/lib/partnership-crm/access"
import { syncAllConnectedCrmMailboxes, syncCrmGmail } from "@/lib/partnership-crm/gmail-sync"
import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"

export const maxDuration = 300

export async function POST(request: NextRequest) {
  const session = await getAuthorizedCrmSession()
  if (!session || !hasSameOrigin(request)) return NextResponse.json({ error: "Administrator access and current verification are required." }, { status: 403 })
  const body = await request.json().catch(() => ({})) as { full?: boolean }
  try {
    const summary = await syncCrmGmail(session.user.id, { full: Boolean(body.full) })
    await resolveOperationalEventByFingerprint("cron:crm-gmail-sync")
    return NextResponse.json({ ok: true, summary })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gmail synchronization failed." }, { status: 502 })
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const results = await syncAllConnectedCrmMailboxes()
    await resolveOperationalEventByFingerprint("cron:crm-gmail-sync")
    return NextResponse.json({ ok: true, results })
  } catch (error) {
    await recordOperationalEvent({ category: "SYSTEM", fingerprint: "cron:crm-gmail-sync", message: error instanceof Error ? error.message : "CRM Gmail synchronization failed.", severity: "CRITICAL", source: "/api/admin/crm/gmail/sync" })
    return NextResponse.json({ error: "CRM Gmail synchronization failed.", ok: false }, { status: 500 })
  }
}
