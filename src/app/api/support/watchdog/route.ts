import { NextResponse } from "next/server"

import { hasAuthorizedBearerSecret } from "@/lib/bearer-auth"
import { getPrismaClient } from "@/lib/db"
import { authorizeGitHubSupportWatchdogOidc } from "@/lib/github-actions-oidc"
import { EXTERNAL_WORKER_NAME, runSupportEngineCycle } from "@/lib/support-watchdog"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const internal = hasAuthorizedBearerSecret(request, [process.env.CRON_SECRET, process.env.EMAIL_AUTOMATION_SECRET])
  const external = internal ? false : await authorizeGitHubSupportWatchdogOidc(request)
  if (!external && !internal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const startedAt = new Date()
  if (external) {
    await getPrismaClient().supportWorkerHeartbeat.upsert({
      create: { name: EXTERNAL_WORKER_NAME, startedAt },
      update: { lastError: null, startedAt },
      where: { name: EXTERNAL_WORKER_NAME },
    })
  }
  try {
    const result = await runSupportEngineCycle()
    if (external) {
      await getPrismaClient().supportWorkerHeartbeat.update({
        data: { completedAt: new Date(), lastError: null },
        where: { name: EXTERNAL_WORKER_NAME },
      })
    }
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    if (external) {
      const message = error instanceof Error ? error.message.slice(0, 500) : "External support watchdog failed."
      await getPrismaClient().supportWorkerHeartbeat.update({
        data: { lastError: message },
        where: { name: EXTERNAL_WORKER_NAME },
      })
    }
    throw error
  }
}

export const GET = POST
