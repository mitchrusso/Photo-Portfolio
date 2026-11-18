import { NextResponse } from "next/server"

import { hasAuthorizedBearerSecret } from "@/lib/bearer-auth"
import { dispatchExternalSupportWatchdog } from "@/lib/support-external-watchdog"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (!hasAuthorizedBearerSecret(request, [process.env.CRON_SECRET, process.env.EMAIL_AUTOMATION_SECRET])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const state = await dispatchExternalSupportWatchdog()
  return NextResponse.json({ ok: state === "dispatched", state }, { status: state === "dispatched" ? 200 : 503 })
}

export const POST = GET
