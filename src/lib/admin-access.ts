import type { Session } from "next-auth"

const adminSystemRoles = new Set(["SUPERADMIN", "SUPPORT"])

export const adminCapabilities = ["subscribers", "stats", "health", "plans", "financials", "trials", "coupons", "audit", "security", "rights"] as const
export type AdminCapability = typeof adminCapabilities[number]

export function isAdminSession(session: Session | null) {
  if (!session?.user) return false
  return adminSystemRoles.has(session.user.systemRole?.toUpperCase())
}

export function isSuperAdminSession(session: Session | null) {
  if (!session?.user) return false
  return session.user.systemRole?.toUpperCase() === "SUPERADMIN"
}

export function hasAdminCapability(session: Session | null, capability: AdminCapability) {
  if (isSuperAdminSession(session)) return true
  if (!isAdminSession(session)) return false
  if (session?.user.systemRole?.toUpperCase() !== "SUPPORT") return true
  return session.user.adminPermissions?.includes(capability) ?? false
}

export function isAdminIdentity(identity: { email?: string | null; role?: string | null; systemRole?: string | null } | null | undefined) {
  if (!identity) return false
  return adminSystemRoles.has(identity.systemRole?.toUpperCase() ?? "")
}
