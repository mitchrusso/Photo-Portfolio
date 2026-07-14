import Image from "next/image"

import {
  getThumbnailUrl,
  siteTemplatePresets,
  type PortfolioGallery,
  type PortfolioPhoto,
  type SiteSettings,
} from "@/lib/gallery-utils"

type Gallery = PortfolioGallery

export function TemplateGalleryPreview({
  gallery,
  photos,
  templateKey,
  template,
}: {
  gallery: Gallery
  photos: PortfolioPhoto[]
  template: typeof siteTemplatePresets[SiteSettings["siteTemplate"]]
  templateKey: SiteSettings["siteTemplate"]
}) {
  const previewImages = [gallery.cover, ...photos.slice(0, 10).map((photo) => getThumbnailUrl(photo))]
  const imageAt = (index: number) => previewImages[index % previewImages.length] ?? gallery.cover
  const isLight = template.publicBackground === "white"
  const frameClass = isLight ? "border-[#d7d0c4] bg-white text-[#1e211d]" : "border-white/10 bg-black text-white"
  const chromeClass = isLight ? "border-black/10 text-black/60" : "border-white/10 text-white/60"
  const labelClass = isLight ? "bg-white/88 text-black" : "bg-black/58 text-white"

  const renderTile = ({
    index,
    label = "Gallery",
    className = "aspect-[16/10]",
  }: {
    className?: string
    index: number
    label?: string
  }) => (
    <div className={`relative overflow-hidden border ${isLight ? "border-black/10" : "border-white/10"} ${template.tileShape === "soft" ? "rounded-md" : ""} ${className}`} key={`${label}-${index}`}>
      <Image alt={`${gallery.name} ${label}`} className="object-cover" fill sizes="360px" src={imageAt(index)} />
      {template.showGalleryLabels && (
        <div className={`absolute inset-x-0 bottom-0 px-2 py-1 text-[10px] font-semibold ${labelClass}`}>{label}</div>
      )}
    </div>
  )

  let previewBody

  if (templateKey === "wedding-story") {
    previewBody = (
      <div className="grid grid-cols-[1.05fr_0.95fr] gap-3 p-3">
        {renderTile({ className: "aspect-[4/5] rounded-lg", index: 0, label: "Ceremony" })}
        <div className="grid gap-3">
          {renderTile({ className: "aspect-[4/3] rounded-lg", index: 1, label: "Portraits" })}
          {renderTile({ className: "aspect-[4/3] rounded-lg", index: 2, label: "Reception" })}
        </div>
      </div>
    )
  } else if (templateKey === "portrait") {
    previewBody = (
      <div className="grid grid-cols-3 gap-3 p-3">
        {[0, 1, 2].map((item) => renderTile({ className: "aspect-[4/5] rounded-lg", index: item, label: "Session" }))}
      </div>
    )
  } else if (templateKey === "commercial") {
    previewBody = (
      <div className="grid grid-cols-2 gap-3 p-3">
        {[0, 1, 2, 3].map((item) => renderTile({ className: "aspect-[5/4]", index: item, label: "Project" }))}
      </div>
    )
  } else if (templateKey === "fine-art") {
    previewBody = (
      <div className="grid grid-cols-3 gap-4 p-4">
        {[0, 1, 2].map((item) => (
          <div className="border border-white/15 bg-[#050505] p-2" key={item}>
            {renderTile({ className: "aspect-[4/5]", index: item, label: "Edition" })}
          </div>
        ))}
      </div>
    )
  } else if (templateKey === "travel-journal") {
    previewBody = (
      <div className="grid gap-3 p-3">
        {renderTile({ className: "aspect-[16/7] rounded-md", index: 0, label: "Destination" })}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((item) => renderTile({ className: "aspect-[4/3] rounded-md", index: item, label: "Place" }))}
        </div>
      </div>
    )
  } else if (templateKey === "sports") {
    previewBody = (
      <div className="grid grid-cols-4 gap-2 p-3">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => renderTile({ className: "aspect-[4/3]", index: item, label: "Action" }))}
      </div>
    )
  } else if (templateKey === "real-estate") {
    previewBody = (
      <div className="grid gap-3 p-3">
        {renderTile({ className: "aspect-[16/7] rounded-md", index: 0, label: "Property" })}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((item) => renderTile({ className: "aspect-[16/9] rounded-md", index: item, label: "Room" }))}
        </div>
      </div>
    )
  } else if (templateKey === "black-white") {
    previewBody = (
      <div className="grid grid-cols-3 gap-3 p-3 grayscale">
        {[0, 1, 2, 3, 4, 5].map((item) => renderTile({ className: "aspect-[3/2]", index: item, label: "Mono" }))}
      </div>
    )
  } else if (templateKey === "masonry") {
    previewBody = (
      <div className="columns-3 gap-3 p-3">
        {["h-24", "h-36", "h-28", "h-44", "h-24", "h-32"].map((height, item) => (
          <div className={`relative mb-3 break-inside-avoid overflow-hidden rounded-md border ${isLight ? "border-black/10" : "border-white/10"} ${height}`} key={item}>
            <Image alt={`${gallery.name} masonry ${item + 1}`} className="object-cover" fill sizes="240px" src={imageAt(item)} />
          </div>
        ))}
      </div>
    )
  } else if (templateKey === "fullscreen") {
    previewBody = (
      <div className="p-3">
        {renderTile({ className: "aspect-[21/9]", index: 0, label: "Showcase" })}
      </div>
    )
  } else if (templateKey === "embedded") {
    previewBody = (
      <div className="grid grid-cols-[1fr_92px] gap-3 p-3">
        {renderTile({ className: "aspect-[16/9] rounded-md", index: 0, label: "Embed" })}
        <div className="grid gap-2">
          {[1, 2, 3].map((item) => renderTile({ className: "h-12 rounded-md", index: item, label: "" }))}
        </div>
      </div>
    )
  } else if (templateKey === "sidecar") {
    previewBody = (
      <div className="grid grid-cols-[88px_1fr] gap-3 p-3">
        <div className={`rounded-md p-3 ${isLight ? "bg-black/5" : "bg-white/10"}`}>
          <div className="mb-3 h-2 w-12 rounded-full bg-[#d8a84f]" />
          {[0, 1, 2, 3].map((item) => <div className={`mt-2 h-2 rounded-full ${isLight ? "bg-black/15" : "bg-white/20"}`} key={item} />)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((item) => renderTile({ className: "aspect-[16/10] rounded-md", index: item, label: "Folder" }))}
        </div>
      </div>
    )
  } else if (templateKey === "editorial") {
    previewBody = (
      <div className="grid grid-cols-3 gap-3 p-3">
        {[0, 1, 2].map((item) => renderTile({ className: "aspect-[4/5] rounded-md", index: item, label: "Series" }))}
      </div>
    )
  } else if (templateKey === "minimal") {
    previewBody = (
      <div className="grid grid-cols-4 gap-2 p-3">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => renderTile({ className: "aspect-square", index: item, label: "Art" }))}
      </div>
    )
  } else if (templateKey === "event") {
    previewBody = (
      <div className="grid grid-cols-3 gap-2 p-3">
        {[0, 1, 2, 3, 4, 5].map((item) => renderTile({ className: "aspect-[4/3] rounded-md", index: item, label: "Event" }))}
      </div>
    )
  } else {
    previewBody = (
      <div className="grid grid-cols-2 gap-3 p-3">
        {[0, 1, 2, 3].map((item) => renderTile({ className: "aspect-[16/9]", index: item, label: "Gallery" }))}
      </div>
    )
  }

  return (
    <div className={`overflow-hidden rounded-md border shadow-sm ${frameClass}`}>
      <div className={`flex items-center justify-between border-b px-4 py-3 text-xs ${chromeClass}`}>
        <span className="font-semibold">{template.label}</span>
        <span>{template.pageWidth === "full" ? "Edge-to-edge" : template.pageWidth}</span>
      </div>
      {previewBody}
      <div className={`border-t px-4 py-3 ${chromeClass}`}>
        <p className="text-sm font-semibold">{gallery.name}</p>
        <p className="mt-1 text-xs leading-5 opacity-80">{template.description}</p>
      </div>
    </div>
  )
}


