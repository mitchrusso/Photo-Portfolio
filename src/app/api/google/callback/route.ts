import crypto from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedCrmSession } from "@/lib/partnership-crm/access"
import { consumeGoogleOAuthState, exchangeGoogleCode, saveGoogleConnection, UnexpectedCrmGmailAccountError } from "@/lib/partnership-crm/google"
import { consumeSupportGoogleOAuthState, exchangeSupportGoogleCode, saveSupportGoogleConnection } from "@/lib/support-gmail"

function stateMatches(expected: string | undefined, actual: string) {
  return Boolean(expected && actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected)))
}

export async function GET(request: NextRequest) {
  const session = await getAuthorizedCrmSession()
  const [supportExpected, crmExpected] = await Promise.all([consumeSupportGoogleOAuthState(), consumeGoogleOAuthState()])
  const state = request.nextUrl.searchParams.get("state") || ""
  const code = request.nextUrl.searchParams.get("code")
  const supportFlow = stateMatches(supportExpected?.state, state)
  const expected = supportFlow ? supportExpected : crmExpected
  const destination = new URL(supportFlow ? "/admin?tab=health" : "/admin/partnerships?view=Gmail", request.url)
  const validState = stateMatches(expected?.state, state)
  if (!session || !expected || session.user.id !== expected.userId || !validState || !code) {
    destination.searchParams.set(supportFlow ? "support_gmail_error" : "gmail_error", "invalid_authorization")
    return NextResponse.redirect(destination)
  }
  try {
    if (supportFlow) {
      await saveSupportGoogleConnection(session.user.id, await exchangeSupportGoogleCode(code))
      destination.searchParams.set("support_gmail_connected", "1")
    } else {
      await saveGoogleConnection(session.user.id, await exchangeGoogleCode(code))
      destination.searchParams.set("gmail_connected", "1")
    }
  } catch (error) {
    destination.searchParams.set(supportFlow ? "support_gmail_error" : "gmail_error", error instanceof UnexpectedCrmGmailAccountError ? "wrong_account" : "authorization_failed")
  }
  return NextResponse.redirect(destination)
}
