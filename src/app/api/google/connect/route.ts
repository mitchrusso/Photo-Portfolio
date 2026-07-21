import { NextResponse } from "next/server"
import { getAuthorizedCrmSession } from "@/lib/partnership-crm/access"
import { createGoogleOAuthState, googleAuthorizationUrl, googleIsConfigured } from "@/lib/partnership-crm/google"

export async function GET() {
  const session = await getAuthorizedCrmSession()
  if (!session) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "https://photoview.io"))
  if (!googleIsConfigured()) return NextResponse.redirect(new URL("/admin/partnerships?view=Gmail&gmail_error=not_configured", process.env.NEXT_PUBLIC_APP_URL || "https://photoview.io"))
  const state = await createGoogleOAuthState(session.user.id)
  return NextResponse.redirect(googleAuthorizationUrl(state))
}
