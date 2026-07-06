import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db"

const ignoredPathPrefixes = ["/admin", "/dashboard", "/account", "/login", "/register", "/api"]
const allowedEventTypes = new Set(["PAGE_VIEW", "PAGE_EXIT", "GALLERY_OPEN", "SHARE_CLICK", "DOWNLOAD_CLICK"])

function deviceTypeFromUserAgent(userAgent: string) {
  if (/ipad|tablet/i.test(userAgent)) return "TABLET"
  if (/mobi|iphone|android/i.test(userAgent)) return "MOBILE"
  return "DESKTOP"
}

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

function galleryIdFromPath(path: string) {
  const match = path.match(/^\/g\/([^/?#]+)/)
  return match?.[1] ?? null
}

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const eventType = cleanString(payload.eventType, 40) ?? "PAGE_VIEW"
  const path = cleanString(payload.path, 300)

  if (!path || ignoredPathPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  if (!allowedEventTypes.has(eventType)) {
    return NextResponse.json({ error: "Unsupported event" }, { status: 400 })
  }

  const userAgent = request.headers.get("user-agent") ?? ""
  const durationMs = typeof payload.durationMs === "number" && Number.isFinite(payload.durationMs)
    ? Math.max(0, Math.min(24 * 60 * 60 * 1000, Math.round(payload.durationMs)))
    : null

  try {
    const prisma = getPrismaClient()
    await prisma.analyticsEvent.create({
      data: {
        deviceType: deviceTypeFromUserAgent(userAgent),
        durationMs,
        eventType,
        galleryId: galleryIdFromPath(path),
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        path,
        referrer: cleanString(payload.referrer, 500),
        sessionId: cleanString(payload.sessionId, 120),
        title: cleanString(payload.title, 200),
        userAgent: cleanString(userAgent, 500),
        visitorId: cleanString(payload.visitorId, 120),
      },
    })
  } catch (error) {
    console.error("Analytics event write failed", error)
    return NextResponse.json({ ok: false }, { status: 202 })
  }

  return NextResponse.json({ ok: true })
}
