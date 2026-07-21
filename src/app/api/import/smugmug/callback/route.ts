import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getAppUrl } from "@/lib/app-url"
import { getPrismaClient } from "@/lib/db"
import { encryptSocialToken } from "@/lib/social-token-crypto"
import { exchangeSmugMugToken, getSmugMugAuthenticatedUser } from "@/lib/smugmug-api"
import { readSmugMugOAuthCookie, SMUGMUG_OAUTH_COOKIE } from "@/lib/smugmug-oauth-cookie"

export async function GET(request: Request) {
  const session = await auth()
  const appUrl = getAppUrl(request)
  if (!session?.user?.id || !session.user.workspaceId) return NextResponse.redirect(`${appUrl}/login`)

  const url = new URL(request.url)
  const oauthToken = url.searchParams.get("oauth_token")
  const verifier = url.searchParams.get("oauth_verifier")
  const cookie = readSmugMugOAuthCookie(request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${SMUGMUG_OAUTH_COOKIE}=`))?.slice(SMUGMUG_OAUTH_COOKIE.length + 1))
  const returnUrl = `${appUrl}/dashboard?panel=settings&settings=imports`

  if (
    !cookie ||
    !oauthToken ||
    !verifier ||
    oauthToken !== cookie.requestToken ||
    cookie.userId !== session.user.id ||
    cookie.workspaceId !== session.user.workspaceId
  ) return clearCookie(NextResponse.redirect(`${returnUrl}&smugmug=connection-error`))

  try {
    const credentials = await exchangeSmugMugToken({
      token: cookie.requestToken,
      tokenSecret: cookie.requestTokenSecret,
      verifier,
    })
    const user = await getSmugMugAuthenticatedUser(credentials)
    const providerAccountId = user.Uri || user.NickName!
    const prisma = getPrismaClient()
    await prisma.$transaction([
      prisma.socialConnection.updateMany({
        data: { status: "REVOKED" },
        where: { network: "smugmug", workspaceId: session.user.workspaceId },
      }),
      prisma.socialConnection.upsert({
        create: {
          accessTokenEncrypted: encryptSocialToken(credentials.token),
          lastVerifiedAt: new Date(),
          metadata: { nickname: user.NickName, uri: user.Uri },
          network: "smugmug",
          provider: "smugmug",
          providerAccountId,
          providerAccountName: user.Name || user.NickName!,
          refreshTokenEncrypted: encryptSocialToken(credentials.tokenSecret),
          scopes: ["read"],
          workspaceId: session.user.workspaceId,
        },
        update: {
          accessTokenEncrypted: encryptSocialToken(credentials.token),
          lastVerifiedAt: new Date(),
          metadata: { nickname: user.NickName, uri: user.Uri },
          providerAccountName: user.Name || user.NickName!,
          refreshTokenEncrypted: encryptSocialToken(credentials.tokenSecret),
          status: "ACTIVE",
        },
        where: {
          workspaceId_network_providerAccountId: {
            network: "smugmug",
            providerAccountId,
            workspaceId: session.user.workspaceId,
          },
        },
      }),
    ])
    return clearCookie(NextResponse.redirect(`${returnUrl}&smugmug=connected`))
  } catch (error) {
    console.error("SmugMug connection failed", error)
    return clearCookie(NextResponse.redirect(`${returnUrl}&smugmug=connection-error`))
  }
}

function clearCookie(response: NextResponse) {
  response.cookies.set(SMUGMUG_OAUTH_COOKIE, "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/api/import/smugmug",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
  return response
}
