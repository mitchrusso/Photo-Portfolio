import { notFound } from "next/navigation"
import { EmbedGalleryView } from "@/components/portfolio/embed-gallery-view"
import { migratedGalleries } from "@/data/migrated-galleries"
import type { PortfolioGallery } from "@/lib/gallery-utils"

type EmbedGalleryPageProps = {
  params: Promise<{
    galleryId: string
  }>
}

export function generateStaticParams() {
  return migratedGalleries.map((gallery) => ({
    galleryId: gallery.id,
  }))
}

export async function generateMetadata({ params }: EmbedGalleryPageProps) {
  const { galleryId } = await params
  const gallery = migratedGalleries.find((item) => item.id === galleryId) as PortfolioGallery | undefined

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
  const gallery = migratedGalleries.find((item) => item.id === galleryId)

  if (!gallery) notFound()

  return <EmbedGalleryView gallery={gallery as PortfolioGallery} />
}
