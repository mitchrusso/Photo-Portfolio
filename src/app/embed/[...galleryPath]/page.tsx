import { notFound } from "next/navigation"
import { EmbedGalleryView } from "@/components/portfolio/embed-gallery-view"
import { resolvePublicGallerySegments } from "@/lib/gallery-utils"
import { getPublicPortfolioGallery } from "@/lib/portfolio-persistence"

type EmbedGalleryPageProps = {
  params: Promise<{
    galleryPath: string[]
  }>
}

export const dynamic = "force-dynamic"

async function findGallery(params: EmbedGalleryPageProps["params"]) {
  const { galleryPath } = await params
  const route = resolvePublicGallerySegments(galleryPath)
  if (!route) return null

  return getPublicPortfolioGallery(route.gallerySlug, route.workspaceSlug)
}

export async function generateMetadata({ params }: EmbedGalleryPageProps) {
  const gallery = await findGallery(params)

  if (!gallery) {
    return {
      title: "Gallery embed not found | PhotoView.io",
    }
  }

  return {
    title: `${gallery.seoTitle || gallery.name} Embed | PhotoView.io`,
    description: gallery.seoDescription || gallery.description,
    robots: {
      index: false,
      follow: true,
    },
  }
}

export default async function EmbedGalleryPage({ params }: EmbedGalleryPageProps) {
  const gallery = await findGallery(params)
  if (!gallery) notFound()

  return <EmbedGalleryView gallery={gallery} />
}
