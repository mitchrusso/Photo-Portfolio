import { getPrismaClient } from "./db"
import { sumStoredPhotoBytes } from "./storage-math"

export async function reconcileStorageTotals(workspaceId?: string) {
  if (!process.env.DATABASE_URL) {
    return { correctedGalleries: 0, correctedWorkspaces: 0, galleries: 0, workspaces: 0 }
  }

  const prisma = getPrismaClient()
  const [photoGroups, galleries, workspaces] = await Promise.all([
    prisma.photo.groupBy({
      _sum: {
        bytes: true,
        displayBytes: true,
        thumbnailBytes: true,
      },
      by: ["galleryId", "workspaceId"],
      ...(workspaceId ? { where: { workspaceId } } : {}),
    }),
    prisma.gallery.findMany({
      select: {
        id: true,
        storageUsedBytes: true,
        workspaceId: true,
      },
      ...(workspaceId ? { where: { workspaceId } } : {}),
    }),
    prisma.workspace.findMany({
      select: {
        id: true,
        storageUsedBytes: true,
      },
      ...(workspaceId ? { where: { id: workspaceId } } : {}),
    }),
  ])

  const galleryTotals = new Map(
    photoGroups.map((group) => [
      group.galleryId,
      sumStoredPhotoBytes({
        bytes: group._sum.bytes,
        displayBytes: group._sum.displayBytes,
        thumbnailBytes: group._sum.thumbnailBytes,
      }),
    ]),
  )
  const workspaceTotals = new Map<string, bigint>()
  const galleryCorrections = galleries.flatMap((gallery) => {
    const total = galleryTotals.get(gallery.id) ?? BigInt(0)
    workspaceTotals.set(gallery.workspaceId, (workspaceTotals.get(gallery.workspaceId) ?? BigInt(0)) + total)

    return gallery.storageUsedBytes === total
      ? []
      : [prisma.gallery.update({ data: { storageUsedBytes: total }, where: { id: gallery.id } })]
  })
  const workspaceCorrections = workspaces.flatMap((workspace) => {
    const total = workspaceTotals.get(workspace.id) ?? BigInt(0)
    return workspace.storageUsedBytes === total
      ? []
      : [prisma.workspace.update({ data: { storageUsedBytes: total }, where: { id: workspace.id } })]
  })

  if (galleryCorrections.length > 0 || workspaceCorrections.length > 0) {
    await prisma.$transaction([...galleryCorrections, ...workspaceCorrections])
  }

  return {
    correctedGalleries: galleryCorrections.length,
    correctedWorkspaces: workspaceCorrections.length,
    galleries: galleries.length,
    workspaces: workspaces.length,
  }
}
