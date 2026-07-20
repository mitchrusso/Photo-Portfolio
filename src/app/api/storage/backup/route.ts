import { NextResponse } from "next/server"

import { syncMediaBackup } from "@/lib/media-backup"
import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"

export const maxDuration = 300

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
    const result = await syncMediaBackup()
    await resolveOperationalEventByFingerprint("cron:media-backup")
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    await recordOperationalEvent({
      category: "STORAGE",
      fingerprint: "cron:media-backup",
      message: error instanceof Error ? error.message : "Media backup failed",
      severity: "CRITICAL",
      source: "/api/storage/backup",
    })
    return NextResponse.json({ error: "Media backup failed", ok: false }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
