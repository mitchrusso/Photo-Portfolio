import type { Session } from "next-auth"

function configuredAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isAdminSession(session: Session | null) {
  if (!session?.user) return false
  if (session.user.role === "admin") return true

  const email = session.user.email?.toLowerCase()
  if (!email) return false

  return configuredAdminEmails().has(email)
}
