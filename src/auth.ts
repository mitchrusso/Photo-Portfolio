import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

// Dev user for local development - bypasses all auth
const DEV_USER = {
  id: "dev-admin-001",
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
          return DEV_USER
        }

        if (loginToken) {
          const { verifyMagicLoginToken } = await import("@/lib/magic-login")
          const subscriber = await verifyMagicLoginToken(loginToken)

          if (!subscriber) return null

          return {
            email: subscriber.email,
            id: subscriber.id,
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
        token.planSlug = (user as typeof DEV_USER).planSlug
        token.role = (user as typeof DEV_USER).role
        token.subscriptionStatus = (user as typeof DEV_USER).subscriptionStatus
        token.systemRole = (user as typeof DEV_USER).systemRole
        token.workspaceId = (user as typeof DEV_USER).workspaceId
        token.workspaceSlug = (user as typeof DEV_USER).workspaceSlug
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
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
    id?: string
    planSlug?: string
    role?: string
    subscriptionStatus?: string
    systemRole?: string
    workspaceId?: string
    workspaceSlug?: string
  }
}
