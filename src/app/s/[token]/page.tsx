import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { PublicGalleryView } from "@/components/portfolio/public-gallery-view"
import { PublicPortfolioGrid } from "@/components/portfolio/public-portfolio-grid"
import { galleryAccessCookieName, verifyGalleryAccessToken } from "@/lib/gallery-access"
import {
  getPublicWorkspacePortfolioGalleries,
  getSecureSharedPortfolioGallery,
} from "@/lib/portfolio-persistence"
import { createSecureShareToken, parseSecureShareToken, secureSharePath } from "@/lib/secure-share-links"

type SecureSharePageProps = { params: Promise<{ token: string }> }

export const dynamic = "force-dynamic"

async function resolveShare(params: SecureSharePageProps["params"]) {
  const { token } = await params
  const target = parseSecureShareToken(token)
  if (!target) return null
  if (target.type === "workspace") {
    const galleries = await getPublicWorkspacePortfolioGalleries(target.workspaceSlug)
    return galleries ? { galleries, kind: "workspace" as const, target, token } : null
  }
  const result = await getSecureSharedPortfolioGallery(
    target.workspaceSlug,
    target.gallerySlug,
    token,
    target.type === "photo" ? target.photoId : undefined,
  )
  return result ? { ...result, kind: "gallery" as const, target, token } : null
}

export async function generateMetadata({ params }: SecureSharePageProps): Promise<Metadata> {
  const share = await resolveShare(params)
  if (!share) return { title: "Shared portfolio not found | PhotoView.io" }
  if (share.kind === "workspace") {
    return {
      description: "A photography portfolio shared securely through PhotoView.io.",
      robots: { follow: false, index: false },
      title: "Shared photography portfolios | PhotoView.io",
    }
  }
  const passwordProtected = share.privacy === "PASSWORD"
  const title = `${share.gallery.name} | PhotoView.io`
  const description = share.gallery.seoDescription || share.gallery.description
  const socialImage = passwordProtected ? undefined : share.gallery.socialImageUrl || share.gallery.cover
  return {
    description,
    openGraph: { description, images: socialImage ? [socialImage] : [], title },
    robots: { follow: false, index: false },
    title,
    twitter: { card: "summary_large_image", description, images: socialImage ? [socialImage] : [], title },
  }
}

export default async function SecureSharePage({ params }: SecureSharePageProps) {
  const share = await resolveShare(params)
  if (!share) notFound()

  if (share.kind === "workspace") {
    return (
      <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-10">
        <header className="mx-auto max-w-[1600px] border-b border-white/10 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d8a84f]">PhotoView.io</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Photography portfolios</h1>
        </header>
        {share.galleries.length > 0 ? (
          <PublicPortfolioGrid allowLocalOverrides={false} galleries={share.galleries} visibilityMode="public" />
        ) : (
          <p className="mx-auto mt-12 max-w-[1600px] text-sm text-white/55">No portfolios are published yet.</p>
        )}
      </main>
    )
  }

  const cookieStore = await cookies()
  const initiallyUnlocked = share.privacy !== "PASSWORD" || verifyGalleryAccessToken(
    cookieStore.get(galleryAccessCookieName(share.galleryId))?.value,
    share.galleryId,
  )
  const gallery = initiallyUnlocked
    ? share.gallery
    : { ...share.gallery, cover: "", photos: [], socialImageUrl: undefined, watermarkImageUrl: undefined }
  const galleryGridHref = secureSharePath(createSecureShareToken({
    type: "workspace",
    workspaceSlug: share.target.workspaceSlug,
  }))

  return (
    <PublicGalleryView
      accessPath={`/api/secure-share/${encodeURIComponent(share.token)}/access`}
      gallery={gallery}
      galleryGridHref={galleryGridHref}
      initiallyUnlocked={initiallyUnlocked}
    />
  )
}
