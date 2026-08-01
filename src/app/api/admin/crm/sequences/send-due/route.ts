import { NextResponse } from "next/server"
import { hasAuthorizedBearerSecret } from "@/lib/bearer-auth"
import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"
import { runCrmSequenceDelivery } from "@/lib/partnership-crm/sequence-delivery"

export async function GET(request: Request) {
  if (!hasAuthorizedBearerSecret(request, [process.env.CRON_SECRET])) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const result = await runCrmSequenceDelivery()
    await resolveOperationalEventByFingerprint("cron:crm-email-sequences")
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    await recordOperationalEvent({ category: "SYSTEM", fingerprint: "cron:crm-email-sequences", message: error instanceof Error ? error.message : "CRM sequence delivery failed.", severity: "CRITICAL", source: "/api/admin/crm/sequences/send-due" })
    return NextResponse.json({ error: "CRM sequence delivery failed", ok: false }, { status: 500 })
  }
}

export async function POST(request: Request) { return GET(request) }
