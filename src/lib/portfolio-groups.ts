import { getPrismaClient } from "@/lib/db"

export type PortfolioGroupSummary = {
  id: string
  name: string
}

export async function getWorkspacePortfolioGroups(workspaceId: string): Promise<PortfolioGroupSummary[]> {
  const prisma = getPrismaClient()
  return prisma.portfolioGroup.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true },
    where: { workspaceId },
  })
}

export async function createWorkspacePortfolioGroup(workspaceId: string, name: string): Promise<PortfolioGroupSummary> {
  const prisma = getPrismaClient()
  const normalizedName = name.trim()
  const lastGroup = await prisma.portfolioGroup.findFirst({
    orderBy: { position: "desc" },
    select: { position: true },
    where: { workspaceId },
  })

  return prisma.portfolioGroup.upsert({
    create: {
      name: normalizedName,
      position: (lastGroup?.position ?? -1) + 1,
      workspaceId,
    },
    select: { id: true, name: true },
    update: {},
    where: { workspaceId_name: { name: normalizedName, workspaceId } },
  })
}
