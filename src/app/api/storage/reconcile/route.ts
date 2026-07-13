import { NextResponse } from "next/server"

import { reconcileStorageTotals } from "@/lib/storage-reconciliation"
import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await reconcileStorageTotals()
    await resolveOperationalEventByFingerprint("cron:storage-reconciliation")
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    await recordOperationalEvent({
      category: "STORAGE",
      fingerprint: "cron:storage-reconciliation",
      message: error instanceof Error ? error.message : "Storage reconciliation failed",
      severity: "CRITICAL",
      source: "/api/storage/reconcile",
    })
    return NextResponse.json({ error: "Storage reconciliation failed", ok: false }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
