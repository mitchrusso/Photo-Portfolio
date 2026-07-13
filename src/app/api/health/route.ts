import { NextResponse } from "next/server"

import { getPrismaClient } from "@/lib/db"
import { assertPhotoStorageConfigured } from "@/lib/photo-storage"
import { getStripeConfigSummary } from "@/lib/stripe-config"

export const dynamic = "force-dynamic"

export async function GET() {
  let database = true
  let storage = true

  try {
    await getPrismaClient().$queryRaw`SELECT 1`
  } catch {
    database = false
  }

  try {
    assertPhotoStorageConfigured()
  } catch {
    storage = false
  }

  const stripe = getStripeConfigSummary()
  const billing = stripe.isLiveReady || stripe.isTestReady
  const ok = database && storage && billing

  return NextResponse.json(
    {
      checkedAt: new Date().toISOString(),
      status: ok ? "ok" : "degraded",
    },
    {
      headers: { "Cache-Control": "no-store" },
      status: ok ? 200 : 503,
    },
  )
}
