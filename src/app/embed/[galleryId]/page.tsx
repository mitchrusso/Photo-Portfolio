import { notFound } from "next/navigation"
import { EmbedGalleryView } from "@/components/portfolio/embed-gallery-view"
import { getPublicPortfolioGallery } from "@/lib/portfolio-persistence"

type EmbedGalleryPageProps = {
  params: Promise<{
    galleryId: string
  }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: EmbedGalleryPageProps) {
  const { galleryId } = await params
  const gallery = await getPublicPortfolioGallery(galleryId)

  if (!gallery) {
    return {
      title: "Gallery embed not found | PhotoViewPro",
    }
  }

  return {
    title: `${gallery.seoTitle || gallery.name} Embed | PhotoViewPro`,
    description: gallery.seoDescription || gallery.description,
    robots: {
      index: false,
      follow: true,
    },
  }
}

export default async function EmbedGalleryPage({ params }: EmbedGalleryPageProps) {
  const { galleryId } = await params
  const gallery = await getPublicPortfolioGallery(galleryId)

  if (!gallery) notFound()

  return <EmbedGalleryView gallery={gallery} />
}
