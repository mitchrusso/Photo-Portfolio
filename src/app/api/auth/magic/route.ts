import { signIn } from "@/auth"
import { validateMagicLoginToken } from "@/lib/magic-login"
import { isSameOriginRequest } from "@/lib/request-origin"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const PENDING_MAGIC_LOGIN_COOKIE = "photoview_magic_login_pending"

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

  // Email-security scanners routinely open GET links before the recipient does.
  // Preserve the one-time token until the subscriber explicitly submits the
  // confirmation form; a scanner's isolated cookie cannot affect the user's
  // later browser session.
  const response = NextResponse.redirect(new URL("/login/confirm", request.nextUrl.origin))
  response.cookies.set(PENDING_MAGIC_LOGIN_COOKIE, token, {
    httpOnly: true,
    maxAge: 15 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
  response.headers.set("Cache-Control", "no-store")
  return response
}

export async function HEAD() {
  return new NextResponse(null, {
    headers: { "Cache-Control": "no-store" },
    status: 204,
  })
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(PENDING_MAGIC_LOGIN_COOKIE)?.value

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid-link", request.nextUrl.origin), { status: 303 })
  }

  const subscriber = await validateMagicLoginToken(token)

  if (!subscriber) {
    cookieStore.delete(PENDING_MAGIC_LOGIN_COOKIE)
    return NextResponse.redirect(new URL("/login?error=invalid-link", request.nextUrl.origin), { status: 303 })
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
      cookieStore.delete(PENDING_MAGIC_LOGIN_COOKIE)
      return NextResponse.redirect(new URL("/login?error=invalid-link", request.nextUrl.origin), { status: 303 })
    }

    cookieStore.delete(PENDING_MAGIC_LOGIN_COOKIE)
    const nextPath = ["SUPERADMIN", "SUPPORT"].includes(subscriber.systemRole) ? "/admin" : "/dashboard"
    return NextResponse.redirect(new URL(nextPath, request.nextUrl.origin), { status: 303 })
  } catch (error) {
    if (isRedirectError(error)) throw error
    cookieStore.delete(PENDING_MAGIC_LOGIN_COOKIE)
    return NextResponse.redirect(new URL("/login?error=invalid-link", request.nextUrl.origin), { status: 303 })
  }
}
