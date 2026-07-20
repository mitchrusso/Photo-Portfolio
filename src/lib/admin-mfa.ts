import { cookies } from "next/headers"
import type { Session } from "next-auth"
import { isSuperAdminSession } from "@/lib/admin-access"
import {
  ADMIN_MFA_MAX_AGE_SECONDS,
  createAdminMfaApprovalValue,
  verifyAdminMfaApprovalValue,
} from "@/lib/admin-mfa-token"
import { getAdminSmsMfaConfig } from "@/lib/twilio-verify"

const ADMIN_MFA_COOKIE = "photoview_admin_mfa"

export function createAdminMfaApproval(session: Session) {
  if (!session.user?.id || !session.user.loginSessionId) throw new Error("A current login session is required.")
  return createAdminMfaApprovalValue({ id: session.user.id, loginSessionId: session.user.loginSessionId })
}

export function verifyAdminMfaApproval(value: string | undefined, session: Session | null) {
  if (!session?.user?.id || !session.user.loginSessionId) return false
  return verifyAdminMfaApprovalValue(value, { id: session.user.id, loginSessionId: session.user.loginSessionId })
}

export function superAdminMfaCookieOptions() {
  return {
    httpOnly: true,
    maxAge: ADMIN_MFA_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  }
}

export function isSuperAdminMfaRequired(session: Session | null) {
  return isSuperAdminSession(session)
}

export async function hasValidSuperAdminMfa(session: Session | null) {
  if (!isSuperAdminMfaRequired(session)) return true
  const config = getAdminSmsMfaConfig()
  if (!config.enabled || !config.ready) return false
  const cookieStore = await cookies()
  return verifyAdminMfaApproval(cookieStore.get(ADMIN_MFA_COOKIE)?.value, session)
}

export async function setSuperAdminMfaApproval(session: Session) {
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_MFA_COOKIE, createAdminMfaApproval(session), superAdminMfaCookieOptions())
}
