import { notFound } from "next/navigation"
import { PublicGalleryView } from "@/components/portfolio/public-gallery-view"
import { resolvePublicGallerySegments } from "@/lib/gallery-utils"
import { getPublicPortfolioGallery } from "@/lib/portfolio-persistence"

type PublicGalleryPageProps = {
  params: Promise<{
    galleryPath: string[]
  }>
}

export const dynamic = "force-dynamic"

async function findGallery(params: PublicGalleryPageProps["params"]) {
  const { galleryPath } = await params
  const route = resolvePublicGallerySegments(galleryPath)
  if (!route) return null

  return getPublicPortfolioGallery(route.gallerySlug, route.workspaceSlug)
}

export async function generateMetadata({ params }: PublicGalleryPageProps) {
  const gallery = await findGallery(params)

  if (!gallery) {
    return {
      title: "Gallery not found | PhotoViewPro",
    }
  }

  const title = gallery.seoTitle || `${gallery.name} | PhotoViewPro`
  const description = gallery.seoDescription || gallery.description
  const socialImage = gallery.socialImageUrl || gallery.cover

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  }
}

export default async function PublicGalleryPage({ params }: PublicGalleryPageProps) {
  const gallery = await findGallery(params)
  if (!gallery) notFound()

  return <PublicGalleryView gallery={gallery} />
}
