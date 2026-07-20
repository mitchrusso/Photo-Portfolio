import type { Session } from "next-auth"

const DEFAULT_PRIMARY_SUPERADMIN_EMAIL = "mitchrusso@gmail.com"

export function getPrimarySuperAdminEmail() {
  return (process.env.PRIMARY_SUPERADMIN_EMAIL?.trim() || DEFAULT_PRIMARY_SUPERADMIN_EMAIL).toLowerCase()
}

export function isPrimarySuperAdminEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === getPrimarySuperAdminEmail()
}

export const adminCapabilities = ["subscribers", "stats", "health", "plans", "financials", "trials", "coupons", "audit", "security", "rights"] as const
export type AdminCapability = typeof adminCapabilities[number]

export function isAdminSession(session: Session | null) {
  if (!session?.user) return false
  const systemRole = session.user.systemRole?.toUpperCase()
  if (systemRole === "SUPERADMIN") return isPrimarySuperAdminEmail(session.user.email)
  return systemRole === "SUPPORT"
}

export function isSuperAdminSession(session: Session | null) {
  if (!session?.user) return false
  return session.user.systemRole?.toUpperCase() === "SUPERADMIN" && isPrimarySuperAdminEmail(session.user.email)
}

export function hasAdminCapability(session: Session | null, capability: AdminCapability) {
  if (isSuperAdminSession(session)) return true
  if (!isAdminSession(session)) return false
  if (session?.user.systemRole?.toUpperCase() !== "SUPPORT") return true
  return session.user.adminPermissions?.includes(capability) ?? false
}

export function isAdminIdentity(identity: { email?: string | null; role?: string | null; systemRole?: string | null } | null | undefined) {
  if (!identity) return false
  const systemRole = identity.systemRole?.toUpperCase()
  if (systemRole === "SUPERADMIN") return isPrimarySuperAdminEmail(identity.email)
  return systemRole === "SUPPORT"
}
