import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "node:crypto"
import { getPrismaClient } from "@/lib/db"
import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"

const ignoredPathPrefixes = ["/admin", "/dashboard", "/account", "/login", "/register", "/api"]
const allowedEventTypes = new Set([
  "PAGE_VIEW",
  "PAGE_EXIT",
  "GALLERY_OPEN",
  "SHARE_CLICK",
  "DOWNLOAD_CLICK",
  "SIGNUP_CLICK",
  "PRICING_CLICK",
  "CHECKOUT_START",
  "COUPON_APPLY",
  "DASHBOARD_OPEN",
  "LEAD_CAPTURE",
])

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

function cleanMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined
  const entries = Object.entries(value).slice(0, 20)
  const clean: Record<string, string | number | boolean | null> = {}
  for (const [rawKey, rawValue] of entries) {
    const key = rawKey.trim().slice(0, 80)
    if (!key) continue
    if (typeof rawValue === "string") clean[key] = rawValue.slice(0, 500)
    else if (typeof rawValue === "number" && Number.isFinite(rawValue)) clean[key] = rawValue
    else if (typeof rawValue === "boolean" || rawValue === null) clean[key] = rawValue
  }
  return Object.keys(clean).length > 0 ? clean : undefined
}

function anonymizedIp(request: NextRequest) {
  const rawIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim()
  const secret = process.env.AUTH_SECRET || process.env.CRON_SECRET
  if (!rawIp || !secret) return null
  return createHmac("sha256", secret).update(rawIp).digest("hex").slice(0, 32)
}

export async function POST(request: NextRequest) {
  const limit = checkRequestRateLimit(`analytics:${requestClientKey(request)}`, 180, 60 * 1000)
  if (!limit.allowed) return NextResponse.json({ ok: true, skipped: true }, { status: 202 })

  let payload: Record<string, unknown>

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const eventType = cleanString(payload.eventType, 40) ?? "PAGE_VIEW"
  const path = cleanString(payload.path, 300)

  if (!path || !path.startsWith("/") || /[\r\n]/.test(path)) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const isPassivePageEvent = eventType === "PAGE_VIEW" || eventType === "PAGE_EXIT"
  if (isPassivePageEvent && ignoredPathPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
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
        ipAddress: anonymizedIp(request),
        metadata: cleanMetadata(payload.metadata),
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
