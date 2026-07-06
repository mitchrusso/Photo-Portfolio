import type { Session } from "next-auth"
import type { Prisma } from "@/generated/prisma/client"
import { getPrismaClient } from "@/lib/db"

type AdminAuditInput = {
  action: string
  ipAddress?: string | null
  metadata?: Prisma.InputJsonValue
  session: Session | null
  targetId?: string | null
  targetType?: string | null
  userAgent?: string | null
}

export async function logAdminAuditEvent({
  action,
  ipAddress,
  metadata,
  session,
  targetId,
  targetType,
  userAgent,
}: AdminAuditInput) {
  if (!session?.user) return

  try {
    const prisma = getPrismaClient()
    await prisma.adminAuditLog.create({
      data: {
        action,
        email: session.user.email,
        ipAddress: ipAddress ?? null,
        metadata,
        targetId: targetId ?? null,
        targetType: targetType ?? null,
        userAgent: userAgent ?? null,
        userId: session.user.id,
      },
    })
  } catch (error) {
    console.error("Admin audit logging failed", error)
  }
}

export async function getAdminAuditLogs(limit = 100) {
  const prisma = getPrismaClient()
  return prisma.adminAuditLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      action: true,
      createdAt: true,
      email: true,
      id: true,
      ipAddress: true,
      metadata: true,
      targetId: true,
      targetType: true,
      userAgent: true,
    },
    take: limit,
  })
}
