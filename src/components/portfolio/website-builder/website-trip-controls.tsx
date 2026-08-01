"use client"

import { Plus } from "lucide-react"

import type { WebsiteTripEntry } from "@/components/portfolio/portfolio-dashboard-model"
import type { PortfolioGallery } from "@/lib/gallery-utils"

const websitePlaceholderTripMeta = "Location or date"

type WebsiteTripControlsProps = {
  fieldClass: string
  galleries: PortfolioGallery[]
  isDark: boolean
  mutedTextClass: string
  onChange: (tripEntries: WebsiteTripEntry[]) => void
  tripEntries: WebsiteTripEntry[]
}

export function WebsiteTripControls({
  fieldClass,
  galleries,
  isDark,
  mutedTextClass,
  onChange,
  tripEntries,
}: WebsiteTripControlsProps) {
  const selectableGalleries = galleries.filter((gallery) => gallery.privacy !== "Client portal")
  const updateTrip = (tripId: string, patch: Partial<WebsiteTripEntry>) => {
    onChange(tripEntries.map((entry) => (entry.id === tripId ? { ...entry, ...patch } : entry)))
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
              <label className="grid gap-1 text-xs font-medium">
                Portfolio for this trip
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
                      {gallery.name}{gallery.privacy === "Password" ? " (password required)" : ""}
                    </option>
                  ))}
                </select>
                <span className={`text-[11px] font-normal leading-4 ${mutedTextClass}`}>
                  The button opens this exact portfolio. Client portals stay private and are not listed.
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
