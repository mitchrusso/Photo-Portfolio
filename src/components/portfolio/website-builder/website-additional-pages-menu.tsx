"use client"

import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"

import type {
  WebsiteBuilderPageKey,
  WebsiteCustomPage,
} from "@/lib/website-builder-rules"

type PageOption = {
  key: WebsiteBuilderPageKey
  label: string
  note: string
}

type WebsiteAdditionalPagesMenuProps = {
  activeCustomPageId: string
  activePage: WebsiteBuilderPageKey
  customPages: WebsiteCustomPage[]
  draggedPage: WebsiteBuilderPageKey | null
  inspectorOpen: boolean
  isDark: boolean
  maxCustomPages: number
  mutedTextClass: string
  onAddCustomPage: () => void
  onMovePage: (draggedPage: WebsiteBuilderPageKey, targetPage: WebsiteBuilderPageKey) => void
  onMovePageByOffset: (page: WebsiteBuilderPageKey, offset: -1 | 1) => void
  onRemoveCustomPage: (customPageId: string) => void
  onSelectCustomPage: (customPageId: string) => void
  onSelectPage: (page: WebsiteBuilderPageKey) => void
  onSetDraggedPage: Dispatch<SetStateAction<WebsiteBuilderPageKey | null>>
  onSetEditorHost: Dispatch<SetStateAction<HTMLDivElement | null>>
  pageOptions: PageOption[]
}

export function WebsiteAdditionalPagesMenu({
  activeCustomPageId,
  activePage,
  customPages,
  draggedPage,
  inspectorOpen,
  isDark,
  maxCustomPages,
  mutedTextClass,
  onAddCustomPage,
  onMovePage,
  onMovePageByOffset,
  onRemoveCustomPage,
  onSelectCustomPage,
  onSelectPage,
  onSetDraggedPage,
  onSetEditorHost,
  pageOptions,
}: WebsiteAdditionalPagesMenuProps) {
  return (
    <div
      className="shrink-0 space-y-2"
      data-testid="website-additional-pages-menu"
      title="Create and manage up to five independent pages for subjects beyond the standard website pages."
    >
      <div className="flex items-start justify-between gap-3 px-1 pt-1">
        <div>
          <p className="text-xs font-semibold">Additional pages</p>
          <p className={`mt-0.5 text-[11px] leading-4 ${mutedTextClass}`}>Standard pages appear first. Add up to five custom pages for anything else your website needs.</p>
        </div>
        <button
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-md bg-[#1f2a24] px-2.5 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
          disabled={customPages.length >= maxCustomPages}
          onClick={onAddCustomPage}
          title={customPages.length >= maxCustomPages ? "Five custom pages is the current limit" : "Add another custom page"}
          type="button"
        >
          <Plus className="size-3.5" />
          Add page
        </button>
      </div>

      {pageOptions.map((page) => {
        const isOpen = inspectorOpen && activePage === page.key

        return (
          <div
            className={`overflow-hidden rounded-md border transition ${
              isOpen
                ? "border-[#d8a84f] bg-[#fff8e8] text-[#1e211d] shadow-[0_8px_24px_rgba(96,66,23,0.12)]"
                : isDark
                  ? "border-white/10 bg-white/[0.04]"
                  : "border-[#ded8cc] bg-white"
            }`}
            data-website-page={page.key}
            key={page.key}
            onDragOver={(event) => {
              if (!draggedPage) return
              event.preventDefault()
              event.dataTransfer.dropEffect = "move"
            }}
            onDrop={(event) => {
              event.preventDefault()
              if (draggedPage) onMovePage(draggedPage, page.key)
              onSetDraggedPage(null)
            }}
          >
            <div className="flex items-stretch">
              <button
                aria-label={`Reorder ${page.label}. Use arrow keys or drag.`}
                className={`flex w-11 shrink-0 cursor-grab items-center justify-center border-r active:cursor-grabbing ${isOpen ? "border-[#e0bd69] text-[#99702d]" : isDark ? "border-white/10 text-white/45" : "border-[#e7e1d7] text-[#9a9185]"}`}
                draggable
                onDragEnd={() => onSetDraggedPage(null)}
                onDragStart={(event) => {
                  onSetDraggedPage(page.key)
                  event.dataTransfer.effectAllowed = "move"
                  event.dataTransfer.setData("text/plain", page.key)
                }}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
                  event.preventDefault()
                  onMovePageByOffset(page.key, event.key === "ArrowUp" ? -1 : 1)
                }}
                title={`Drag to reorder ${page.label}`}
                type="button"
              >
                <GripVertical className="size-5" />
              </button>
              <button
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-3 text-left text-sm font-semibold"
                onClick={() => onSelectPage(page.key)}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block">{page.label}</span>
                  <span className={`mt-0.5 block text-[11px] font-normal leading-4 ${isOpen ? "text-[#735223]" : mutedTextClass}`}>{page.note}</span>
                </span>
                <ChevronDown className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
            {isOpen ? (
              <div className={`border-t ${isDark ? "border-white/10" : "border-[#e0bd69]"}`}>
                <div ref={onSetEditorHost} />
              </div>
            ) : null}
          </div>
        )
      })}

      {customPages.map((customPage, customPageIndex) => {
        const isOpen = inspectorOpen
          && activePage === "custom"
          && activeCustomPageId === customPage.id
        const customPageLabel = customPage.title || `Custom page ${customPageIndex + 1}`

        return (
          <div
            className={`overflow-hidden rounded-md border transition ${
              isOpen
                ? "border-[#d8a84f] bg-[#fff8e8] text-[#1e211d] shadow-[0_8px_24px_rgba(96,66,23,0.12)]"
                : isDark
                  ? "border-white/10 bg-white/[0.04]"
                  : "border-[#ded8cc] bg-white"
            }`}
            data-website-custom-page={customPage.id}
            key={customPage.id}
          >
            <div className="flex items-stretch">
              <button
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-3 text-left text-sm font-semibold"
                onClick={() => onSelectCustomPage(customPage.id)}
                title={`Open ${customPageLabel.toLowerCase()} controls`}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate">{customPageLabel}</span>
                  <span className={`mt-0.5 block text-[11px] font-normal leading-4 ${isOpen ? "text-[#735223]" : mutedTextClass}`}>
                    Custom page {customPageIndex + 1} of {maxCustomPages}
                  </span>
                </span>
                <ChevronDown className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <button
                aria-label={`Remove ${customPageLabel.toLowerCase()}`}
                className={`grid w-11 shrink-0 place-items-center border-l text-[#a43b2f] ${isOpen ? "border-[#e0bd69]" : isDark ? "border-white/10" : "border-[#e7e1d7]"}`}
                onClick={() => onRemoveCustomPage(customPage.id)}
                title="Remove custom page"
                type="button"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            {isOpen ? (
              <div className={`border-t ${isDark ? "border-white/10" : "border-[#e0bd69]"}`}>
                <div ref={onSetEditorHost} />
              </div>
            ) : null}
          </div>
        )
      })}

      <p className={`px-1 text-[11px] leading-4 ${mutedTextClass}`}>
        {customPages.length} of {maxCustomPages} custom pages used.
      </p>
    </div>
  )
}
