"use client"

import { ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import {
  getMeteredDisplayUrl,
  getMeteredGalleryCoverUrl,
  getMeteredThumbnailUrl,
  publicGalleryPath,
  type PortfolioGallery,
  uniqueGalleryPhotos,
} from "@/lib/gallery-utils"

type EmbedGalleryViewProps = {
  gallery: PortfolioGallery
}

export function EmbedGalleryView({ gallery }: EmbedGalleryViewProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(-1)
  const activeGallery = gallery
  const photos = useMemo(
    () => uniqueGalleryPhotos(activeGallery.photos ?? [], activeGallery.cover, activeGallery.coverPhotoId),
    [activeGallery.cover, activeGallery.coverPhotoId, activeGallery.photos],
  )
  const activePhoto = photos[activePhotoIndex]
  const activeImageSource = getMeteredDisplayUrl(activeGallery.id, activePhoto) ?? getMeteredGalleryCoverUrl(activeGallery)

  if (!(activeGallery.embedEnabled ?? true)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
        <div>
          <p className="text-lg font-semibold">This gallery embed is turned off.</p>
          <p className="mt-2 text-sm text-white/55">Open PhotoView.io settings to enable website embeds.</p>
        </div>
      </main>
    )
  }

  if (activeGallery.privacy === "Client portal" || activeGallery.privacy === "Password") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
        <div>
          <p className="text-lg font-semibold">This gallery is not available for embedding.</p>
          <p className="mt-2 text-sm text-white/55">Publish a public or private-link gallery before using its embed code.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="flex min-h-[68vh] items-center justify-center px-3 py-4">
        <div className="relative h-[64vh] w-full">
          <Image
            alt={activePhoto?.title ?? `${activeGallery.name} cover`}
            className="object-contain"
            fill
            priority
            sizes="100vw"
            src={activeImageSource}
            unoptimized
          />
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{activeGallery.name}</p>
            <p className="text-xs text-white/50">
              {activePhotoIndex === -1 ? "Cover image" : `${activePhotoIndex + 1} of ${photos.length}`}
            </p>
          </div>
          <Link
            className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-white/15 px-3 text-xs font-semibold text-white"
            href={publicGalleryPath(activeGallery.id, activeGallery.workspaceSlug)}
            target="_blank"
          >
            <ExternalLink className="size-3.5" />
            Open
          </Link>
        </div>

        {photos.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              aria-label="Show cover image"
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-sm border ${
                activePhotoIndex === -1 ? "border-[#d8a84f]" : "border-white/10"
              }`}
              onClick={() => setActivePhotoIndex(-1)}
              type="button"
            >
              <Image alt={`${activeGallery.name} cover`} className="object-cover" fill sizes="96px" src={getMeteredGalleryCoverUrl(activeGallery)} unoptimized />
            </button>
            {photos.map((photo, index) => (
              <button
                aria-label={`Show ${photo.title}`}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-sm border ${
                  index === activePhotoIndex ? "border-[#d8a84f]" : "border-white/10"
                }`}
                key={photo.id}
                onClick={() => setActivePhotoIndex(index)}
                type="button"
              >
                <Image alt={photo.title} className="object-cover" fill sizes="96px" src={getMeteredThumbnailUrl(activeGallery.id, photo)} unoptimized />
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
