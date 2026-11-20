"use client"

import { ArrowRight, Folder, Globe2, Images, Library, Plus } from "lucide-react"

type PhotoViewWorkspaceOverviewProps = {
  activeGalleryName: string
  galleryCount: number
  isDark: boolean
  onBrowseGalleries: () => void
  onCreateGallery: () => void
  onCreatePortfolio: () => void
  onEditWebsite: () => void
  onManageWebsites: () => void
  onOpenLibrary: () => void
  portfolioCount: number
  websiteCount: number
  websiteName: string
}

export function PhotoViewWorkspaceOverview({
  activeGalleryName,
  galleryCount,
  isDark,
  onBrowseGalleries,
  onCreateGallery,
  onCreatePortfolio,
  onEditWebsite,
  onManageWebsites,
  onOpenLibrary,
  portfolioCount,
  websiteCount,
  websiteName,
}: PhotoViewWorkspaceOverviewProps) {
  const cardClass = isDark
    ? "border-white/10 bg-white/[0.04]"
    : "border-[#e2dbcf] bg-white"
  const mutedClass = isDark ? "text-white/60" : "text-[#71695e]"
  const secondaryButtonClass = isDark
    ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
    : "border-[#d7d0c4] bg-white text-[#3f3a33] hover:bg-[#f7f3ec]"

  return (
    <section
      aria-labelledby="photoview-workspace-title"
      className={`overflow-hidden rounded-md border shadow-sm ${isDark ? "border-white/10 bg-[#17201b]" : "border-[#ddd5c8] bg-[#fbf8f2]"}`}
    >
      <div className="flex flex-col gap-3 border-b border-current/10 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a66c16]">How PhotoView is organized</p>
            <h2 className="text-base font-semibold" id="photoview-workspace-title">Your PhotoView workspace</h2>
          </div>
          <p className={`mt-1 max-w-4xl text-xs leading-4 ${mutedClass}`}>
            Library holds your photographs. Galleries organize themes. Portfolios curate the work inside each Gallery. Websites publish the selections you choose.
          </p>
        </div>
        <button
          className={`inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-md border px-3 text-xs font-semibold ${secondaryButtonClass}`}
          onClick={onOpenLibrary}
          type="button"
        >
          <Library className="size-4" />
          Open Library
        </button>
      </div>

      <div className="grid gap-2 p-3 lg:grid-cols-3">
        <article className={`flex min-h-36 flex-col rounded-md border p-3 ${cardClass}`}>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#d8a84f] text-sm font-semibold text-[#171814]">1</span>
            <h3 className="text-sm font-semibold">Galleries</h3>
            <Folder className="ml-auto size-4 text-[#b8791b]" />
          </div>
          <p className={`mt-2 text-xs leading-4 ${mutedClass}`}>Organize a subject, project, trip, or collection. You can create as many distinct Galleries as your work needs.</p>
          <p className="mt-2 text-xs font-semibold">{activeGalleryName} · {portfolioCount} portfolio{portfolioCount === 1 ? "" : "s"}</p>
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <button className={`h-8 rounded-md border px-2.5 text-xs font-semibold ${secondaryButtonClass}`} onClick={onBrowseGalleries} type="button">
              Browse {galleryCount} Galler{galleryCount === 1 ? "y" : "ies"}
            </button>
            <button className={`inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold ${secondaryButtonClass}`} onClick={onCreateGallery} type="button">
              <Plus className="size-3.5" /> Add Gallery
            </button>
          </div>
        </article>

        <article className={`flex min-h-36 flex-col rounded-md border p-3 ${cardClass}`}>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#d8a84f] text-sm font-semibold text-[#171814]">2</span>
            <h3 className="text-sm font-semibold">Portfolios</h3>
            <Images className="ml-auto size-4 text-[#b8791b]" />
          </div>
          <p className={`mt-2 text-xs leading-4 ${mutedClass}`}>Create focused groups of photographs inside the selected Gallery, then arrange and present each portfolio independently.</p>
          <button
            className="mt-auto inline-flex h-8 w-fit items-center gap-2 rounded-md bg-[#1f2a24] px-2.5 text-xs font-semibold text-white hover:bg-[#2b3931]"
            onClick={onCreatePortfolio}
            type="button"
          >
            Create portfolio <ArrowRight className="size-3.5" />
          </button>
        </article>

        <article className={`flex min-h-36 flex-col rounded-md border p-3 ${cardClass}`}>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#d8a84f] text-sm font-semibold text-[#171814]">3</span>
            <h3 className="text-sm font-semibold">Websites</h3>
            <Globe2 className="ml-auto size-4 text-[#b8791b]" />
          </div>
          <p className={`mt-2 text-xs leading-4 ${mutedClass}`}>Build one or more websites from the same Library without uploading duplicate files or changing the underlying Galleries.</p>
          <p className="mt-2 truncate text-xs font-semibold">{websiteName} · {websiteCount} website{websiteCount === 1 ? "" : "s"}</p>
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <button className="h-8 rounded-md bg-[#1f2a24] px-2.5 text-xs font-semibold text-white hover:bg-[#2b3931]" onClick={onEditWebsite} type="button">Edit website</button>
            <button className={`h-8 rounded-md border px-2.5 text-xs font-semibold ${secondaryButtonClass}`} onClick={onManageWebsites} type="button">Manage websites</button>
          </div>
        </article>
      </div>
    </section>
  )
}
