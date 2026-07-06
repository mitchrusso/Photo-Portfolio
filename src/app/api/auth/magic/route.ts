import { signIn } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

function isRedirectError(error: unknown) {
  return error instanceof Error && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid-link", request.nextUrl.origin))
  }

  try {
    await signIn("credentials", {
      loginToken: token,
      redirect: true,
      redirectTo: "/dashboard",
    })

    return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin))
  } catch (error) {
    if (isRedirectError(error)) throw error
    return NextResponse.redirect(new URL("/login?error=invalid-link", request.nextUrl.origin))
  }
}
