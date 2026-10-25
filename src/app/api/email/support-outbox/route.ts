import { NextResponse } from "next/server"

import { hasAuthorizedBearerSecret } from "@/lib/bearer-auth"
import { deliverSupportEmailOutbox } from "@/lib/support-email-outbox"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (!hasAuthorizedBearerSecret(request, [process.env.CRON_SECRET, process.env.EMAIL_AUTOMATION_SECRET])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const outcomes = await deliverSupportEmailOutbox()
  return NextResponse.json({ ok: true, outcomes })
}

export const POST = GET
