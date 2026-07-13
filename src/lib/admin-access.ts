import type { Session } from "next-auth"

const adminSystemRoles = new Set(["SUPERADMIN", "SUPPORT"])
const legacyAdminRoles = new Set(["admin", "superadmin"])

export const adminCapabilities = ["subscribers", "stats", "health", "plans", "financials", "trials", "coupons", "audit", "security", "rights"] as const
export type AdminCapability = typeof adminCapabilities[number]

function configuredAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "").split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isAdminSession(session: Session | null) {
  if (!session?.user) return false
  if (adminSystemRoles.has(session.user.systemRole?.toUpperCase())) return true
  if (legacyAdminRoles.has(session.user.role?.toLowerCase())) return true

  const email = session.user.email?.trim().toLowerCase()
  if (!email) return false

  return configuredAdminEmails().has(email)
}

export function isSuperAdminSession(session: Session | null) {
  if (!session?.user) return false
  if (session.user.systemRole?.toUpperCase() === "SUPERADMIN") return true

  const email = session.user.email?.trim().toLowerCase()
  return Boolean(email && configuredAdminEmails().has(email))
}

export function hasAdminCapability(session: Session | null, capability: AdminCapability) {
  if (isSuperAdminSession(session)) return true
  if (!isAdminSession(session)) return false
  if (session?.user.systemRole?.toUpperCase() !== "SUPPORT") return true
  return session.user.adminPermissions?.includes(capability) ?? false
}

export function isAdminIdentity(identity: { email?: string | null; role?: string | null; systemRole?: string | null } | null | undefined) {
  if (!identity) return false
  if (adminSystemRoles.has(identity.systemRole?.toUpperCase() ?? "")) return true
  if (legacyAdminRoles.has(identity.role?.toLowerCase() ?? "")) return true

  const email = identity.email?.trim().toLowerCase()
  return Boolean(email && configuredAdminEmails().has(email))
}
