import { NextResponse } from "next/server"

import { hasAuthorizedBearerSecret } from "@/lib/bearer-auth"
import { BabyLoveGrowthApiError } from "@/lib/babylovegrowth-api"
import { syncBabyLoveGrowthArticles } from "@/lib/babylovegrowth-sync"
import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"

export const maxDuration = 300

function isAuthorized(request: Request) {
  return hasAuthorizedBearerSecret(request, [process.env.CRON_SECRET])
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await syncBabyLoveGrowthArticles()
    await resolveOperationalEventByFingerprint("cron:babylovegrowth-article-sync")
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    const isProviderThrottle = error instanceof BabyLoveGrowthApiError && error.status === 429
    await recordOperationalEvent({
      category: "SYSTEM",
      fingerprint: "cron:babylovegrowth-article-sync",
      message: error instanceof Error ? error.message : "BabyLoveGrowth article synchronization failed.",
      severity: isProviderThrottle ? "WARNING" : "CRITICAL",
      source: "/api/integrations/babylovegrowth/sync",
    })
    return NextResponse.json(
      { error: "Article synchronization failed.", ok: false },
      { headers: isProviderThrottle ? { "Retry-After": "60" } : undefined, status: isProviderThrottle ? 503 : 500 },
    )
  }
}

export async function POST(request: Request) {
  return GET(request)
}
