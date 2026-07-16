import { notFound } from "next/navigation"
import { PublicGalleryView } from "@/components/portfolio/public-gallery-view"
import { resolvePublicGallerySegments } from "@/lib/gallery-utils"
import { getPublicPortfolioGallery } from "@/lib/portfolio-persistence"
import { getPublicSiteUrl } from "@/lib/site-domain"

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
      title: "Gallery not found | PhotoView.io",
    }
  }

  const title = gallery.seoTitle || `${gallery.name} | PhotoView.io`
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

  const publicSiteUrl = getPublicSiteUrl(gallery.websiteSubdomain || gallery.workspaceSlug || "")
  return <PublicGalleryView gallery={gallery} galleryGridHref={publicSiteUrl ? `${publicSiteUrl}/#portfolios` : "/"} />
}
