"use client"

import Image from "next/image"

import type { WebsiteHomeSectionKey } from "@/lib/website-builder-rules"

export type WebsiteWorkDisplayMode = "slideshow" | "thumbnail-grid" | "full-frame-grid" | "film-strip" | "cover-cards"
export type WebsiteWorkSourceMode = "all" | "featured" | "single"

export type WebsitePortfolioContentSettings = {
  featuredGalleryIds: string[]
  filmStripGalleryId: string
  filmStripImageCount: number
  portfolioGridDisplayMode: WebsiteWorkDisplayMode
  selectedGalleryId: string
  workDisplayMode: WebsiteWorkDisplayMode
  workSourceMode: WebsiteWorkSourceMode
}

type GalleryOption = {
  cover: string
  id: string
  name: string
}

type WebsitePortfolioContentControlsProps = {
  activeBlock: WebsiteHomeSectionKey | null
  fieldClass: string
  galleries: GalleryOption[]
  isDark: boolean
  mutedTextClass: string
  onSelectDisplayMode: (displayMode: WebsiteWorkDisplayMode) => void
  onSelectGallery: (galleryId: string) => void
  onSelectWorkSource: (workSourceMode: WebsiteWorkSourceMode) => void
  onSetFilmStripGallery: (galleryId: string) => void
  onSetFilmStripImageCount: (imageCount: number) => void
  onToggleFeaturedGallery: (galleryId: string, selected: boolean) => void
  settings: WebsitePortfolioContentSettings
}

const workDisplayOptions: Array<{ key: WebsiteWorkDisplayMode; label: string; note: string }> = [
  { key: "slideshow", label: "Slideshow", note: "One strong image at a time" },
  { key: "thumbnail-grid", label: "Thumbnail grid", note: "Fast visual scanning" },
  { key: "full-frame-grid", label: "Full-frame grid", note: "Masonry grid with no forced crops" },
  { key: "film-strip", label: "Film strip", note: "Large image plus small previews" },
  { key: "cover-cards", label: "Cover cards", note: "Portfolio covers with titles" },
]

const workSourceOptions: Array<{ key: WebsiteWorkSourceMode; label: string; note: string }> = [
  { key: "featured", label: "Featured", note: "Only portfolios you choose" },
  { key: "single", label: "One selected portfolio", note: "Show photos from one portfolio" },
  { key: "all", label: "All portfolios", note: "Show everything visible" },
]

export function WebsitePortfolioContentControls({
  activeBlock,
  fieldClass,
  galleries,
  isDark,
  mutedTextClass,
  onSelectDisplayMode,
  onSelectGallery,
  onSelectWorkSource,
  onSetFilmStripGallery,
  onSetFilmStripImageCount,
  onToggleFeaturedGallery,
  settings,
}: WebsitePortfolioContentControlsProps) {
  if (activeBlock === "filmStrip") {
    return (
      <div
        className={`min-w-0 rounded-md border p-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"}`}
        data-website-editor-field="content"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">Film strip</p>
        <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
          Choose the portfolio used for this movable preview row. Every thumbnail keeps the photograph&apos;s full frame.
        </p>
        <label className="mt-3 grid gap-1 text-xs font-medium">
          Portfolio
          <select
            className={`h-10 w-full rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
            onChange={(event) => onSetFilmStripGallery(event.target.value)}
            value={settings.filmStripGalleryId}
          >
            {galleries.map((gallery) => (
              <option key={gallery.id} value={gallery.id}>{gallery.name}</option>
            ))}
          </select>
        </label>
        <label className="mt-3 grid gap-1 text-xs font-medium">
          Number of previews: {settings.filmStripImageCount}
          <input
            aria-label="Film strip preview count"
            max="16"
            min="3"
            onChange={(event) => {
              const imageCount = Number(event.currentTarget.value)
              onSetFilmStripImageCount(imageCount)
            }}
            type="range"
            value={settings.filmStripImageCount}
          />
        </label>
      </div>
    )
  }

  if (activeBlock !== "featuredPortfolio" && activeBlock !== "portfolioGrid") return null

  const displayMode = activeBlock === "portfolioGrid"
    ? settings.portfolioGridDisplayMode
    : settings.workDisplayMode
  const selectedFeaturedCount = settings.featuredGalleryIds.filter(
    (galleryId) => galleries.some((gallery) => gallery.id === galleryId),
  ).length

  return (
    <>
      <div
        className={`min-w-0 max-w-full overflow-hidden rounded-md border p-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"}`}
        data-website-editor-field="content"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">What to show</p>
        <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
          Choose the work source and presentation for this section. One selected portfolio shows its visible photos in the order you arranged them. Changing a control also turns this section on so the result appears immediately in Live Canvas.
        </p>
        <div className="mt-3 grid gap-2">
          {workSourceOptions.map((option) => (
            <button
              aria-pressed={settings.workSourceMode === option.key}
              className={`min-w-0 rounded-md border px-3 py-2 text-left text-xs ${
                settings.workSourceMode === option.key
                  ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]"
                  : isDark
                    ? "border-white/10 bg-white/[0.04]"
                    : "border-[#ded8cc] bg-white"
              }`}
              key={option.key}
              onClick={() => onSelectWorkSource(option.key)}
              type="button"
            >
              <span className="block font-semibold">{option.label}</span>
              <span className="mt-1 block leading-4 opacity-60">{option.note}</span>
            </button>
          ))}
        </div>

        {settings.workSourceMode === "single" ? (
          <label className="mt-3 grid min-w-0 gap-1 text-xs font-medium">
            Portfolio
            <span className="block min-w-0 max-w-full overflow-hidden">
              <select
                className={`box-border block h-10 w-full min-w-0 max-w-full truncate rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                onChange={(event) => onSelectGallery(event.target.value)}
                value={settings.selectedGalleryId}
              >
                {galleries.map((gallery) => (
                  <option key={gallery.id} value={gallery.id}>
                    {gallery.name}
                  </option>
                ))}
              </select>
            </span>
          </label>
        ) : null}

        <p className={`mt-4 text-xs font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Display as</p>
        <div className="mt-2 grid gap-2">
          {workDisplayOptions.map((option) => (
            <button
              aria-pressed={displayMode === option.key}
              className={`rounded-md border px-3 py-2 text-left text-xs ${
                displayMode === option.key
                  ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]"
                  : isDark
                    ? "border-white/10 bg-white/[0.04]"
                    : "border-[#ded8cc] bg-white"
              }`}
              key={option.key}
              onClick={() => onSelectDisplayMode(option.key)}
              type="button"
            >
              <span className="block font-semibold">{option.label}</span>
              <span className="mt-1 block opacity-60">{option.note}</span>
            </button>
          ))}
        </div>
      </div>

      {settings.workSourceMode === "featured" ? (
        <div className="space-y-2">
          <p className={`text-xs leading-5 ${mutedTextClass}`}>
            Choose the portfolios to include in this featured selection.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Pick featured portfolios</p>
              <span className={`shrink-0 text-[11px] ${mutedTextClass}`}>
                {selectedFeaturedCount} selected
              </span>
            </div>
            <div className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">
              {galleries.map((gallery) => {
                const selected = settings.featuredGalleryIds.includes(gallery.id)

                return (
                  <label
                    className={`flex min-w-0 items-center gap-3 rounded-md border p-2 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}
                    key={gallery.id}
                  >
                    <input
                      checked={selected}
                      className="size-4 shrink-0 accent-[#d8a84f]"
                      onChange={(event) => onToggleFeaturedGallery(gallery.id, event.target.checked)}
                      type="checkbox"
                    />
                    <span className="relative size-11 shrink-0 overflow-hidden rounded bg-black/10">
                      <Image alt="" className="object-cover" fill sizes="44px" src={gallery.cover} />
                    </span>
                    <span className="min-w-0 truncate text-sm font-semibold">{gallery.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
