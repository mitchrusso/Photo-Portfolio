"use client"

import { ChevronLeft, ChevronRight, Download, Lock, Star } from "lucide-react"
import Image from "next/image"
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import {
  getDisplayUrl,
  getThumbnailUrl,
  LOCAL_GALLERY_STORAGE_KEY,
  normalizeAssetUrl,
  photoMatchesCover,
  type PortfolioGallery,
  uniqueGalleryPhotos,
} from "@/lib/gallery-utils"

type PublicGalleryViewProps = {
  gallery: PortfolioGallery
}

export function PublicGalleryView({ gallery }: PublicGalleryViewProps) {
  const [localGallery, setLocalGallery] = useState(gallery)
  const [activePhotoIndex, setActivePhotoIndex] = useState(-1)
  const [passwordInput, setPasswordInput] = useState("")
  const [unlockedGalleryId, setUnlockedGalleryId] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const activeGallery = localGallery
  const photos = useMemo(() => uniqueGalleryPhotos(activeGallery.photos ?? [], activeGallery.cover), [activeGallery.cover, activeGallery.photos])
  const activePhoto = photos[activePhotoIndex]
  const activeImageSource = getDisplayUrl(activePhoto) ?? activeGallery.cover
  const isCover = normalizeAssetUrl(activeImageSource) === normalizeAssetUrl(activeGallery.cover)
  const itemCount = photos.length + 1
  const allowDownloads = activeGallery.allowDownloads ?? true
  const watermarkEnabled = activeGallery.watermarkEnabled ?? false
  const isUnlocked = activeGallery.privacy !== "Password" || unlockedGalleryId === activeGallery.id

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCAL_GALLERY_STORAGE_KEY)
      if (!saved) return

      const parsed = JSON.parse(saved) as PortfolioGallery[]
      const savedGallery = Array.isArray(parsed) ? parsed.find((item) => item.id === gallery.id) : undefined
      if (savedGallery) {
        queueMicrotask(() => setLocalGallery(savedGallery))
      }
    } catch {
      return
    }
  }, [gallery.id])

  const showPreviousPhoto = useCallback(() => {
    setActivePhotoIndex((current) => {
      if (current === -1) return photos.length - 1
      if (current === 0) return -1
      return current - 1
    })
  }, [photos.length])

  const showNextPhoto = useCallback(() => {
    setActivePhotoIndex((current) => {
      if (current === -1) return photos.length > 0 ? 0 : -1
      if (current >= photos.length - 1) return -1
      return current + 1
    })
  }, [photos.length])

  function unlockGallery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const expectedPassword = activeGallery.password?.trim()

    if (!expectedPassword || passwordInput.trim() === expectedPassword) {
      setUnlockedGalleryId(activeGallery.id)
      setPasswordError(false)
      return
    }

    setPasswordError(true)
  }

  function handleViewerTouchEnd(endX: number) {
    if (touchStartX === null) return

    const distance = endX - touchStartX
    setTouchStartX(null)

    if (Math.abs(distance) < 45) return
    if (distance > 0) {
      showPreviousPhoto()
    } else {
      showNextPhoto()
    }
  }

  if (activeGallery.status === "Draft" || activeGallery.privacy === "Client portal") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <div className="max-w-md text-center">
          <Lock className="mx-auto size-9 text-[#d8a84f]" />
          <h1 className="mt-4 text-2xl font-semibold">Gallery unavailable</h1>
          <p className="mt-2 text-sm text-white/60">This gallery is not published for public viewing.</p>
        </div>
      </main>
    )
  }

  if (!isUnlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <form className="w-full max-w-sm rounded-md border border-white/15 bg-white/5 p-5" onSubmit={unlockGallery}>
          <Lock className="size-7 text-[#d8a84f]" />
          <h1 className="mt-4 text-xl font-semibold">{activeGallery.name}</h1>
          <p className="mt-1 text-sm text-white/60">Enter the gallery password.</p>
          <input
            className="mt-4 h-11 w-full rounded-md border border-white/15 bg-black px-3 text-sm text-white outline-none focus:border-[#d8a84f]"
            onChange={(event) => setPasswordInput(event.target.value)}
            type="password"
            value={passwordInput}
          />
          {passwordError && <p className="mt-2 text-xs text-red-300">That password did not match.</p>}
          <button className="mt-4 h-10 w-full rounded-md bg-[#d8a84f] text-sm font-semibold text-[#171814]" type="submit">
            Open gallery
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-5 py-4 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{activeGallery.name}</h1>
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/60">{activeGallery.privacy}</span>
            </div>
            <p className="mt-1 text-sm text-white/60">{activeGallery.description}</p>
          </div>
          {allowDownloads && (
            <a
              className="flex h-10 items-center justify-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-black"
              href={activePhoto?.downloadUrl ?? activePhoto?.blobUrl ?? activeGallery.cover}
              rel="noreferrer"
              target="_blank"
            >
              <Download className="size-4" />
              Download
            </a>
          )}
        </div>
      </header>

      <section
        className="relative flex min-h-[68vh] touch-pan-y items-center justify-center border-b border-white/10 px-4 py-5"
        onTouchEnd={(event) => handleViewerTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
        onTouchStart={(event) => setTouchStartX(event.changedTouches[0]?.clientX ?? null)}
      >
        {itemCount > 1 && (
          <button
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white"
            onClick={showPreviousPhoto}
            type="button"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        <div className="relative h-[62vh] w-full max-w-6xl">
          <Image
            alt={activePhoto?.title ?? `${activeGallery.name} cover`}
            className="object-contain"
            fill
            priority
            sizes="100vw"
            src={activeImageSource}
          />
          {isCover && (
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-[#f4d47e] bg-[#d8a84f] px-3 py-1 text-xs font-semibold text-[#171814] shadow-lg">
              <Star className="size-3.5 fill-current" />
              Cover
            </div>
          )}
          {watermarkEnabled && (
            <div className="pointer-events-none absolute bottom-5 right-5 rounded-sm bg-black/35 px-3 py-2 text-sm font-semibold tracking-wide text-white/55">
              {activeGallery.client}
            </div>
          )}
        </div>
        {itemCount > 1 && (
          <button
            aria-label="Next photo"
            className="absolute right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white"
            onClick={showNextPhoto}
            type="button"
          >
            <ChevronRight className="size-5" />
          </button>
        )}
      </section>

      <section className="px-5 py-4 md:px-8">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-lg font-semibold">{activeGallery.client}</p>
            <p className="text-sm text-white/55">
              {activePhotoIndex === -1 ? `Cover image, ${photos.length.toLocaleString()} photos` : `${activePhotoIndex + 1} of ${photos.length.toLocaleString()} photos`}
            </p>
          </div>
          <p className="text-sm text-white/45">{activePhoto?.caption ?? activePhoto?.title ?? ""}</p>
        </div>
        {photos.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {photos.map((photo, index) => (
              <button
                aria-label={`Show ${photo.title}`}
                className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-md border ${
                  index === activePhotoIndex ? "border-[#d8a84f] ring-2 ring-[#d8a84f]/45" : "border-white/10"
                }`}
                key={photo.id}
                onClick={() => setActivePhotoIndex(index)}
                type="button"
              >
                <Image alt={photo.title} className="object-contain" fill sizes="112px" src={getThumbnailUrl(photo)} />
                {photoMatchesCover(photo, activeGallery.cover) && (
                  <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full border border-[#f4d47e] bg-[#d8a84f] text-[#171814] shadow-md">
                    <Star className="size-3.5 fill-current" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
