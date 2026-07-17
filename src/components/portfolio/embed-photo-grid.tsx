import { ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import {
  getMeteredDisplayUrl,
  publicGalleryPath,
  type PortfolioGallery,
  type PortfolioPhoto,
} from "@/lib/gallery-utils"

type EmbedPhotoGridProps = {
  items: Array<{
    gallery: PortfolioGallery
    photo: PortfolioPhoto
  }>
}

export function EmbedPhotoGrid({ items }: EmbedPhotoGridProps) {
  if (items.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
        <div>
          <p className="text-lg font-semibold">No photographs are available in this embed.</p>
          <p className="mt-2 text-sm text-white/55">The photographer may have changed the selection.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black p-3 text-white">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(({ gallery, photo }, index) => {
          const imageUrl = getMeteredDisplayUrl(gallery.id, photo)
          if (!imageUrl) return null

          return (
            <figure className="overflow-hidden rounded-sm border border-white/10 bg-white/5" key={`${gallery.id}:${photo.id}`}>
              <div className="relative aspect-[4/3] bg-black">
                <Image
                  alt={photo.title || gallery.name}
                  className="object-contain"
                  fill
                  priority={index === 0}
                  sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                  src={imageUrl}
                  unoptimized
                />
              </div>
              <figcaption className="flex items-center justify-between gap-3 border-t border-white/10 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{photo.caption || photo.title || gallery.name}</p>
                  <p className="truncate text-xs text-white/45">{gallery.name}</p>
                </div>
                <Link
                  aria-label={`Open ${gallery.name}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/15"
                  href={publicGalleryPath(gallery.id, gallery.workspaceSlug)}
                  target="_blank"
                >
                  <ExternalLink className="size-3.5" />
                </Link>
              </figcaption>
            </figure>
          )
        })}
      </div>
    </main>
  )
}
