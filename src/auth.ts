import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { randomUUID } from "node:crypto"

// Dev user for local development - bypasses all auth
const DEV_USER = {
  id: "dev-admin-001",
  adminPermissions: ["subscribers", "stats", "plans", "financials", "coupons", "audit", "security", "rights"] as string[],
  email: "dev@example.com",
  name: "Dev Admin",
  planSlug: "dev",
  role: "admin",
  subscriptionStatus: "ACTIVE",
  systemRole: "SUPERADMIN",
  workspaceId: "dev-workspace",
  workspaceSlug: "dev",
} as const

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    maxAge: 12 * 60 * 60,
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        loginToken: { label: "Login token", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase()
        const loginToken = String(credentials?.loginToken ?? "")

        if (!loginToken && process.env.NODE_ENV === "development" && (!email || email === DEV_USER.email)) {
          const { ensureDevelopmentWorkspace } = await import("@/lib/dev-workspace")
          await ensureDevelopmentWorkspace()
          return DEV_USER
        }

        if (loginToken) {
          const { verifyMagicLoginToken } = await import("@/lib/magic-login")
          const subscriber = await verifyMagicLoginToken(loginToken)

          if (!subscriber) return null

          return {
            email: subscriber.email,
            id: subscriber.id,
            adminPermissions: subscriber.adminPermissions,
            name: subscriber.name,
            planSlug: subscriber.planSlug,
            role: subscriber.role,
            subscriptionStatus: subscriber.subscriptionStatus,
            systemRole: subscriber.systemRole,
            workspaceId: subscriber.workspaceId,
            workspaceSlug: subscriber.workspaceSlug,
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // Each completed primary-factor login gets a new identifier. The
        // SuperAdmin SMS approval cookie is cryptographically bound to this
        // value so an approval from an older login cannot be replayed.
        token.loginSessionId = randomUUID()
        token.adminPermissions = (user as typeof DEV_USER).adminPermissions
        token.planSlug = (user as typeof DEV_USER).planSlug
        token.role = (user as typeof DEV_USER).role
        token.subscriptionStatus = (user as typeof DEV_USER).subscriptionStatus
        token.systemRole = (user as typeof DEV_USER).systemRole
        token.workspaceId = (user as typeof DEV_USER).workspaceId
        token.workspaceSlug = (user as typeof DEV_USER).workspaceSlug
        return token
      }

      if (process.env.NODE_ENV === "development" && token.id === DEV_USER.id) return token

      // Upgrade sessions created before login-bound MFA was deployed. Once
      // written into the JWT this remains stable until the next primary login.
      if (!token.loginSessionId) token.loginSessionId = randomUUID()

      const email = String(token.email ?? "").trim().toLowerCase()
      if (!email || !token.id) return null

      const { findLoginAccessByEmail } = await import("@/lib/subscriber-access")
      const currentAccess = await findLoginAccessByEmail(email)

      // Returning null clears the Auth.js session cookie immediately. This makes
      // membership removals, subscription access changes, and admin-rights
      // revocations effective on the subscriber's next authenticated request.
      if (!currentAccess || currentAccess.id !== token.id) return null

      token.adminPermissions = currentAccess.adminPermissions
      token.planSlug = currentAccess.planSlug
      token.role = currentAccess.role
      token.subscriptionStatus = currentAccess.subscriptionStatus
      token.systemRole = currentAccess.systemRole
      token.workspaceId = currentAccess.workspaceId
      token.workspaceSlug = currentAccess.workspaceSlug
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.loginSessionId = token.loginSessionId as string
        session.user.adminPermissions = Array.isArray(token.adminPermissions) ? token.adminPermissions as string[] : []
        session.user.planSlug = token.planSlug as string
        session.user.role = token.role as string
        session.user.subscriptionStatus = token.subscriptionStatus as string
        session.user.systemRole = token.systemRole as string
        session.user.workspaceId = token.workspaceId as string
        session.user.workspaceSlug = token.workspaceSlug as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
})

// Type augmentation for session
declare module "next-auth" {
  interface User {
    adminPermissions?: string[]
    planSlug?: string
    role?: string
    subscriptionStatus?: string
    systemRole?: string
    workspaceId?: string
    workspaceSlug?: string
  }
  interface Session {
    user: {
      id: string
      loginSessionId: string
      adminPermissions: string[]
      email: string
      name: string
      planSlug: string
      role: string
      subscriptionStatus: string
      systemRole: string
      workspaceId: string
      workspaceSlug: string
    }
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    adminPermissions?: string[]
    id?: string
    loginSessionId?: string
    planSlug?: string
    role?: string
    subscriptionStatus?: string
    systemRole?: string
    workspaceId?: string
    workspaceSlug?: string
  }
}
