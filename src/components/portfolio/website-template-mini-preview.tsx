import type { WebsiteTemplate } from "@/lib/website-builder-rules"

type WebsiteTemplatePreviewLayout = "center" | "gallery" | "magazine" | "panorama" | "portrait" | "poster" | "sidecar" | "split"

const websiteTemplatePreviewDesigns: Record<WebsiteTemplate, {
  accent: string
  background: string
  image: string
  layout: WebsiteTemplatePreviewLayout
  muted: string
  text: string
  title: string
}> = {
  "adventure-map": {
    accent: "bg-[#d87934]",
    background: "bg-[#f4efe2] text-[#1f261f]",
    image: "bg-gradient-to-br from-[#49736d] via-[#d4a151] to-[#293f35]",
    layout: "sidecar",
    muted: "bg-[#1f261f]/25",
    text: "font-mono uppercase",
    title: "tracking-[0.14em]",
  },
  "article-first": {
    accent: "bg-[#0f5f73]",
    background: "bg-[#f8f5ef] text-[#141414]",
    image: "bg-gradient-to-br from-[#d7e4e8] via-[#9fb6bd] to-[#29373d]",
    layout: "magazine",
    muted: "bg-black/18",
    text: "font-serif",
    title: "text-[18px]",
  },
  "about-first": {
    accent: "bg-[#a87844]",
    background: "bg-[#f2e8da] text-[#27211b]",
    image: "bg-gradient-to-br from-[#b88b62] via-[#e1c9aa] to-[#71533f]",
    layout: "portrait",
    muted: "bg-[#27211b]/22",
    text: "font-serif",
    title: "text-[15px]",
  },
  "bold-color": {
    accent: "bg-[#ffcf33]",
    background: "bg-[#1436d8] text-white",
    image: "bg-gradient-to-br from-[#ff6a3d] via-[#ffd33d] to-[#1bd1a5]",
    layout: "poster",
    muted: "bg-white/28",
    text: "font-sans uppercase",
    title: "text-[20px] font-black",
  },
  "botanical-soft": {
    accent: "bg-[#6d8f61]",
    background: "bg-[#eef2e4] text-[#25301f]",
    image: "bg-gradient-to-br from-[#dfe8c7] via-[#8fa66f] to-[#36472f]",
    layout: "split",
    muted: "bg-[#25301f]/22",
    text: "font-serif",
    title: "text-[16px]",
  },
  "cinematic-home": {
    accent: "bg-[#d8a84f]",
    background: "bg-[#101210] text-white",
    image: "bg-gradient-to-br from-[#e0b45a] via-[#476b75] to-[#101312]",
    layout: "poster",
    muted: "bg-white/24",
    text: "font-sans",
    title: "text-[18px]",
  },
  "clean-grid": {
    accent: "bg-[#222]",
    background: "bg-white text-[#171814]",
    image: "bg-gradient-to-br from-[#edf2f5] via-[#b7c4c8] to-[#354044]",
    layout: "gallery",
    muted: "bg-black/18",
    text: "font-sans",
    title: "text-[13px]",
  },
  "coastal-clean": {
    accent: "bg-[#4795bd]",
    background: "bg-[#edf7fb] text-[#14303f]",
    image: "bg-gradient-to-br from-[#e8fbff] via-[#6fb7d2] to-[#11445a]",
    layout: "panorama",
    muted: "bg-[#14303f]/20",
    text: "font-sans",
    title: "text-[14px]",
  },
  "creator-studio": {
    accent: "bg-[#d8a84f]",
    background: "bg-[#f7f1e4] text-[#211b13]",
    image: "bg-gradient-to-br from-[#d8a84f] via-[#8d6e44] to-[#252018]",
    layout: "portrait",
    muted: "bg-[#211b13]/24",
    text: "font-sans",
    title: "text-[15px]",
  },
  darkroom: {
    accent: "bg-[#bf8a35]",
    background: "bg-black text-white",
    image: "bg-gradient-to-br from-[#1b2730] via-[#73431f] to-black",
    layout: "sidecar",
    muted: "bg-white/22",
    text: "font-serif",
    title: "text-[17px]",
  },
  "editorial-magazine": {
    accent: "bg-[#c75f3c]",
    background: "bg-[#fbf7ef] text-[#171814]",
    image: "bg-gradient-to-br from-[#efd8c5] via-[#9eb0bb] to-[#2c3440]",
    layout: "magazine",
    muted: "bg-black/18",
    text: "font-serif",
    title: "text-[19px]",
  },
  "fashion-panel": {
    accent: "bg-[#c99a5a]",
    background: "bg-[#f4eee7] text-[#17110d]",
    image: "bg-gradient-to-br from-[#dac0a7] via-[#8f6d5e] to-[#2b211d]",
    layout: "split",
    muted: "bg-[#17110d]/20",
    text: "font-serif",
    title: "text-[20px]",
  },
  "fine-art-index": {
    accent: "bg-[#282828]",
    background: "bg-[#faf8f3] text-[#171814]",
    image: "bg-gradient-to-br from-[#f7f7f4] via-[#b5b1a8] to-[#2d2d2b]",
    layout: "gallery",
    muted: "bg-black/16",
    text: "font-serif",
    title: "text-[13px]",
  },
  "gallery-wall": {
    accent: "bg-white",
    background: "bg-[#9a9d9d] text-white",
    image: "bg-gradient-to-br from-[#171717] via-[#5f747a] to-[#d5a04a]",
    layout: "gallery",
    muted: "bg-white/26",
    text: "font-sans",
    title: "text-[13px]",
  },
  "gallery-luxe": {
    accent: "bg-[#caa46a]",
    background: "bg-[#17130f] text-[#f7ead8]",
    image: "bg-gradient-to-br from-[#ecd3a3] via-[#5e4030] to-[#130f0d]",
    layout: "center",
    muted: "bg-[#f7ead8]/24",
    text: "font-serif",
    title: "text-[18px]",
  },
  "gear-notebook": {
    accent: "bg-[#2d6e63]",
    background: "bg-[#f3ead9] text-[#25211b]",
    image: "bg-gradient-to-br from-[#c2b192] via-[#6c7c67] to-[#25211b]",
    layout: "sidecar",
    muted: "bg-[#25211b]/22",
    text: "font-mono",
    title: "text-[12px] uppercase",
  },
  "landing-portfolios": {
    accent: "bg-[#d8a84f]",
    background: "bg-[#f9f6ef] text-[#171814]",
    image: "bg-gradient-to-br from-[#e2d0ad] via-[#7b8c8e] to-[#2b312d]",
    layout: "split",
    muted: "bg-black/18",
    text: "font-sans",
    title: "text-[17px]",
  },
  "minimal-white": {
    accent: "bg-[#111]",
    background: "bg-white text-[#161616]",
    image: "bg-gradient-to-br from-[#f1f1ef] via-[#c7c7c4] to-[#7b7c78]",
    layout: "center",
    muted: "bg-black/14",
    text: "font-sans",
    title: "text-[12px]",
  },
  "monochrome-zine": {
    accent: "bg-white",
    background: "bg-[#111] text-white",
    image: "bg-gradient-to-br from-[#f6f6f6] via-[#8c8c8c] to-[#111]",
    layout: "magazine",
    muted: "bg-white/20",
    text: "font-mono uppercase",
    title: "text-[16px] font-black",
  },
  "mosaic-board": {
    accent: "bg-[#d8a84f]",
    background: "bg-[#f4f0e8] text-[#171814]",
    image: "bg-gradient-to-br from-[#c4964e] via-[#6a8991] to-[#222]",
    layout: "gallery",
    muted: "bg-black/18",
    text: "font-sans",
    title: "text-[14px]",
  },
  "museum-wall": {
    accent: "bg-[#8c785c]",
    background: "bg-[#f8f4ec] text-[#171814]",
    image: "bg-gradient-to-br from-[#ece7da] via-[#9c9488] to-[#2d2c28]",
    layout: "gallery",
    muted: "bg-black/16",
    text: "font-serif",
    title: "text-[14px]",
  },
  "panorama-scroll": {
    accent: "bg-[#5c7e92]",
    background: "bg-[#eef3f4] text-[#1d2e35]",
    image: "bg-gradient-to-br from-[#dbeff2] via-[#6191a6] to-[#203d4a]",
    layout: "panorama",
    muted: "bg-[#1d2e35]/22",
    text: "font-sans",
    title: "text-[15px]",
  },
  "portfolio-index": {
    accent: "bg-[#d8a84f]",
    background: "bg-[#f7f4ee] text-[#171814]",
    image: "bg-gradient-to-br from-[#ede2cf] via-[#7b8790] to-[#202426]",
    layout: "sidecar",
    muted: "bg-black/18",
    text: "font-sans",
    title: "text-[13px]",
  },
  "portrait-card": {
    accent: "bg-[#d7a46d]",
    background: "bg-[#efe2d7] text-[#211713]",
    image: "bg-gradient-to-br from-[#eac0a0] via-[#9f6b58] to-[#2b1a16]",
    layout: "portrait",
    muted: "bg-[#211713]/20",
    text: "font-serif",
    title: "text-[17px]",
  },
  "social-hub": {
    accent: "bg-[#5377ff]",
    background: "bg-[#f2f4ff] text-[#11152f]",
    image: "bg-gradient-to-br from-[#c8d4ff] via-[#6f83e8] to-[#171d52]",
    layout: "center",
    muted: "bg-[#11152f]/18",
    text: "font-sans",
    title: "text-[16px]",
  },
  "studio-card": {
    accent: "bg-[#d8a84f]",
    background: "bg-[#f7f2ea] text-[#161713]",
    image: "bg-gradient-to-br from-[#d8a84f] via-[#8c7350] to-[#161713]",
    layout: "center",
    muted: "bg-[#161713]/20",
    text: "font-sans",
    title: "text-[15px]",
  },
  "split-hero": {
    accent: "bg-[#b4864e]",
    background: "bg-[#f3eee6] text-[#191715]",
    image: "bg-gradient-to-br from-[#d9bc95] via-[#667c82] to-[#242423]",
    layout: "split",
    muted: "bg-black/18",
    text: "font-sans",
    title: "text-[18px]",
  },
  "story-journal": {
    accent: "bg-[#9b6a45]",
    background: "bg-[#f5eadc] text-[#211a14]",
    image: "bg-gradient-to-br from-[#e5c8a7] via-[#5d756e] to-[#221a14]",
    layout: "magazine",
    muted: "bg-[#211a14]/20",
    text: "font-serif",
    title: "text-[17px]",
  },
  "street-poster": {
    accent: "bg-[#f2d15a]",
    background: "bg-[#111] text-white",
    image: "bg-gradient-to-br from-[#f2f2f2] via-[#4b4b4b] to-[#090909]",
    layout: "poster",
    muted: "bg-white/24",
    text: "font-sans uppercase",
    title: "text-[20px] font-black",
  },
  "travel-atlas": {
    accent: "bg-[#d87934]",
    background: "bg-[#efe8da] text-[#1d251e]",
    image: "bg-gradient-to-br from-[#dbb16f] via-[#6c9284] to-[#29352f]",
    layout: "sidecar",
    muted: "bg-[#1d251e]/20",
    text: "font-mono",
    title: "text-[13px]",
  },
  "wedding-air": {
    accent: "bg-[#d7a7a1]",
    background: "bg-[#fff7f4] text-[#2b2020]",
    image: "bg-gradient-to-br from-[#ffe7e0] via-[#ddb7b1] to-[#7f655f]",
    layout: "split",
    muted: "bg-[#2b2020]/16",
    text: "font-serif",
    title: "text-[18px]",
  },
}

export function getWebsiteTemplatePreviewLayout(templateId: WebsiteTemplate) {
  return websiteTemplatePreviewDesigns[templateId]?.layout
}

export function getWebsiteTemplatePreviewBackground(templateId: WebsiteTemplate) {
  return websiteTemplatePreviewDesigns[templateId]?.background
}

export function WebsiteTemplateMiniPreview({ isSelected, templateId }: { isSelected: boolean; templateId: WebsiteTemplate }) {
  const design = websiteTemplatePreviewDesigns[templateId]

  if (design) {
    const selectedClass = isSelected ? "ring-2 ring-[#d8a84f] ring-offset-2 ring-offset-transparent" : ""
    const imageClass = `rounded-sm ${design.image}`
    const mutedClass = `rounded-full ${design.muted}`

    return (
      <div className={`mb-3 h-28 overflow-hidden rounded-md border border-current/10 p-2 shadow-sm ${design.background} ${selectedClass}`}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className={`h-1.5 w-12 rounded-full ${design.accent}`} />
          <div className="flex gap-1">
            <div className={mutedClass + " h-1.5 w-5"} />
            <div className={mutedClass + " h-1.5 w-5"} />
            <div className={mutedClass + " h-1.5 w-5"} />
          </div>
        </div>
        {design.layout === "center" && (
          <div className={`flex h-[82px] flex-col items-center justify-center text-center ${design.text}`}>
            <div className={`${design.title} h-3 w-24 rounded-sm ${design.muted}`} />
            <div className={`mt-2 h-2 w-16 rounded-sm ${design.accent}`} />
            <div className="mt-3 grid w-full grid-cols-3 gap-1.5">
              <div className={imageClass + " h-7"} />
              <div className={imageClass + " h-7"} />
              <div className={imageClass + " h-7"} />
            </div>
          </div>
        )}
        {design.layout === "gallery" && (
          <div className="grid h-[82px] grid-cols-3 gap-1.5">
            <div className={imageClass + " row-span-2"} />
            <div className={imageClass} />
            <div className={imageClass} />
            <div className={imageClass} />
            <div className={imageClass} />
          </div>
        )}
        {design.layout === "magazine" && (
          <div className="grid h-[82px] grid-cols-[0.8fr_1.2fr] gap-2">
            <div className={`${design.text} flex flex-col justify-center`}>
              <div className={`${design.title} h-4 w-20 rounded-sm ${design.muted}`} />
              <div className={`mt-1 h-4 w-14 rounded-sm ${design.muted}`} />
              <div className={`mt-3 h-2 w-12 rounded-full ${design.accent}`} />
            </div>
            <div className="grid grid-rows-[1fr_0.55fr] gap-1.5">
              <div className={imageClass} />
              <div className="grid grid-cols-2 gap-1.5">
                <div className={imageClass} />
                <div className={imageClass} />
              </div>
            </div>
          </div>
        )}
        {design.layout === "panorama" && (
          <div className="h-[82px]">
            <div className={imageClass + " h-12"} />
            <div className="mt-2 flex items-center justify-between">
              <div className={`${design.title} h-3 w-24 rounded-sm ${design.muted}`} />
              <div className={`h-3 w-12 rounded-sm ${design.accent}`} />
            </div>
          </div>
        )}
        {design.layout === "portrait" && (
          <div className="grid h-[82px] grid-cols-[0.75fr_1fr] gap-2">
            <div className={imageClass + " rounded-t-full"} />
            <div className={`${design.text} flex flex-col justify-center`}>
              <div className={`${design.title} h-4 w-20 rounded-sm ${design.muted}`} />
              <div className={`mt-2 h-2 w-14 rounded-full ${design.muted}`} />
              <div className={`mt-3 h-4 w-16 rounded-sm ${design.accent}`} />
            </div>
          </div>
        )}
        {design.layout === "poster" && (
          <div className={`relative h-[82px] overflow-hidden rounded-sm ${design.image}`}>
            <div className="absolute inset-0 bg-black/25" />
            <div className={`absolute left-3 top-4 ${design.text}`}>
              <div className={`${design.title} h-5 w-24 rounded-sm bg-white/85`} />
              <div className="mt-1 h-5 w-16 rounded-sm bg-white/70" />
              <div className={`mt-3 h-3 w-12 rounded-sm ${design.accent}`} />
            </div>
          </div>
        )}
        {design.layout === "sidecar" && (
          <div className="grid h-[82px] grid-cols-[0.65fr_1.35fr] gap-2">
            <div className={`flex flex-col justify-center border-r border-current/15 pr-2 ${design.text}`}>
              <div className={`${design.title} h-3 w-16 rounded-sm ${design.muted}`} />
              <div className={`mt-2 h-2 w-12 rounded-full ${design.muted}`} />
              <div className={`mt-3 h-4 w-14 rounded-sm ${design.accent}`} />
            </div>
            <div className={imageClass} />
          </div>
        )}
        {design.layout === "split" && (
          <div className="grid h-[82px] grid-cols-2 gap-2">
            <div className={`${design.text} flex flex-col justify-center`}>
              <div className={`${design.title} h-4 w-24 rounded-sm ${design.muted}`} />
              <div className={`mt-2 h-2 w-16 rounded-full ${design.muted}`} />
              <div className={`mt-3 h-4 w-14 rounded-sm ${design.accent}`} />
            </div>
            <div className={imageClass} />
          </div>
        )}
      </div>
    )
  }

  const frameClass = isSelected ? "border-[#d8a84f]/70 bg-[#20170b]" : "border-current/10 bg-[#151714]"
  const photoClass = "rounded-sm bg-gradient-to-br from-[#e0b45a] via-[#476b75] to-[#101312]"
  const mutedBlockClass = "rounded-sm bg-white/18"

  if (templateId === "story-journal") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-[0.9fr_1.1fr] gap-2 rounded-md border p-2 ${frameClass}`}>
        <div className="space-y-2">
          <div className="h-2 w-14 rounded-full bg-[#d8a84f]" />
          <div className="h-2 w-20 rounded-full bg-white/55" />
          <div className="h-2 w-12 rounded-full bg-white/30" />
          <div className="mt-3 h-5 w-16 rounded-sm border border-white/25" />
        </div>
        <div className={`${photoClass}`} />
      </div>
    )
  }

  if (templateId === "clean-grid") {
    return (
      <div className={`mb-3 h-24 rounded-md border p-2 ${frameClass}`}>
        <div className="mb-2 flex justify-between">
          <div className="h-2 w-20 rounded-full bg-white/50" />
          <div className="h-2 w-10 rounded-full bg-[#d8a84f]" />
        </div>
        <div className="grid h-[70px] grid-cols-3 gap-1.5">
          <div className={photoClass} />
          <div className={photoClass} />
          <div className={photoClass} />
          <div className={photoClass} />
          <div className={photoClass} />
          <div className={photoClass} />
        </div>
      </div>
    )
  }

  if (templateId === "creator-studio") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-[0.7fr_1fr] gap-2 rounded-md border p-2 ${frameClass}`}>
        <div className="space-y-1.5">
          <div className="size-8 rounded-full bg-[#d8a84f]" />
          <div className="h-2 w-14 rounded-full bg-white/45" />
          <div className="h-2 w-10 rounded-full bg-white/25" />
          <div className="h-2 w-16 rounded-full bg-white/25" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className={photoClass} />
          <div className={mutedBlockClass} />
          <div className={mutedBlockClass} />
          <div className={photoClass} />
        </div>
      </div>
    )
  }

  if (templateId === "museum-wall") {
    return (
      <div className={`mb-3 h-24 rounded-md border bg-[#f8f4ec] p-2 text-[#171814] ${isSelected ? "border-[#d8a84f]" : "border-current/10"}`}>
        <div className="mx-auto h-2 w-24 rounded-full bg-black/45" />
        <div className="mt-3 grid h-14 grid-cols-3 gap-3 px-2">
          <div className="rounded-sm border-4 border-white bg-[#476b75] shadow-sm" />
          <div className="rounded-sm border-4 border-white bg-[#a66a3a] shadow-sm" />
          <div className="rounded-sm border-4 border-white bg-[#1f2a24] shadow-sm" />
        </div>
      </div>
    )
  }

  if (templateId === "travel-atlas") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-[1fr_0.8fr] gap-2 rounded-md border p-2 ${frameClass}`}>
        <div className="relative rounded-sm bg-[#20343b]">
          <div className="absolute left-3 top-3 size-2 rounded-full bg-[#d8a84f]" />
          <div className="absolute left-8 top-8 size-2 rounded-full bg-white/70" />
          <div className="absolute bottom-4 left-5 h-px w-16 -rotate-12 bg-white/35" />
        </div>
        <div className="space-y-2">
          <div className="h-2 w-12 rounded-full bg-[#d8a84f]" />
          <div className="h-2 w-20 rounded-full bg-white/45" />
          <div className="h-2 w-16 rounded-full bg-white/25" />
          <div className={`${photoClass} h-8`} />
        </div>
      </div>
    )
  }

  if (templateId === "editorial-magazine") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-[1fr_0.8fr] gap-2 rounded-md border bg-[#fbf7ef] p-2 text-[#171814] ${isSelected ? "border-[#d8a84f]" : "border-current/10"}`}>
        <div>
          <div className="h-4 w-24 rounded-sm bg-black/80" />
          <div className="mt-1 h-4 w-16 rounded-sm bg-black/70" />
          <div className="mt-4 h-2 w-20 rounded-full bg-black/30" />
          <div className="mt-1 h-2 w-12 rounded-full bg-black/20" />
        </div>
        <div className="grid grid-rows-[1fr_0.6fr] gap-1.5">
          <div className={photoClass} />
          <div className="grid grid-cols-2 gap-1.5">
            <div className={photoClass} />
            <div className={photoClass} />
          </div>
        </div>
      </div>
    )
  }

  if (templateId === "minimal-white") {
    return (
      <div className={`mb-3 h-24 rounded-md border bg-white p-2 text-[#171814] ${isSelected ? "border-[#d8a84f]" : "border-current/10"}`}>
        <div className="mb-4 flex justify-between">
          <div className="h-2 w-16 rounded-full bg-black/60" />
          <div className="h-2 w-20 rounded-full bg-black/20" />
        </div>
        <div className="grid h-12 grid-cols-4 gap-2">
          <div className="rounded-sm bg-black/10" />
          <div className="rounded-sm bg-black/20" />
          <div className="rounded-sm bg-black/10" />
          <div className="rounded-sm bg-black/20" />
        </div>
      </div>
    )
  }

  if (templateId === "darkroom") {
    return (
      <div className={`mb-3 h-24 overflow-hidden rounded-md border bg-black p-2 ${isSelected ? "border-[#d8a84f]" : "border-current/10"}`}>
        <div className="relative h-full rounded-sm bg-gradient-to-br from-[#1b2730] via-[#73431f] to-black">
          <div className="absolute inset-x-3 bottom-3 h-2 rounded-full bg-white/70" />
          <div className="absolute inset-x-3 bottom-7 h-3 rounded-sm bg-[#d8a84f]/80" />
        </div>
      </div>
    )
  }

  if (templateId === "mosaic-board") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-4 grid-rows-3 gap-1.5 rounded-md border p-2 ${frameClass}`}>
        <div className={`${photoClass} col-span-2 row-span-2`} />
        <div className={`${photoClass} row-span-1`} />
        <div className={`${photoClass} row-span-2`} />
        <div className={`${photoClass} row-span-1`} />
        <div className={`${photoClass} col-span-2`} />
        <div className={`${photoClass}`} />
      </div>
    )
  }

  if (templateId === "landing-portfolios") {
    return (
      <div className={`mb-3 h-24 rounded-md border p-2 ${frameClass}`}>
        <div className="grid h-9 grid-cols-[1fr_56px] gap-2">
          <div>
            <div className="h-2 w-20 rounded-full bg-[#d8a84f]" />
            <div className="mt-2 h-2 w-28 rounded-full bg-white/40" />
          </div>
          <div className="rounded-sm border border-white/20" />
        </div>
        <div className="mt-2 grid h-9 grid-cols-3 gap-1.5">
          <div className={photoClass} />
          <div className={photoClass} />
          <div className={photoClass} />
        </div>
      </div>
    )
  }

  if (templateId === "portfolio-index") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-[0.65fr_1fr] gap-2 rounded-md border p-2 ${frameClass}`}>
        <div className="space-y-2 border-r border-white/15 pr-2">
          <div className="h-2 w-14 rounded-full bg-[#d8a84f]" />
          <div className="h-2 w-16 rounded-full bg-white/35" />
          <div className="h-2 w-12 rounded-full bg-white/25" />
          <div className="h-2 w-14 rounded-full bg-white/25" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className={photoClass} />
          <div className={photoClass} />
          <div className={photoClass} />
          <div className={photoClass} />
        </div>
      </div>
    )
  }

  if (templateId === "article-first") {
    return (
      <div className={`mb-3 h-24 rounded-md border p-2 ${frameClass}`}>
        <div className="grid h-full grid-cols-[1fr_0.7fr] gap-2">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded-sm bg-white/65" />
            <div className="h-2 w-20 rounded-full bg-white/30" />
            <div className="grid grid-cols-2 gap-1.5">
              <div className={mutedBlockClass} />
              <div className={mutedBlockClass} />
            </div>
          </div>
          <div className={photoClass} />
        </div>
      </div>
    )
  }

  if (templateId === "split-hero") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-2 gap-2 rounded-md border p-2 ${frameClass}`}>
        <div className="space-y-2 self-center">
          <div className="h-3 w-24 rounded-sm bg-white/70" />
          <div className="h-2 w-20 rounded-full bg-white/35" />
          <div className="h-2 w-16 rounded-full bg-white/25" />
          <div className="mt-2 h-5 w-20 rounded-sm bg-[#d8a84f]" />
        </div>
        <div className={photoClass} />
      </div>
    )
  }

  if (templateId === "panorama-scroll") {
    return (
      <div className={`mb-3 h-24 rounded-md border p-2 ${frameClass}`}>
        <div className={`${photoClass} h-10`} />
        <div className="mt-2 grid h-8 grid-cols-[1.4fr_0.8fr_1fr] gap-1.5">
          <div className={photoClass} />
          <div className={mutedBlockClass} />
          <div className={photoClass} />
        </div>
        <div className="mt-2 h-2 w-24 rounded-full bg-[#d8a84f]" />
      </div>
    )
  }

  if (templateId === "about-first") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-[0.75fr_1fr] gap-2 rounded-md border p-2 ${frameClass}`}>
        <div className="space-y-2">
          <div className="size-10 rounded-full bg-gradient-to-br from-[#d8a84f] to-[#6f4e22]" />
          <div className="h-2 w-14 rounded-full bg-white/45" />
          <div className="h-2 w-10 rounded-full bg-white/25" />
        </div>
        <div>
          <div className="h-2 w-24 rounded-full bg-white/60" />
          <div className="mt-2 h-2 w-20 rounded-full bg-white/30" />
          <div className="mt-3 grid h-9 grid-cols-2 gap-1.5">
            <div className={photoClass} />
            <div className={photoClass} />
          </div>
        </div>
      </div>
    )
  }

  if (templateId === "gear-notebook") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-[1fr_0.85fr] gap-2 rounded-md border p-2 ${frameClass}`}>
        <div className="space-y-1.5">
          <div className={`${photoClass} h-9`} />
          <div className="h-2 w-24 rounded-full bg-white/55" />
          <div className="h-2 w-16 rounded-full bg-white/25" />
        </div>
        <div className="space-y-1.5 rounded-sm border border-white/15 p-1.5">
          <div className="h-2 w-12 rounded-full bg-[#d8a84f]" />
          <div className={mutedBlockClass + " h-3"} />
          <div className={mutedBlockClass + " h-3"} />
          <div className={mutedBlockClass + " h-3"} />
        </div>
      </div>
    )
  }

  if (templateId === "social-hub") {
    return (
      <div className={`mb-3 h-24 rounded-md border p-2 ${frameClass}`}>
        <div className="mx-auto size-9 rounded-full bg-[#d8a84f]" />
        <div className="mx-auto mt-2 h-2 w-24 rounded-full bg-white/55" />
        <div className="mx-auto mt-1 h-2 w-16 rounded-full bg-white/25" />
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          <div className="h-5 rounded-sm border border-white/20" />
          <div className="h-5 rounded-sm border border-white/20" />
          <div className="h-5 rounded-sm border border-white/20" />
          <div className="h-5 rounded-sm border border-white/20" />
        </div>
      </div>
    )
  }

  return (
    <div className={`mb-3 h-24 overflow-hidden rounded-md border p-2 ${frameClass}`}>
      <div className={`${photoClass} h-full`}>
        <div className="flex h-full flex-col justify-end p-3">
          <div className="h-2 w-24 rounded-full bg-white/70" />
          <div className="mt-2 h-2 w-16 rounded-full bg-[#d8a84f]" />
        </div>
      </div>
    </div>
  )
}
