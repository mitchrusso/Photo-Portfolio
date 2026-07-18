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

export async function renameWorkspacePortfolioGroup(
  workspaceId: string,
  groupId: string,
  name: string,
): Promise<{ group: PortfolioGroupSummary; updatedPortfolios: number } | null> {
  const prisma = getPrismaClient()
  const normalizedName = name.trim()
  const existing = await prisma.portfolioGroup.findFirst({
    select: { id: true, name: true },
    where: { id: groupId, workspaceId },
  })
  if (!existing) return null

  const duplicate = await prisma.portfolioGroup.findFirst({
    select: { id: true },
    where: { id: { not: groupId }, name: normalizedName, workspaceId },
  })
  if (duplicate) throw new Error("A gallery with that name already exists.")

  const portfolios = await prisma.gallery.findMany({
    select: { id: true, settings: true },
    where: { workspaceId },
  })
  const matchingPortfolios = portfolios.filter((portfolio) => {
    const settings = portfolio.settings
    return Boolean(
      settings &&
      typeof settings === "object" &&
      !Array.isArray(settings) &&
      (settings as Record<string, unknown>).galleryName === existing.name,
    )
  })

  const group = await prisma.$transaction(async (tx) => {
    const renamed = await tx.portfolioGroup.update({
      data: { name: normalizedName },
      select: { id: true, name: true },
      where: { id: existing.id },
    })

    await Promise.all(matchingPortfolios.map((portfolio) => {
      const settings = portfolio.settings && typeof portfolio.settings === "object" && !Array.isArray(portfolio.settings)
        ? portfolio.settings as Record<string, unknown>
        : {}
      return tx.gallery.update({
        data: { settings: { ...settings, galleryName: normalizedName } },
        where: { id: portfolio.id },
      })
    }))
    return renamed
  })

  return { group, updatedPortfolios: matchingPortfolios.length }
}
