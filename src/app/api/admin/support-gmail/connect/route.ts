import { NextResponse } from "next/server"
import { getAuthorizedCrmSession } from "@/lib/partnership-crm/access"
import { createSupportGoogleOAuthState, supportGmailIsConfigured, supportGoogleAuthorizationUrl } from "@/lib/support-gmail"

export async function GET() {
  const session = await getAuthorizedCrmSession()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://photoview.io"
  if (!session) return NextResponse.redirect(new URL("/login", appUrl))
  if (!supportGmailIsConfigured()) return NextResponse.redirect(new URL("/admin?tab=health&support_gmail_error=not_configured", appUrl))
  const state = await createSupportGoogleOAuthState(session.user.id)
  return NextResponse.redirect(supportGoogleAuthorizationUrl(state))
}
