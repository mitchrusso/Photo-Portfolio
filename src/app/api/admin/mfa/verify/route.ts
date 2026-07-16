import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { isSuperAdminSession } from "@/lib/admin-access"
import { setSuperAdminMfaApproval } from "@/lib/admin-mfa"
import { logAdminAuditEvent } from "@/lib/admin-audit"
import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"
import { checkSuperAdminSmsCode, getAdminSmsMfaConfig } from "@/lib/twilio-verify"

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

  const clientKey = requestClientKey(request)
  const [userLimit, ipLimit] = await Promise.all([
    checkRequestRateLimit(`admin-mfa-check:${session.user.id}`, 8, 10 * 60 * 1000),
    checkRequestRateLimit(`admin-mfa-check-ip:${clientKey}`, 20, 10 * 60 * 1000),
  ])
  const blocked = [userLimit, ipLimit].find((limit) => !limit.allowed)
  if (blocked) {
    await logAdminAuditEvent({ action: "SUPERADMIN_MFA_CHECK_RATE_LIMITED", ...auditContext(request), session })
    return NextResponse.json(
      { error: "Too many code attempts. Please wait before trying again." },
      { headers: { "Retry-After": String(blocked.retryAfterSeconds) }, status: 429 },
    )
  }

  const body = await request.json().catch(() => null) as { code?: unknown } | null
  const code = typeof body?.code === "string" ? body.code.replace(/\D/g, "") : ""
  if (!/^\d{4,10}$/.test(code)) return NextResponse.json({ error: "Enter the code from the text message." }, { status: 400 })

  try {
    if (!(await checkSuperAdminSmsCode(code))) {
      await logAdminAuditEvent({ action: "SUPERADMIN_MFA_CODE_REJECTED", ...auditContext(request), session })
      return NextResponse.json({ error: "That code is incorrect or has expired." }, { status: 400 })
    }

    await setSuperAdminMfaApproval(session)
    await logAdminAuditEvent({
      action: "SUPERADMIN_MFA_VERIFIED",
      ...auditContext(request),
      session,
      targetId: session.user.id,
      targetType: "User",
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("SuperAdmin MFA verification failed", error)
    await logAdminAuditEvent({ action: "SUPERADMIN_MFA_CHECK_FAILED", ...auditContext(request), session })
    return NextResponse.json({ error: "The code could not be checked. Please try again shortly." }, { status: 502 })
  }
}
