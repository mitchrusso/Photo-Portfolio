import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { isSuperAdminSession } from "@/lib/admin-access"
import { hasValidSuperAdminMfa } from "@/lib/admin-mfa"
import { logAdminAuditEvent } from "@/lib/admin-audit"
import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"
import { getAdminSmsMfaConfig, sendSuperAdminSmsCode } from "@/lib/twilio-verify"

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  return Boolean(origin && origin === request.nextUrl.origin)
}

function auditContext(request: NextRequest) {
  return {
    ipAddress: requestClientKey(request),
    userAgent: request.headers.get("user-agent"),
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || !isSuperAdminSession(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })

  const config = getAdminSmsMfaConfig()
  if (!config.enabled) return NextResponse.json({ error: "SMS verification is not enabled." }, { status: 409 })
  if (!config.ready) return NextResponse.json({ error: "SMS verification is not fully configured." }, { status: 503 })
  if (await hasValidSuperAdminMfa(session)) return NextResponse.json({ alreadyVerified: true, ok: true })

  const clientKey = requestClientKey(request)
  const [shortLimit, dailyLimit, ipLimit] = await Promise.all([
    checkRequestRateLimit(`admin-mfa-send:${session.user.id}`, 3, 10 * 60 * 1000),
    checkRequestRateLimit(`admin-mfa-send-day:${session.user.id}`, 10, 24 * 60 * 60 * 1000),
    checkRequestRateLimit(`admin-mfa-send-ip:${clientKey}`, 10, 60 * 60 * 1000),
  ])
  const blocked = [shortLimit, dailyLimit, ipLimit].find((limit) => !limit.allowed)
  if (blocked) {
    await logAdminAuditEvent({ action: "SUPERADMIN_MFA_SEND_RATE_LIMITED", ...auditContext(request), session })
    return NextResponse.json(
      { error: "Too many code requests. Please wait before trying again." },
      { headers: { "Retry-After": String(blocked.retryAfterSeconds) }, status: 429 },
    )
  }

  try {
    const verificationSid = await sendSuperAdminSmsCode()
    await logAdminAuditEvent({
      action: "SUPERADMIN_MFA_CODE_SENT",
      ...auditContext(request),
      metadata: { verificationSid },
      session,
      targetId: session.user.id,
      targetType: "User",
    })
    return NextResponse.json({ maskedPhone: config.maskedPhone, ok: true })
  } catch (error) {
    console.error("SuperAdmin MFA code delivery failed", error)
    await logAdminAuditEvent({ action: "SUPERADMIN_MFA_CODE_SEND_FAILED", ...auditContext(request), session })
    return NextResponse.json({ error: "The security code could not be sent. Please try again shortly." }, { status: 502 })
  }
}
