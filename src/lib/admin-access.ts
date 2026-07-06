import type { Session } from "next-auth"

const bootstrapAdminEmails = ["mitchrusso@gmail.com"]

function configuredAdminEmails() {
  return new Set(
    [...bootstrapAdminEmails, ...(process.env.ADMIN_EMAILS ?? "").split(",")]
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isAdminSession(session: Session | null) {
  if (!session?.user) return false
  if (["admin", "superadmin"].includes(session.user.role?.toLowerCase())) return true

  const email = session.user.email?.trim().toLowerCase()
  if (!email) return false

  return configuredAdminEmails().has(email)
}
