import { getPrismaClient } from "@/lib/db"
import {
  calculateSubscriberOnboardingProgress,
  type SubscriberOnboardingProgress,
} from "@/lib/onboarding-progress-rules"

export type { SubscriberOnboardingProgress } from "@/lib/onboarding-progress-rules"

export async function getSubscriberOnboardingProgress(
  workspaceId: string,
): Promise<SubscriberOnboardingProgress> {
  const prisma = getPrismaClient()
  const [galleries, previewEvent, shareCount] = await Promise.all([
    prisma.gallery.findMany({
      select: {
        _count: { select: { photos: true } },
        coverImageUrl: true,
        coverPhotoId: true,
        privacy: true,
      },
      where: { workspaceId },
    }),
    prisma.analyticsEvent.findFirst({
      select: { id: true },
      where: {
        eventType: "ONBOARDING_PREVIEW",
        metadata: {
          path: ["workspaceId"],
          equals: workspaceId,
        },
      },
    }),
    prisma.socialShareEvent.count({ where: { workspaceId } }),
  ])

  const galleriesWithPhotos = galleries.filter((gallery) => gallery._count.photos > 0)

  return calculateSubscriberOnboardingProgress({
    hasCover: galleriesWithPhotos.some((gallery) => Boolean(gallery.coverPhotoId || gallery.coverImageUrl)),
    hasPhotos: galleriesWithPhotos.length > 0,
    hasPortfolio: galleries.length > 0,
    hasPreviewed: Boolean(previewEvent),
    hasShared: shareCount > 0,
    hasVisibility: galleriesWithPhotos.some((gallery) => gallery.privacy !== "PRIVATE"),
  })
}
