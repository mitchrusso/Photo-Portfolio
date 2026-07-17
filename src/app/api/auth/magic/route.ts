import { signIn } from "@/auth"
import { validateMagicLoginToken } from "@/lib/magic-login"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
]

function isRedirectError(error: unknown) {
  return error instanceof Error && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")
}

async function clearExistingSessionCookies() {
  const cookieStore = await cookies()

  for (const cookie of cookieStore.getAll()) {
    if (SESSION_COOKIE_NAMES.some((name) => cookie.name === name || cookie.name.startsWith(`${name}.`))) {
      cookieStore.delete(cookie.name)
    }
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid-link", request.nextUrl.origin))
  }

  const subscriber = await validateMagicLoginToken(token)

  if (!subscriber) {
    return NextResponse.redirect(new URL("/login?error=invalid-link", request.nextUrl.origin))
  }

  try {
    // A secure link is an explicit request to become the identity encoded in
    // that link. Clear any subscriber, legacy, or chunked session cookies first
    // so a previously signed-in account cannot win cookie selection afterward.
    await clearExistingSessionCookies()

    const result = await signIn("credentials", {
      loginToken: token,
      redirect: false,
    })

    if (typeof result !== "string" && result?.error) {
      return NextResponse.redirect(new URL("/login?error=invalid-link", request.nextUrl.origin))
    }

    const nextPath = ["SUPERADMIN", "SUPPORT"].includes(subscriber.systemRole) ? "/admin" : "/dashboard"
    return NextResponse.redirect(new URL(nextPath, request.nextUrl.origin))
  } catch (error) {
    if (isRedirectError(error)) throw error
    return NextResponse.redirect(new URL("/login?error=invalid-link", request.nextUrl.origin))
  }
}
