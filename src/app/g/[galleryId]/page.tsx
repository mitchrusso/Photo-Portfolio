import { notFound } from "next/navigation"
import { PublicGalleryView } from "@/components/portfolio/public-gallery-view"
import { getPublicPortfolioGallery } from "@/lib/portfolio-persistence"

type PublicGalleryPageProps = {
  params: Promise<{
    galleryId: string
  }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PublicGalleryPageProps) {
  const { galleryId } = await params
  const gallery = await getPublicPortfolioGallery(galleryId)

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
  const { galleryId } = await params
  const gallery = await getPublicPortfolioGallery(galleryId)

  if (!gallery) notFound()

  return <PublicGalleryView gallery={gallery} />
}
