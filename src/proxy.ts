import { auth } from "@/auth"
import { isAdminIdentity } from "@/lib/admin-access"
import { getPublicSiteSubdomain } from "@/lib/site-domain"
import { isSameOriginRequest } from "@/lib/request-origin"
import { NextResponse } from "next/server"

const SAME_ORIGIN_API_PREFIXES = [
  "/api/account",
  "/api/admin",
  "/api/ai",
  "/api/blob",
  "/api/feedback",
  "/api/gear",
  "/api/import/token",
  "/api/portfolio",
  "/api/secure-share-links",
  "/api/social",
  "/api/storage",
  "/api/stripe/account-checkout",
  "/api/stripe/cancel-trial",
  "/api/stripe/customer-portal",
  "/api/website",
]

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isDevMode = process.env.NODE_ENV === "development"
  const pathname = req.nextUrl.pathname
  const isAuthPage = pathname.startsWith("/login")
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/")
  const isProtectedApiRoute = pathname.startsWith("/api/blob")
  const isPublicApiRoute = pathname.startsWith("/api/galleries")
  const isProtectedRoute = pathname.startsWith("/dashboard") || isAdminRoute
  const publicSiteSubdomain = getPublicSiteSubdomain(req.headers.get("host"))
  const isUnsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(req.method)
  const requiresSameOrigin = SAME_ORIGIN_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (isUnsafeMethod && requiresSameOrigin && !isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  }

  if (publicSiteSubdomain && pathname === "/") {
    const publishedSiteUrl = req.nextUrl.clone()
    publishedSiteUrl.pathname = `/site/${encodeURIComponent(publicSiteSubdomain)}`
    return NextResponse.rewrite(publishedSiteUrl)
  }

  if (isPublicApiRoute || pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  if (!isProtectedRoute && !isProtectedApiRoute) {
    return NextResponse.next()
  }

  if (isDevMode && !isLoggedIn && !isAuthPage) {
    const devLoginUrl = new URL("/api/auth/dev-login", req.nextUrl.origin)
    devLoginUrl.searchParams.set("callbackUrl", `${req.nextUrl.pathname}${req.nextUrl.search}`)
    return NextResponse.redirect(devLoginUrl)
  }

  if (!isDevMode && !isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin))
  }

  if (isAdminRoute && !isAdminIdentity(req.auth?.user)) {
    return NextResponse.redirect(new URL("/account", req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
