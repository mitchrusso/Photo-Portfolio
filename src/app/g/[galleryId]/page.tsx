import { notFound } from "next/navigation"
import { PublicGalleryView } from "@/components/portfolio/public-gallery-view"
import { migratedGalleries } from "@/data/migrated-galleries"
import type { PortfolioGallery } from "@/lib/gallery-utils"

type PublicGalleryPageProps = {
  params: Promise<{
    galleryId: string
  }>
}

export function generateStaticParams() {
  return migratedGalleries.map((gallery) => ({
    galleryId: gallery.id,
  }))
}

export async function generateMetadata({ params }: PublicGalleryPageProps) {
  const { galleryId } = await params
  const gallery = migratedGalleries.find((item) => item.id === galleryId)

  if (!gallery) {
    return {
      title: "Gallery not found | Photo-Portfolio",
    }
  }

  return {
    title: `${gallery.name} | Photo-Portfolio`,
    description: gallery.description,
  }
}

export default async function PublicGalleryPage({ params }: PublicGalleryPageProps) {
  const { galleryId } = await params
  const gallery = migratedGalleries.find((item) => item.id === galleryId)

  if (!gallery) notFound()

  return <PublicGalleryView gallery={gallery as PortfolioGallery} />
}
