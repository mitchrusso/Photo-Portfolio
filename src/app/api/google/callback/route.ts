import crypto from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedCrmSession } from "@/lib/partnership-crm/access"
import { consumeGoogleOAuthState, exchangeGoogleCode, saveGoogleConnection } from "@/lib/partnership-crm/google"

export async function GET(request: NextRequest) {
  const destination = new URL("/admin/partnerships?view=Gmail", request.url)
  const session = await getAuthorizedCrmSession()
  const expected = await consumeGoogleOAuthState()
  const state = request.nextUrl.searchParams.get("state") || ""
  const code = request.nextUrl.searchParams.get("code")
  const validState = expected?.state && state.length === expected.state.length && crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expected.state))
  if (!session || !expected || session.user.id !== expected.userId || !validState || !code) {
    destination.searchParams.set("gmail_error", "invalid_authorization")
    return NextResponse.redirect(destination)
  }
  try {
    await saveGoogleConnection(session.user.id, await exchangeGoogleCode(code))
    destination.searchParams.set("gmail_connected", "1")
  } catch { destination.searchParams.set("gmail_error", "authorization_failed") }
  return NextResponse.redirect(destination)
}
