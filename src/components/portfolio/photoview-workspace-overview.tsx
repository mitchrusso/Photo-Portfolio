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
      <div className="flex flex-col gap-4 border-b border-current/10 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a66c16]">How PhotoView is organized</p>
          <h2 className="mt-1 text-xl font-semibold" id="photoview-workspace-title">Your PhotoView workspace</h2>
          <p className={`mt-1 max-w-3xl text-sm leading-6 ${mutedClass}`}>
            Library holds your photographs. Galleries organize themes. Portfolios curate the work inside each Gallery. Websites publish the selections you choose.
          </p>
        </div>
        <button
          className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold ${secondaryButtonClass}`}
          onClick={onOpenLibrary}
          type="button"
        >
          <Library className="size-4" />
          Open Library
        </button>
      </div>

      <div className="grid gap-3 p-4 lg:grid-cols-3">
        <article className={`flex min-h-52 flex-col rounded-md border p-4 ${cardClass}`}>
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#d8a84f] font-semibold text-[#171814]">1</span>
            <Folder className="size-5 text-[#b8791b]" />
          </div>
          <h3 className="mt-4 text-base font-semibold">Galleries</h3>
          <p className={`mt-1 text-sm leading-5 ${mutedClass}`}>Organize a subject, project, trip, or collection. You can create as many distinct Galleries as your work needs.</p>
          <p className="mt-3 text-sm font-semibold">{activeGalleryName} · {portfolioCount} portfolio{portfolioCount === 1 ? "" : "s"}</p>
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            <button className={`h-9 rounded-md border px-3 text-sm font-semibold ${secondaryButtonClass}`} onClick={onBrowseGalleries} type="button">
              Browse {galleryCount} Galler{galleryCount === 1 ? "y" : "ies"}
            </button>
            <button className={`inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-semibold ${secondaryButtonClass}`} onClick={onCreateGallery} type="button">
              <Plus className="size-3.5" /> Add Gallery
            </button>
          </div>
        </article>

        <article className={`flex min-h-52 flex-col rounded-md border p-4 ${cardClass}`}>
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#d8a84f] font-semibold text-[#171814]">2</span>
            <Images className="size-5 text-[#b8791b]" />
          </div>
          <h3 className="mt-4 text-base font-semibold">Portfolios</h3>
          <p className={`mt-1 text-sm leading-5 ${mutedClass}`}>Create focused groups of photographs inside the selected Gallery, then arrange and present each portfolio independently.</p>
          <button
            className="mt-auto inline-flex h-9 w-fit items-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-semibold text-white hover:bg-[#2b3931]"
            onClick={onCreatePortfolio}
            type="button"
          >
            Create portfolio <ArrowRight className="size-3.5" />
          </button>
        </article>

        <article className={`flex min-h-52 flex-col rounded-md border p-4 ${cardClass}`}>
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#d8a84f] font-semibold text-[#171814]">3</span>
            <Globe2 className="size-5 text-[#b8791b]" />
          </div>
          <h3 className="mt-4 text-base font-semibold">Websites</h3>
          <p className={`mt-1 text-sm leading-5 ${mutedClass}`}>Build one or more websites from the same Library without uploading duplicate files or changing the underlying Galleries.</p>
          <p className="mt-3 truncate text-sm font-semibold">{websiteName} · {websiteCount} website{websiteCount === 1 ? "" : "s"}</p>
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            <button className="h-9 rounded-md bg-[#1f2a24] px-3 text-sm font-semibold text-white hover:bg-[#2b3931]" onClick={onEditWebsite} type="button">Edit website</button>
            <button className={`h-9 rounded-md border px-3 text-sm font-semibold ${secondaryButtonClass}`} onClick={onManageWebsites} type="button">Manage websites</button>
          </div>
        </article>
      </div>
    </section>
  )
}
