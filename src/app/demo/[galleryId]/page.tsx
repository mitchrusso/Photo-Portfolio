import { notFound } from "next/navigation"
import { PublicGalleryView } from "@/components/portfolio/public-gallery-view"
import { migratedGalleries } from "@/data/migrated-galleries"
import type { PortfolioGallery } from "@/lib/gallery-utils"

type DemoGalleryPageProps = {
  params: Promise<{
    galleryId: string
  }>
}

const demoGalleryIds = new Set(["sloss-furnaces", "myanmar", "lofoten-norway"])

async function findDemoGallery(params: DemoGalleryPageProps["params"]) {
  const { galleryId } = await params
  if (!demoGalleryIds.has(galleryId)) return null
  return migratedGalleries.find((gallery) => gallery.id === galleryId) ?? null
}

export async function generateMetadata({ params }: DemoGalleryPageProps) {
  const gallery = await findDemoGallery(params)

  return gallery
    ? {
        title: `${gallery.name} Demo | PhotoView.io`,
        description: `Experience the ${gallery.name} portfolio in PhotoView.io.`,
      }
    : {
        title: "Demo not found | PhotoView.io",
      }
}

export default async function DemoGalleryPage({ params }: DemoGalleryPageProps) {
  const gallery = await findDemoGallery(params)
  if (!gallery) notFound()

  return <PublicGalleryView demoMode gallery={gallery as PortfolioGallery} galleryGridHref="/demo" />
}
