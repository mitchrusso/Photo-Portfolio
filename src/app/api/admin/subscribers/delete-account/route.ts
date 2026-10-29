import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { isSuperAdminSession } from "@/lib/admin-access"
import { logAdminAuditEvent } from "@/lib/admin-audit"
import { hasValidSuperAdminMfa } from "@/lib/admin-mfa"
import { isSameOriginRequest } from "@/lib/request-origin"
import {
  cancelAndDeleteEmptySubscriberAccount,
  SubscriberAccountDeletionError,
} from "@/lib/subscriber-account-deletion"

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  }

  const session = await auth()
  if (!isSuperAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (!(await hasValidSuperAdminMfa(session))) {
    return NextResponse.json({ error: "Current SuperAdmin SMS verification is required." }, { status: 403 })
  }

  const body = await request.json().catch(() => null) as { confirmationEmail?: unknown; userId?: unknown } | null
  const confirmationEmail = typeof body?.confirmationEmail === "string" ? body.confirmationEmail.trim() : ""
  const userId = typeof body?.userId === "string" ? body.userId.trim() : ""
  if (!confirmationEmail || !userId) {
    return NextResponse.json({ error: "Subscriber ID and confirmation email are required." }, { status: 400 })
  }

  try {
    const result = await cancelAndDeleteEmptySubscriberAccount({ confirmationEmail, userId })
    await logAdminAuditEvent({
      action: "SUBSCRIBER_ACCOUNT_DELETED",
      ipAddress: request.headers.get("x-forwarded-for"),
      metadata: {
        canceledAt: result.canceledAt,
        email: result.email,
        stripeStatus: result.stripeStatus,
        stripeSubscriptionId: result.stripeSubscriptionId,
        workspaceId: result.workspaceId,
      },
      session,
      targetId: result.userId,
      targetType: "User",
      userAgent: request.headers.get("user-agent"),
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    if (error instanceof SubscriberAccountDeletionError) {
      return NextResponse.json({ code: error.code, error: error.message }, { status: error.status })
    }
    console.error("Subscriber account deletion failed", error)
    return NextResponse.json({ error: "The account could not be deleted safely." }, { status: 500 })
  }
}
