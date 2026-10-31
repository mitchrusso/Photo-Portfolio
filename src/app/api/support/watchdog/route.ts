import { NextResponse } from "next/server"

import { authorizeSupportWatchdogRequest } from "@/lib/github-actions-oidc"
import { runSupportEngineCycle } from "@/lib/support-watchdog"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  if (!(await authorizeSupportWatchdogRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const result = await runSupportEngineCycle()
  return NextResponse.json({ ok: true, result })
}

export const GET = POST
