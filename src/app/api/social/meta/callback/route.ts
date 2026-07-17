import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getAppUrl } from "@/lib/app-url"
import { getPrismaClient } from "@/lib/db"
import { exchangeMetaAuthorizationCode, getMetaPublishingAccounts } from "@/lib/meta-social"
import { verifySocialOAuthState } from "@/lib/social-oauth-state"

export async function GET(request: Request) {
  const session = await auth()
  const appUrl = getAppUrl(request)
  if (!session?.user?.id || !session.user.workspaceId) {
    return NextResponse.redirect(`${appUrl}/login`)
  }

  const url = new URL(request.url)
  const state = verifySocialOAuthState(url.searchParams.get("state"))
  const code = url.searchParams.get("code")
  if (!state || !code || state.userId !== session.user.id || state.workspaceId !== session.user.workspaceId) {
    return NextResponse.redirect(`${appUrl}/dashboard?panel=settings&settings=scheduler&social=connection-error`)
  }

  try {
    const redirectUri = `${appUrl}/api/social/meta/callback`
    const token = await exchangeMetaAuthorizationCode(code, redirectUri)
    const accounts = await getMetaPublishingAccounts(token.access_token)
    if (accounts.length === 0) return NextResponse.redirect(`${appUrl}/dashboard?panel=settings&settings=scheduler&social=no-eligible-accounts`)

    const prisma = getPrismaClient()
    const tokenExpiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null
    await prisma.$transaction(accounts.map((account) => prisma.socialConnection.upsert({
      create: {
        ...account,
        lastVerifiedAt: new Date(),
        provider: "meta",
        scopes: ["pages_manage_posts", "instagram_content_publish"],
        tokenExpiresAt,
        workspaceId: session.user.workspaceId!,
      },
      update: {
        accessTokenEncrypted: account.accessTokenEncrypted,
        lastVerifiedAt: new Date(),
        metadata: account.metadata,
        providerAccountName: account.providerAccountName,
        status: "ACTIVE",
        tokenExpiresAt,
      },
      where: {
        workspaceId_network_providerAccountId: {
          network: account.network,
          providerAccountId: account.providerAccountId,
          workspaceId: session.user.workspaceId!,
        },
      },
    })))

    return NextResponse.redirect(`${appUrl}/dashboard?panel=settings&settings=scheduler&social=connected`)
  } catch (error) {
    console.error("Meta social connection failed", error)
    return NextResponse.redirect(`${appUrl}/dashboard?panel=settings&settings=scheduler&social=connection-error`)
  }
}
