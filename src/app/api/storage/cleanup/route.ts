import { NextResponse } from "next/server"

import { processStorageDeletionJobs } from "@/lib/storage-deletion"
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
    const result = await processStorageDeletionJobs({ limit: 100 })
    await resolveOperationalEventByFingerprint("cron:storage-cleanup")
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    await recordOperationalEvent({
      category: "STORAGE",
      fingerprint: "cron:storage-cleanup",
      message: error instanceof Error ? error.message : "Storage cleanup job failed",
      severity: "CRITICAL",
      source: "/api/storage/cleanup",
    })
    return NextResponse.json({ error: "Storage cleanup failed", ok: false }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
