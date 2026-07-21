import { notFound } from "next/navigation"
import { EmbedGalleryView } from "@/components/portfolio/embed-gallery-view"
import { EmbedPhotoGrid } from "@/components/portfolio/embed-photo-grid"
import { PublicPortfolioGrid } from "@/components/portfolio/public-portfolio-grid"
import { isVisibleRenderableAsset, parseEmbedPhotoKey } from "@/lib/gallery-utils"
import {
  getPublicPortfolioGallery,
  getPublicWorkspacePortfolioGalleries,
} from "@/lib/portfolio-persistence"

type EmbedPageProps = {
  params: Promise<{ galleryPath: string[] }>
  searchParams: Promise<{
    galleries?: string | string[]
    photos?: string | string[]
  }>
}

export const dynamic = "force-dynamic"

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function queryList(value: string | string[] | undefined, limit: number) {
  return Array.from(new Set((queryValue(value) ?? "").split(",").map((item) => item.trim()).filter(Boolean))).slice(0, limit)
}

function allowsEmbedding(gallery: { embedEnabled?: boolean; privacy: string }) {
  return (gallery.embedEnabled ?? true) && gallery.privacy !== "Password" && gallery.privacy !== "Client portal"
}

export async function generateMetadata({ params }: EmbedPageProps) {
  const { galleryPath } = await params
  if (galleryPath.length === 2) {
    const gallery = await getPublicPortfolioGallery(galleryPath[1], galleryPath[0])
    return {
      title: gallery ? `${gallery.seoTitle || gallery.name} Embed | PhotoView.io` : "Gallery embed not found | PhotoView.io",
      description: gallery?.seoDescription || gallery?.description,
      robots: { index: false, follow: true },
    }
  }

  return {
    title: "Embedded photography portfolios | PhotoView.io",
    description: "A photographer-selected PhotoView.io portfolio presentation.",
    robots: { index: false, follow: true },
  }
}

export default async function EmbedPage({ params, searchParams }: EmbedPageProps) {
  const { galleryPath } = await params

  if (galleryPath.length === 2) {
    const gallery = await getPublicPortfolioGallery(galleryPath[1], galleryPath[0])
    if (!gallery) notFound()
    return <EmbedGalleryView gallery={gallery} />
  }

  if (galleryPath.length !== 1 || !galleryPath[0]) notFound()

  const workspaceSlug = galleryPath[0]
  const query = await searchParams
  const requestedGalleryIds = queryList(query.galleries, 100)
  const requestedPhotoKeys = queryList(query.photos, 50)
  const parsedPhotoKeys = requestedPhotoKeys
    .map(parseEmbedPhotoKey)
    .filter((key): key is NonNullable<typeof key> => Boolean(key))
  const requestedIds = parsedPhotoKeys.length > 0
    ? Array.from(new Set(parsedPhotoKeys.map((key) => key.galleryId)))
    : requestedGalleryIds.length > 0
      ? requestedGalleryIds
      : undefined
  const galleries = await getPublicWorkspacePortfolioGalleries(
    workspaceSlug,
    requestedIds,
    { includeVisiblePhotos: parsedPhotoKeys.length > 0 },
  )
  if (!galleries) notFound()

  const embeddableGalleries = galleries.filter(allowsEmbedding)

  if (requestedPhotoKeys.length > 0) {
    const galleryById = new Map(embeddableGalleries.map((gallery) => [gallery.id, gallery]))
    const items = parsedPhotoKeys.flatMap(({ galleryId, photoId }) => {
      const gallery = galleryById.get(galleryId)
      const photo = gallery?.photos?.find((candidate) => candidate.id === photoId && isVisibleRenderableAsset(candidate))
      return gallery && photo ? [{ gallery, photo }] : []
    })
    return <EmbedPhotoGrid items={items} />
  }

  return (
    <main className="min-h-screen bg-black px-3 py-3 text-white">
      {embeddableGalleries.length > 0 ? (
        <PublicPortfolioGrid
          allowLocalOverrides={false}
          galleries={embeddableGalleries}
          visibilityMode="shareable"
        />
      ) : (
        <div className="flex min-h-[90vh] items-center justify-center px-6 text-center">
          <div>
            <p className="text-lg font-semibold">No portfolios are available in this embed.</p>
            <p className="mt-2 text-sm text-white/55">The photographer may have changed the selection.</p>
          </div>
        </div>
      )}
    </main>
  )
}
