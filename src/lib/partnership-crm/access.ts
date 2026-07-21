import type { NextRequest } from "next/server"
import { auth } from "@/auth"
import { isAdminSession } from "@/lib/admin-access"
import { hasValidSuperAdminMfa } from "@/lib/admin-mfa"

export async function getAuthorizedCrmSession() {
  const session = await auth()
  if (!isAdminSession(session)) return null
  if (!(await hasValidSuperAdminMfa(session))) return null
  return session
}

export function hasSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  return Boolean(origin && origin === request.nextUrl.origin)
}
