import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getAppUrl } from "@/lib/app-url"
import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"
import { requestSmugMugToken, smugMugAuthorizationUrl } from "@/lib/smugmug-api"
import { createSmugMugOAuthCookie, SMUGMUG_OAUTH_COOKIE } from "@/lib/smugmug-oauth-cookie"

export async function GET(request: Request) {
  const session = await auth()
  const appUrl = getAppUrl(request)
  if (!session?.user?.id || !session.user.workspaceId) return NextResponse.redirect(`${appUrl}/login`)

  const limit = await checkRequestRateLimit(`smugmug-connect:${session.user.id}:${requestClientKey(request)}`, 10, 10 * 60 * 1000)
  if (!limit.allowed) return NextResponse.redirect(`${appUrl}/dashboard?panel=settings&settings=imports&smugmug=rate-limited`)

  try {
    const callbackUrl = `${appUrl}/api/import/smugmug/callback`
    const requestToken = await requestSmugMugToken(callbackUrl)
    const response = NextResponse.redirect(smugMugAuthorizationUrl(requestToken.token))
    response.cookies.set(SMUGMUG_OAUTH_COOKIE, createSmugMugOAuthCookie({
      requestToken: requestToken.token,
      requestTokenSecret: requestToken.tokenSecret,
      userId: session.user.id,
      workspaceId: session.user.workspaceId,
    }), {
      httpOnly: true,
      maxAge: 10 * 60,
      path: "/api/import/smugmug",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
    return response
  } catch (error) {
    console.error("SmugMug connection could not start", error)
    return NextResponse.redirect(`${appUrl}/dashboard?panel=settings&settings=imports&smugmug=connection-error`)
  }
}
