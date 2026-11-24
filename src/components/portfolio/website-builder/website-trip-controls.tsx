"use client"

import { ImagePlus, Plus, X } from "lucide-react"
import Image from "next/image"
import { useMemo, useState } from "react"

import type { WebsiteTripEntry } from "@/components/portfolio/portfolio-dashboard-model"
import type { PortfolioGallery } from "@/lib/gallery-utils"

const websitePlaceholderTripMeta = "Location or date"

type WebsiteTripControlsProps = {
  fieldClass: string
  galleries: PortfolioGallery[]
  isDark: boolean
  libraryItems: WebsiteTripLibraryItem[]
  mutedTextClass: string
  onChange: (tripEntries: WebsiteTripEntry[]) => void
  tripEntries: WebsiteTripEntry[]
}

export type WebsiteTripLibraryItem = {
  galleryId: string
  galleryName: string
  key: string
  photoId: string
  source: string
  title: string
}

export function WebsiteTripControls({
  fieldClass,
  galleries,
  isDark,
  libraryItems,
  mutedTextClass,
  onChange,
  tripEntries,
}: WebsiteTripControlsProps) {
  const [photoPickerTripId, setPhotoPickerTripId] = useState("")
  const [photoQuery, setPhotoQuery] = useState("")
  const selectableGalleries = galleries.filter((gallery) => gallery.privacy === "Public")
  const filteredLibraryItems = useMemo(() => {
    const query = photoQuery.trim().toLowerCase()
    if (!query) return libraryItems.slice(0, 80)

    return libraryItems
      .filter((item) => [item.title, item.galleryName].some((value) => value.toLowerCase().includes(query)))
      .slice(0, 80)
  }, [libraryItems, photoQuery])
  const updateTrip = (tripId: string, patch: Partial<WebsiteTripEntry>) => {
    onChange(tripEntries.map((entry) => (entry.id === tripId ? { ...entry, ...patch } : entry)))
  }

  const chooseLibraryPhoto = (tripId: string, item: WebsiteTripLibraryItem) => {
    updateTrip(tripId, {
      imageAlt: item.title,
      imageCaption: "",
      imageGalleryId: item.galleryId,
      imagePhotoId: item.photoId,
      imageUrl: item.source,
    })
    setPhotoPickerTripId("")
    setPhotoQuery("")
  }

  const removeLibraryPhoto = (tripId: string) => {
    updateTrip(tripId, {
      imageAlt: "",
      imageCaption: "",
      imageGalleryId: "",
      imagePhotoId: "",
      imageUrl: "",
    })
  }

  return (
    <div className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]">Trip entries</p>
          <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>Add, edit, and remove the stories shown in this section.</p>
        </div>
        <button
          className="flex h-9 shrink-0 items-center gap-2 rounded-md bg-[#1f2a24] px-3 text-xs font-semibold text-white"
          onClick={() =>
            onChange([
              ...tripEntries,
              {
                body: "Write a short story, field note, or travel update for this trip.",
                galleryId: "",
                id: `trip-${Date.now()}`,
                linkLabel: "View portfolio",
                linkUrl: "",
                meta: "",
                title: "New trip",
              },
            ])
          }
          type="button"
        >
          <Plus className="size-3.5" />
          Add
        </button>
      </div>
      <div className="mt-3 max-h-[36rem] space-y-3 overflow-y-auto pr-1">
        {tripEntries.map((trip, tripIndex) => (
          <div className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-black/20" : "border-[#ded8cc] bg-white"}`} key={trip.id}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold">Trip {tripIndex + 1}</p>
              <button
                className="text-xs font-semibold text-[#a43b2f]"
                onClick={() => onChange(tripEntries.filter((entry) => entry.id !== trip.id))}
                type="button"
              >
                Remove
              </button>
            </div>
            <div className="mt-3 grid gap-2">
              <input
                aria-label={`Trip ${tripIndex + 1} title`}
                className={`h-10 rounded-md border px-3 text-sm outline-none ${fieldClass}`}
                onChange={(event) => updateTrip(trip.id, { title: event.target.value })}
                placeholder="Trip title"
                value={trip.title}
              />
              <input
                aria-label={`Trip ${tripIndex + 1} location or date`}
                className={`h-10 rounded-md border px-3 text-sm outline-none ${fieldClass}`}
                onChange={(event) => updateTrip(trip.id, { meta: event.target.value })}
                placeholder={websitePlaceholderTripMeta}
                value={trip.meta.trim() === websitePlaceholderTripMeta ? "" : trip.meta}
              />
              <textarea
                aria-label={`Trip ${tripIndex + 1} story`}
                className={`min-h-24 resize-y rounded-md border px-3 py-2 text-sm leading-6 outline-none ${fieldClass}`}
                onChange={(event) => updateTrip(trip.id, { body: event.target.value })}
                value={trip.body}
              />
              <div className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-[#ded8cc] bg-[#fbfaf7]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold">Optional Library photo</p>
                    <p className={`mt-1 text-[11px] leading-4 ${mutedTextClass}`}>
                      Shown only in this blog entry. It is not added to a portfolio or the Gallery grid.
                    </p>
                  </div>
                  <button
                    className={`flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-xs font-semibold ${isDark ? "border-white/10" : "border-[#ded8cc] bg-white"}`}
                    onClick={() => {
                      setPhotoQuery("")
                      setPhotoPickerTripId((current) => current === trip.id ? "" : trip.id)
                    }}
                    type="button"
                  >
                    <ImagePlus className="size-3.5" />
                    {trip.imagePhotoId ? "Replace" : "Choose photo"}
                  </button>
                </div>

                {trip.imageUrl ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-[9rem_1fr]">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-black">
                      <Image
                        alt={trip.imageAlt || trip.title}
                        className="object-cover"
                        fill
                        sizes="144px"
                        src={trip.imageUrl}
                      />
                    </div>
                    <div className="grid content-start gap-2">
                      <input
                        aria-label={`Trip ${tripIndex + 1} photo alternative text`}
                        className={`h-10 rounded-md border px-3 text-sm outline-none ${fieldClass}`}
                        onChange={(event) => updateTrip(trip.id, { imageAlt: event.target.value })}
                        placeholder="Describe the photo for accessibility"
                        value={trip.imageAlt ?? ""}
                      />
                      <input
                        aria-label={`Trip ${tripIndex + 1} photo caption`}
                        className={`h-10 rounded-md border px-3 text-sm outline-none ${fieldClass}`}
                        onChange={(event) => updateTrip(trip.id, { imageCaption: event.target.value })}
                        placeholder="Optional caption"
                        value={trip.imageCaption ?? ""}
                      />
                      <button
                        className="flex h-9 items-center justify-center gap-2 rounded-md border border-[#d9a29d] text-xs font-semibold text-[#9f1f17]"
                        onClick={() => removeLibraryPhoto(trip.id)}
                        type="button"
                      >
                        <X className="size-3.5" />
                        Remove photo
                      </button>
                    </div>
                  </div>
                ) : null}

                {photoPickerTripId === trip.id ? (
                  <div className={`mt-3 rounded-md border p-3 ${isDark ? "border-white/10 bg-black/20" : "border-[#ded8cc] bg-white"}`}>
                    <label className="grid gap-1 text-xs font-medium">
                      Search your Library
                      <input
                        className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                        onChange={(event) => setPhotoQuery(event.target.value)}
                        placeholder="Search by photo or portfolio name"
                        value={photoQuery}
                      />
                    </label>
                    <div className="mt-3 grid max-h-[28rem] grid-cols-2 gap-2 overflow-y-auto pr-1">
                      {filteredLibraryItems.map((item) => (
                        <button
                          aria-label={`Use ${item.title} in trip ${tripIndex + 1}`}
                          className={`group relative aspect-[4/3] overflow-hidden rounded-md border bg-black ${isDark ? "border-white/10" : "border-[#ded8cc]"}`}
                          key={item.key}
                          onClick={() => chooseLibraryPhoto(trip.id, item)}
                          type="button"
                        >
                          <Image alt={item.title} className="object-cover" fill sizes="150px" src={item.source} />
                          <span className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1.5 text-left text-[11px] font-semibold text-white">
                            <span className="block truncate">{item.title}</span>
                            <span className="block truncate font-normal text-white/70">{item.galleryName}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                    {filteredLibraryItems.length === 0 ? (
                      <p className={`mt-3 text-xs ${mutedTextClass}`}>No visible Library photos match that search.</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <label className="grid gap-1 text-xs font-medium">
                Portfolio for this trip (optional)
                <select
                  aria-label={`Trip ${tripIndex + 1} associated portfolio`}
                  className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                  onChange={(event) => {
                    const galleryId = event.target.value
                    updateTrip(trip.id, {
                      galleryId,
                      linkLabel: galleryId && !trip.linkLabel.trim() ? "View portfolio" : trip.linkLabel,
                    })
                  }}
                  value={trip.galleryId ?? ""}
                >
                  <option value="">No portfolio selected</option>
                  {selectableGalleries.map((gallery) => (
                    <option key={gallery.id} value={gallery.id}>
                      {gallery.name}
                    </option>
                  ))}
                </select>
                <span className={`text-[11px] font-normal leading-4 ${mutedTextClass}`}>
                  Add a public portfolio button to this entry. This is independent of the Library photo above; you may use either option or both.
                </span>
              </label>
              <div className={`grid gap-2 ${trip.galleryId ? "" : "sm:grid-cols-2 xl:grid-cols-1"}`}>
                <input
                  aria-label={`Trip ${tripIndex + 1} link label`}
                  className={`h-10 rounded-md border px-3 text-sm outline-none ${fieldClass}`}
                  onChange={(event) => updateTrip(trip.id, { linkLabel: event.target.value })}
                  placeholder="Link label"
                  value={trip.linkLabel}
                />
                {!trip.galleryId ? (
                  <input
                    aria-label={`Trip ${tripIndex + 1} optional custom link URL`}
                    className={`h-10 rounded-md border px-3 text-sm outline-none ${fieldClass}`}
                    onChange={(event) => updateTrip(trip.id, { linkUrl: event.target.value })}
                    placeholder="Optional custom link: https://..."
                    value={trip.linkUrl}
                  />
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
