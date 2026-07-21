import { notFound } from "next/navigation"

import { PublicGalleryView } from "@/components/portfolio/public-gallery-view"
import { migratedGalleries } from "@/data/migrated-galleries"
import type { PortfolioGallery } from "@/lib/gallery-utils"

type DemoGalleryPageProps = {
  params: Promise<{
    galleryId: string
  }>
}

const galleries = migratedGalleries as PortfolioGallery[]

function findDemoGallery(galleryId: string) {
  return galleries.find((gallery) => gallery.id === galleryId)
}

export function generateStaticParams() {
  return galleries.map((gallery) => ({ galleryId: gallery.id }))
}

export async function generateMetadata({ params }: DemoGalleryPageProps) {
  const { galleryId } = await params
  const gallery = findDemoGallery(galleryId)

  if (!gallery) return { title: "Gallery not found | PhotoView.io" }

  return {
    description: gallery.description,
    title: `${gallery.name} | PhotoView.io`,
  }
}

export default async function DemoGalleryPage({ params }: DemoGalleryPageProps) {
  const { galleryId } = await params
  const gallery = findDemoGallery(galleryId)
  if (!gallery) notFound()

  return <PublicGalleryView demoMode gallery={gallery} galleryGridHref="/portfolio" />
}
