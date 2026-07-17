import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getAppUrl } from "@/lib/app-url"
import { metaAuthorizationUrl } from "@/lib/meta-social"
import { createSocialOAuthState } from "@/lib/social-oauth-state"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id || !session.user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const redirectUri = `${getAppUrl(request)}/api/social/meta/callback`
    const state = createSocialOAuthState({
      provider: "meta",
      userId: session.user.id,
      workspaceId: session.user.workspaceId,
    })
    return NextResponse.redirect(metaAuthorizationUrl(redirectUri, state))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Meta connection could not be started." },
      { status: 503 },
    )
  }
}
