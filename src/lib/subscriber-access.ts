import { getPrismaClient } from "@/lib/db"

const allowedSubscriptionStatuses = new Set([
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "UNPAID",
  "CANCELED",
  "INCOMPLETE",
])

export type SubscriberAccess = {
  adminPermissions: string[]
  email: string
  id: string
  name: string
  planSlug: string
  role: string
  subscriptionStatus: string
  systemRole: string
  workspaceId: string
  workspaceName: string
  workspaceSlug: string
}

function parseAdminPermissions(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}

export async function findSubscriberAccessByEmail(email: string): Promise<SubscriberAccess | null> {
  if (!process.env.DATABASE_URL) return null

  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return null

  const prisma = getPrismaClient()
  const user = await prisma.user.findUnique({
    include: {
      memberships: {
        include: {
          workspace: {
            include: {
              subscription: {
                include: {
                  plan: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    where: {
      email: normalizedEmail,
    },
  })

  if (!user) return null

  const membership = user.memberships.find(({ role, workspace }) => {
    const status = workspace.subscription?.status
    return role !== "CLIENT" && status ? allowedSubscriptionStatuses.has(status) : false
  })

  if (!membership?.workspace.subscription) return null

  return {
    adminPermissions: parseAdminPermissions(user.adminPermissions),
    email: user.email,
    id: user.id,
    name: user.name ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ?? user.email,
    planSlug: membership.workspace.subscription.plan.slug,
    role: membership.role,
    subscriptionStatus: membership.workspace.subscription.status,
    systemRole: user.systemRole,
    workspaceId: membership.workspace.id,
    workspaceName: membership.workspace.name,
    workspaceSlug: membership.workspace.slug,
  }
}

export async function findLoginAccessByEmail(email: string): Promise<SubscriberAccess | null> {
  const subscriber = await findSubscriberAccessByEmail(email)
  if (subscriber) return subscriber

  if (!process.env.DATABASE_URL) return null

  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return null

  const prisma = getPrismaClient()
  const user = await prisma.user.findUnique({
    select: {
      adminPermissions: true,
      email: true,
      firstName: true,
      id: true,
      lastName: true,
      name: true,
      systemRole: true,
    },
    where: {
      email: normalizedEmail,
    },
  })

  if (!user || !["SUPERADMIN", "SUPPORT"].includes(user.systemRole)) return null

  return {
    adminPermissions: parseAdminPermissions(user.adminPermissions),
    email: user.email,
    id: user.id,
    name: user.name ?? (`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email),
    planSlug: "admin",
    role: "admin",
    subscriptionStatus: "ACTIVE",
    systemRole: user.systemRole,
    workspaceId: "admin",
    workspaceName: "PhotoViewPro Admin",
    workspaceSlug: "admin",
  }
}
