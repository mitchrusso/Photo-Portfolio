import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const hasPrototypeSubscriberAccess = req.cookies.get("photoviewpro_subscriber")?.value === "demo"
  const isDevMode = process.env.NODE_ENV === "development"
  const pathname = req.nextUrl.pathname
  const isAuthPage = pathname.startsWith("/login")
  const isProtectedApiRoute = pathname.startsWith("/api/blob")
  const isPublicApiRoute = pathname.startsWith("/api/galleries")
  const isProtectedRoute = pathname.startsWith("/dashboard")

  if (isPublicApiRoute || pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  if (!isProtectedRoute && !isProtectedApiRoute) {
    return NextResponse.next()
  }

  if (isDevMode && !isLoggedIn && !isAuthPage) {
    const devLoginUrl = new URL("/api/auth/dev-login", req.nextUrl.origin)
    devLoginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return NextResponse.redirect(devLoginUrl)
  }

  if (!isDevMode && !isLoggedIn && !hasPrototypeSubscriberAccess && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
