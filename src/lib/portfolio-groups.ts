import { getPrismaClient } from "@/lib/db"
import { hashGalleryPassword } from "@/lib/gallery-access"

export type PortfolioGroupSummary = {
  id: string
  name: string
  passwordProtected: boolean
  twoFactorEnabled: boolean
}

export async function getWorkspacePortfolioGroups(workspaceId: string): Promise<PortfolioGroupSummary[]> {
  const prisma = getPrismaClient()
  const [workspace, groups] = await Promise.all([
    prisma.workspace.findUnique({
      select: {
        defaultGalleryPasswordHash: true,
        defaultGalleryTwoFactorEnabled: true,
      },
      where: { id: workspaceId },
    }),
    prisma.portfolioGroup.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        passwordHash: true,
        twoFactorEnabled: true,
      },
      where: { workspaceId },
    }),
  ])

  return [
    {
      id: "default",
      name: "My Gallery",
      passwordProtected: Boolean(workspace?.defaultGalleryPasswordHash),
      twoFactorEnabled: Boolean(workspace?.defaultGalleryPasswordHash && workspace.defaultGalleryTwoFactorEnabled),
    },
    ...groups.map((group) => ({
      id: group.id,
      name: group.name,
      passwordProtected: Boolean(group.passwordHash),
      twoFactorEnabled: Boolean(group.passwordHash && group.twoFactorEnabled),
    })),
  ]
}

export async function createWorkspacePortfolioGroup(workspaceId: string, name: string): Promise<PortfolioGroupSummary> {
  const prisma = getPrismaClient()
  const normalizedName = name.trim()
  const [duplicate, lastGroup] = await Promise.all([
    prisma.portfolioGroup.findFirst({
      select: { id: true },
      where: { name: normalizedName, workspaceId },
    }),
    prisma.portfolioGroup.findFirst({
      orderBy: { position: "desc" },
      select: { position: true },
      where: { workspaceId },
    }),
  ])
  if (duplicate) throw new Error("A gallery with that name already exists.")

  return prisma.portfolioGroup.create({
    data: {
      name: normalizedName,
      position: (lastGroup?.position ?? -1) + 1,
      workspaceId,
    },
    select: {
      id: true,
      name: true,
      passwordHash: true,
      twoFactorEnabled: true,
    },
  }).then((group) => ({
    id: group.id,
    name: group.name,
    passwordProtected: Boolean(group.passwordHash),
    twoFactorEnabled: group.twoFactorEnabled,
  }))
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
      select: {
        id: true,
        name: true,
        passwordHash: true,
        twoFactorEnabled: true,
      },
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

  return {
    group: {
      id: group.id,
      name: group.name,
      passwordProtected: Boolean(group.passwordHash),
      twoFactorEnabled: Boolean(group.passwordHash && group.twoFactorEnabled),
    },
    updatedPortfolios: matchingPortfolios.length,
  }
}

export async function deleteWorkspacePortfolioGroup(
  workspaceId: string,
  groupId: string,
): Promise<{ deleted: PortfolioGroupSummary; portfolioCount: number } | null> {
  const prisma = getPrismaClient()
  const existing = await prisma.portfolioGroup.findFirst({
    select: {
      id: true,
      name: true,
      passwordHash: true,
      twoFactorEnabled: true,
    },
    where: { id: groupId, workspaceId },
  })
  if (!existing) return null

  const portfolios = await prisma.gallery.findMany({
    select: { settings: true },
    where: { workspaceId },
  })
  const portfolioCount = portfolios.filter((portfolio) => {
    const settings = portfolio.settings
    return Boolean(
      settings &&
      typeof settings === "object" &&
      !Array.isArray(settings) &&
      (settings as Record<string, unknown>).galleryName === existing.name,
    )
  }).length
  const deleted = {
    id: existing.id,
    name: existing.name,
    passwordProtected: Boolean(existing.passwordHash),
    twoFactorEnabled: Boolean(existing.passwordHash && existing.twoFactorEnabled),
  }
  if (portfolioCount > 0) return { deleted, portfolioCount }

  await prisma.portfolioGroup.delete({ where: { id: existing.id } })
  return { deleted, portfolioCount: 0 }
}

export async function updateWorkspacePortfolioGroupProtection(
  workspaceId: string,
  groupId: string,
  input: {
    password?: string
    passwordProtected: boolean
    twoFactorEnabled: boolean
  },
): Promise<PortfolioGroupSummary | null> {
  const prisma = getPrismaClient()
  const password = input.password?.trim() ?? ""

  if (groupId === "default") {
    const workspace = await prisma.workspace.findUnique({
      select: { defaultGalleryPasswordHash: true },
      where: { id: workspaceId },
    })
    if (!workspace) return null

    const passwordHash = input.passwordProtected
      ? password
        ? hashGalleryPassword(password)
        : workspace.defaultGalleryPasswordHash
      : null
    if (input.passwordProtected && !passwordHash) {
      throw new Error("Set a Gallery password before turning on protection.")
    }

    await prisma.workspace.update({
      data: {
        defaultGalleryPasswordHash: passwordHash,
        defaultGalleryTwoFactorEnabled: Boolean(passwordHash && input.twoFactorEnabled),
      },
      where: { id: workspaceId },
    })
    return {
      id: "default",
      name: "My Gallery",
      passwordProtected: Boolean(passwordHash),
      twoFactorEnabled: Boolean(passwordHash && input.twoFactorEnabled),
    }
  }

  const group = await prisma.portfolioGroup.findFirst({
    select: { id: true, name: true, passwordHash: true },
    where: { id: groupId, workspaceId },
  })
  if (!group) return null

  const passwordHash = input.passwordProtected
    ? password
      ? hashGalleryPassword(password)
      : group.passwordHash
    : null
  if (input.passwordProtected && !passwordHash) {
    throw new Error("Set a Gallery password before turning on protection.")
  }

  const updated = await prisma.portfolioGroup.update({
    data: {
      passwordHash,
      twoFactorEnabled: Boolean(passwordHash && input.twoFactorEnabled),
    },
    select: { id: true, name: true, passwordHash: true, twoFactorEnabled: true },
    where: { id: group.id },
  })
  return {
    id: updated.id,
    name: updated.name,
    passwordProtected: Boolean(updated.passwordHash),
    twoFactorEnabled: Boolean(updated.passwordHash && updated.twoFactorEnabled),
  }
}
