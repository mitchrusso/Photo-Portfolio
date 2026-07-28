import { getPrismaClient } from "@/lib/db"

export type PortfolioGroupProtection = {
  id: string
  name: string
  passwordHash: string
  twoFactorEnabled: boolean
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export function portfolioGroupNameFromSettings(settings: unknown) {
  const value = asRecord(settings).galleryName
  return typeof value === "string" ? value.trim() : ""
}

export async function getPortfolioGroupProtection(
  workspaceId: string,
  settings: unknown,
): Promise<PortfolioGroupProtection | null> {
  const prisma = getPrismaClient()
  const groupName = portfolioGroupNameFromSettings(settings)

  if (!groupName) {
    const workspace = await prisma.workspace.findUnique({
      select: {
        defaultGalleryPasswordHash: true,
        defaultGalleryTwoFactorEnabled: true,
      },
      where: { id: workspaceId },
    })
    if (!workspace?.defaultGalleryPasswordHash) return null
    return {
      id: `default:${workspaceId}`,
      name: "My Gallery",
      passwordHash: workspace.defaultGalleryPasswordHash,
      twoFactorEnabled: workspace.defaultGalleryTwoFactorEnabled,
    }
  }

  const group = await prisma.portfolioGroup.findFirst({
    select: {
      id: true,
      name: true,
      passwordHash: true,
      twoFactorEnabled: true,
    },
    where: { name: groupName, workspaceId },
  })
  if (!group?.passwordHash) return null

  return {
    id: group.id,
    name: group.name,
    passwordHash: group.passwordHash,
    twoFactorEnabled: group.twoFactorEnabled,
  }
}
