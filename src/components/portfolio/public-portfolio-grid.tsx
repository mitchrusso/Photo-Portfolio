"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  LOCAL_GALLERY_STORAGE_KEY,
  publicGalleryPath,
  type PortfolioGallery,
} from "@/lib/gallery-utils"

type PublicPortfolioGridProps = {
  galleries: PortfolioGallery[]
}

export function PublicPortfolioGrid({ galleries }: PublicPortfolioGridProps) {
  const [visibleGalleries, setVisibleGalleries] = useState(galleries)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCAL_GALLERY_STORAGE_KEY)
      if (!saved) return

      const parsed = JSON.parse(saved) as PortfolioGallery[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        queueMicrotask(() => setVisibleGalleries(parsed))
      }
    } catch {
      return
    }
  }, [])

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {visibleGalleries.map((gallery) => (
        <Link
          className="group relative aspect-[16/10] overflow-hidden rounded-sm border border-white/10"
          href={publicGalleryPath(gallery.id)}
          key={gallery.id}
        >
          <Image
            alt={`${gallery.name} cover`}
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            fill
            sizes="(min-width: 1280px) 25vw, 90vw"
            src={gallery.cover}
          />
          <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2">
            <p className="text-sm font-semibold">{gallery.name}</p>
            <p className="text-xs text-white/55">{gallery.images} images</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
