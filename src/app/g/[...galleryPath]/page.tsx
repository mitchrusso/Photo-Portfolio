import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { PublicGalleryView } from "@/components/portfolio/public-gallery-view"
import {
  galleryAccessCookieName,
  portfolioGroupAccessCookieName,
  verifyGalleryAccessToken,
  verifyPortfolioGroupAccessToken,
} from "@/lib/gallery-access"
import { publicPortfolioPath, resolvePublicGallerySegments } from "@/lib/gallery-utils"
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

  return getPublicPortfolioGallery(route.gallerySlug, route.workspaceSlug, { includeProtectedGroup: true })
}

export async function generateMetadata({ params }: PublicGalleryPageProps) {
  const gallery = await findGallery(params)

  if (!gallery) {
    return {
      title: "Gallery not found | PhotoView.io",
    }
  }

  const title = gallery.seoTitle || `${gallery.name} | PhotoView.io`
  const passwordProtected = gallery.privacy === "Password" || Boolean(gallery.parentGalleryProtection)
  const description = passwordProtected
    ? "A protected photography Portfolio shared through PhotoView.io."
    : gallery.seoDescription || gallery.description
  const socialImage = passwordProtected ? undefined : gallery.socialImageUrl || gallery.cover

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: socialImage ? [socialImage] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: socialImage ? [socialImage] : [],
    },
  }
}

export default async function PublicGalleryPage({ params }: PublicGalleryPageProps) {
  const gallery = await findGallery(params)
  if (!gallery) notFound()
  const cookieStore = await cookies()
  const parentProtection = gallery.parentGalleryProtection
  const galleryUnlocked = !parentProtection || verifyPortfolioGroupAccessToken(
    cookieStore.get(portfolioGroupAccessCookieName(parentProtection.id))?.value,
    parentProtection.id,
  )
  const portfolioUnlocked = gallery.privacy !== "Password" || Boolean(
    gallery.accessId &&
    verifyGalleryAccessToken(
      cookieStore.get(galleryAccessCookieName(gallery.accessId))?.value,
      gallery.accessId,
    ),
  )
  const protectedGallery = galleryUnlocked && portfolioUnlocked
    ? gallery
    : { ...gallery, cover: "", photos: [], socialImageUrl: undefined, watermarkImageUrl: undefined }

  return (
    <PublicGalleryView
      gallery={protectedGallery}
      galleryGridHref={publicPortfolioPath(gallery.workspaceSlug)}
      initialAccess={{ galleryUnlocked, portfolioUnlocked }}
    />
  )
}
