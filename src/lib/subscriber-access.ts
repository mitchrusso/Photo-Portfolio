import { getPrismaClient } from "@/lib/db"

const allowedSubscriptionStatuses = new Set(["ACTIVE", "TRIALING"])

export type SubscriberAccess = {
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
