"use client"

import { ArrowDown, ArrowUp, ChevronDown, Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react"
import { type Dispatch, type SetStateAction, useState } from "react"

import {
  type WebsiteCustomBlock,
  type WebsiteHomeBlockOrderKey,
  type WebsiteSectionOrderKey,
} from "@/lib/website-builder-rules"
import { moveWebsitePortfolio, normalizeWebsitePortfolioOrder } from "@/lib/website-portfolio-order"

type GalleryOption = {
  id: string
  name: string
}

type HomeBlockOption = {
  key: string
  label: string
  note: string
}

type WebsiteHomeBlockMenuProps = {
  activeSectionKey: WebsiteSectionOrderKey
  blockOptions: HomeBlockOption[]
  canReorder: boolean
  customBlocks: WebsiteCustomBlock[]
  draggedBlockKey: WebsiteHomeBlockOrderKey | null
  galleries: GalleryOption[]
  inspectorOpen: boolean
  isDark: boolean
  maxCustomBlocks: number
  mutedTextClass: string
  onAddCustomBlock: (type: WebsiteCustomBlock["type"]) => void
  onCloseSection: () => void
  onMoveBlock: (draggedKey: WebsiteHomeBlockOrderKey, targetKey: WebsiteHomeBlockOrderKey) => void
  onMoveBlockByOffset: (blockKey: WebsiteHomeBlockOrderKey, offset: -1 | 1) => void
  onOpenSection: (sectionKey: WebsiteSectionOrderKey) => void
  onReorderPortfolios: (portfolioOrder: string[]) => void
  onRemoveCustomBlock: (customBlockId: string) => void
  onSetDraggedBlock: Dispatch<SetStateAction<WebsiteHomeBlockOrderKey | null>>
  onSetEditorHost: Dispatch<SetStateAction<HTMLDivElement | null>>
  onToggleSectionVisibility: (sectionKey: WebsiteSectionOrderKey, visible: boolean) => void
  onUpdateCustomBlock: (customBlockId: string, patch: Partial<WebsiteCustomBlock>) => void
  orderedBlockKeys: WebsiteHomeBlockOrderKey[]
  portfolioOrder: string[]
  sectionLabel: (sectionKey: WebsiteSectionOrderKey) => string
  sectionVisible: (sectionKey: WebsiteSectionOrderKey) => boolean
  supportsCustomBlocks: boolean
}

function homeBlockFromSectionKey(sectionKey: WebsiteSectionOrderKey) {
  return sectionKey.startsWith("home:") ? sectionKey.slice("home:".length) : null
}

export function WebsiteHomeBlockMenu({
  activeSectionKey,
  blockOptions,
  canReorder,
  customBlocks,
  draggedBlockKey,
  galleries,
  inspectorOpen,
  isDark,
  maxCustomBlocks,
  mutedTextClass,
  onAddCustomBlock,
  onCloseSection,
  onMoveBlock,
  onMoveBlockByOffset,
  onOpenSection,
  onReorderPortfolios,
  onRemoveCustomBlock,
  onSetDraggedBlock,
  onSetEditorHost,
  onToggleSectionVisibility,
  onUpdateCustomBlock,
  orderedBlockKeys,
  portfolioOrder,
  sectionLabel,
  sectionVisible,
  supportsCustomBlocks,
}: WebsiteHomeBlockMenuProps) {
  const [draggedPortfolioId, setDraggedPortfolioId] = useState<string | null>(null)
  const normalizedPortfolioOrder = normalizeWebsitePortfolioOrder(portfolioOrder, galleries.map((gallery) => gallery.id))
  const orderedPortfolios = normalizedPortfolioOrder
    .map((galleryId) => galleries.find((gallery) => gallery.id === galleryId))
    .filter((gallery): gallery is GalleryOption => Boolean(gallery))

  const movePortfolioByOffset = (galleryId: string, offset: -1 | 1) => {
    const index = normalizedPortfolioOrder.indexOf(galleryId)
    const targetGalleryId = normalizedPortfolioOrder[index + offset]
    if (!targetGalleryId) return
    onReorderPortfolios(moveWebsitePortfolio(normalizedPortfolioOrder, galleryId, targetGalleryId))
  }

  return (
    <div className="shrink-0 space-y-2" data-testid="website-home-block-menu">
      <div className="px-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold">Home page blocks</p>
          {supportsCustomBlocks ? <span className={`text-[10px] ${mutedTextClass}`}>{customBlocks.length}/{maxCustomBlocks} custom</span> : null}
        </div>
        <p className={`mt-0.5 text-[11px] leading-4 ${mutedTextClass}`}>
          {canReorder
            ? "These blocks mirror the Live Canvas from top to bottom. Open one to edit it, use the eye to show or hide it, or drag it to change the layout."
            : "This template has a signature composition. Every block shown here can be edited or switched on and off; its position is set by the template."}
        </p>
        {supportsCustomBlocks ? <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            className="flex h-11 items-center justify-center gap-1.5 rounded-md border border-[#ded8cc] bg-white px-2 text-[11px] font-semibold text-[#1e211d] disabled:opacity-45"
            disabled={customBlocks.length >= maxCustomBlocks}
            onClick={() => onAddCustomBlock("text")}
            type="button"
          >
            <Plus className="size-3.5" />
            Text block
          </button>
          <button
            className="flex h-11 items-center justify-center gap-1.5 rounded-md bg-[#1f2a24] px-2 text-[11px] font-semibold text-white disabled:opacity-45"
            disabled={customBlocks.length >= maxCustomBlocks}
            onClick={() => onAddCustomBlock("portfolio")}
            type="button"
          >
            <Plus className="size-3.5" />
            Portfolio grid
          </button>
        </div> : null}
      </div>

      <details
        className={`group overflow-hidden rounded-md border ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}
        data-testid="website-portfolio-order-menu"
      >
        <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-3 [&::-webkit-details-marker]:hidden">
          <GripVertical aria-hidden="true" className={`size-4 shrink-0 ${mutedTextClass}`} />
          <span className="min-w-0 flex-1 text-sm font-semibold">
            Portfolio sequence
            <span className={`mt-0.5 block text-[11px] font-normal leading-4 ${mutedTextClass}`}>
              Applies to every website template
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <div className={`border-t p-3 ${isDark ? "border-white/10" : "border-[#e7e1d7]"}`}>
          <p className={`text-[11px] leading-4 ${mutedTextClass}`}>
            Drag portfolios into the sequence visitors should see, or use the arrow buttons. Save and publish when you are done.
          </p>
          {orderedPortfolios.length > 1 ? (
            <ol className="mt-3 grid gap-2">
              {orderedPortfolios.map((gallery, index) => (
                <li
                  className={`flex min-w-0 items-center gap-2 rounded-md border p-2 transition ${
                    draggedPortfolioId === gallery.id
                      ? "border-[#b08336] opacity-60"
                      : isDark
                        ? "border-white/10 bg-white/[0.04]"
                        : "border-[#ded8cc] bg-[#fbfaf7]"
                  }`}
                  draggable
                  key={gallery.id}
                  onDragEnd={() => setDraggedPortfolioId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={(event) => {
                    setDraggedPortfolioId(gallery.id)
                    event.dataTransfer.effectAllowed = "move"
                    event.dataTransfer.setData("text/plain", gallery.id)
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    const sourceId = draggedPortfolioId || event.dataTransfer.getData("text/plain")
                    if (sourceId) onReorderPortfolios(moveWebsitePortfolio(normalizedPortfolioOrder, sourceId, gallery.id))
                    setDraggedPortfolioId(null)
                  }}
                >
                  <GripVertical aria-hidden="true" className={`size-4 shrink-0 cursor-grab ${mutedTextClass}`} />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold">{gallery.name}</span>
                  <button
                    aria-label={`Move ${gallery.name} up`}
                    className="grid size-8 shrink-0 place-items-center rounded border border-current/15 disabled:cursor-not-allowed disabled:opacity-30"
                    disabled={index === 0}
                    onClick={() => movePortfolioByOffset(gallery.id, -1)}
                    title="Move up"
                    type="button"
                  >
                    <ArrowUp aria-hidden="true" className="size-3.5" />
                  </button>
                  <button
                    aria-label={`Move ${gallery.name} down`}
                    className="grid size-8 shrink-0 place-items-center rounded border border-current/15 disabled:cursor-not-allowed disabled:opacity-30"
                    disabled={index === orderedPortfolios.length - 1}
                    onClick={() => movePortfolioByOffset(gallery.id, 1)}
                    title="Move down"
                    type="button"
                  >
                    <ArrowDown aria-hidden="true" className="size-3.5" />
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className={`mt-3 rounded-md border border-dashed p-3 text-xs ${isDark ? "border-white/15" : "border-[#ded8cc]"} ${mutedTextClass}`}>
              Add at least two portfolios to arrange their sequence.
            </p>
          )}
        </div>
      </details>

      {orderedBlockKeys.map((homeBlockKey) => {
        if (homeBlockKey.startsWith("custom:")) {
          const customBlockId = homeBlockKey.slice("custom:".length)
          const customBlock = customBlocks.find((block) => block.id === customBlockId)
          if (!customBlock) return null
          const customBlockLabel = customBlock.title.trim() || (customBlock.type === "portfolio" ? "Portfolio collection" : "Text block")

          return (
            <details
              className={`group overflow-hidden rounded-md border ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}
              data-website-custom-block={customBlock.id}
              key={homeBlockKey}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const droppedKey = (event.dataTransfer.getData("text/plain") || draggedBlockKey) as WebsiteHomeBlockOrderKey | null
                if (droppedKey) onMoveBlock(droppedKey, homeBlockKey)
                onSetDraggedBlock(null)
              }}
            >
              <summary className="flex cursor-pointer list-none items-stretch [&::-webkit-details-marker]:hidden">
                {canReorder ? <button
                  aria-label={`Reorder ${customBlockLabel}. Use arrow keys or drag.`}
                  className={`flex w-11 shrink-0 cursor-grab items-center justify-center border-r active:cursor-grabbing ${isDark ? "border-white/10 text-white/45" : "border-[#e7e1d7] text-[#9a9185]"}`}
                  draggable
                  onClick={(event) => event.preventDefault()}
                  onDragEnd={() => onSetDraggedBlock(null)}
                  onDragStart={(event) => {
                    onSetDraggedBlock(homeBlockKey)
                    event.dataTransfer.effectAllowed = "move"
                    event.dataTransfer.setData("text/plain", homeBlockKey)
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
                    event.preventDefault()
                    onMoveBlockByOffset(homeBlockKey, event.key === "ArrowUp" ? -1 : 1)
                  }}
                  type="button"
                >
                  <GripVertical className="size-5" />
                </button> : null}
                <span className="min-w-0 flex-1 px-3 py-3 text-left text-sm font-semibold">
                  <span className="block truncate">{customBlockLabel}</span>
                  <span className={`mt-0.5 block text-[11px] font-normal leading-4 ${mutedTextClass}`}>
                    {customBlock.type === "portfolio" ? `${customBlock.galleryIds.length} selected portfolios` : "Custom text section"}
                  </span>
                </span>
                <button
                  aria-label={`${customBlock.visible ? "Hide" : "Show"} ${customBlockLabel}`}
                  className={`grid w-11 shrink-0 place-items-center border-l ${isDark ? "border-white/10" : "border-[#e7e1d7]"}`}
                  onClick={(event) => {
                    event.preventDefault()
                    onUpdateCustomBlock(customBlock.id, { visible: !customBlock.visible })
                  }}
                  type="button"
                >
                  {customBlock.visible ? <Eye className="size-4" /> : <EyeOff className="size-4 opacity-45" />}
                </button>
                <ChevronDown className="mr-3 size-4 shrink-0 self-center transition-transform group-open:rotate-180" />
              </summary>
              <div className={`space-y-3 border-t p-3 ${isDark ? "border-white/10" : "border-[#e7e1d7]"}`}>
                <label className="block text-[11px] font-semibold">
                  Heading (optional)
                  <input
                    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm font-normal ${isDark ? "border-white/10 bg-black/20 text-white" : "border-[#d8d1c5] bg-white text-[#1e211d]"}`}
                    onChange={(event) => onUpdateCustomBlock(customBlock.id, { title: event.target.value })}
                    value={customBlock.title}
                  />
                  <span className={`mt-1 block font-normal ${mutedTextClass}`}>Leave blank to remove the heading from your website.</span>
                </label>
                <label className="block text-[11px] font-semibold">
                  Supporting text
                  <textarea
                    className={`mt-1 min-h-20 w-full resize-y rounded-md border px-3 py-2 text-sm font-normal ${isDark ? "border-white/10 bg-black/20 text-white" : "border-[#d8d1c5] bg-white text-[#1e211d]"}`}
                    onChange={(event) => onUpdateCustomBlock(customBlock.id, { body: event.target.value })}
                    value={customBlock.body}
                  />
                </label>
                {customBlock.type === "portfolio" ? (
                  <fieldset>
                    <legend className="text-[11px] font-semibold">Portfolios in this grid</legend>
                    <div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-md border border-current/10 p-2">
                      {galleries.map((gallery) => (
                        <label className="flex items-center gap-2 rounded px-1 py-1 text-xs" key={gallery.id}>
                          <input
                            checked={customBlock.galleryIds.includes(gallery.id)}
                            onChange={(event) => onUpdateCustomBlock(customBlock.id, {
                              galleryIds: event.target.checked
                                ? [...customBlock.galleryIds, gallery.id]
                                : customBlock.galleryIds.filter((galleryId) => galleryId !== gallery.id),
                            })}
                            type="checkbox"
                          />
                          <span className="truncate">{gallery.name}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ) : null}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {canReorder ? <div className="flex gap-1">
                    <button className="rounded-md border border-current/15 px-2 py-1 text-[11px] font-semibold" onClick={() => onMoveBlockByOffset(homeBlockKey, -1)} type="button">Move up</button>
                    <button className="rounded-md border border-current/15 px-2 py-1 text-[11px] font-semibold" onClick={() => onMoveBlockByOffset(homeBlockKey, 1)} type="button">Move down</button>
                  </div> : <span />}
                  <button className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-red-600" onClick={() => onRemoveCustomBlock(customBlock.id)} type="button">
                    <Trash2 className="size-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            </details>
          )
        }

        const sectionKey = `home:${homeBlockKey}` as WebsiteSectionOrderKey
        const homeBlock = homeBlockFromSectionKey(sectionKey)
        if (!homeBlock) return null

        const block = blockOptions.find((option) => option.key === homeBlock)
        const isOpen = inspectorOpen && activeSectionKey === sectionKey
        const isVisible = sectionVisible(sectionKey)
        const label = block?.label ?? sectionLabel(sectionKey)

        return (
          <div
            className={`overflow-hidden rounded-md border transition ${
              isOpen
                ? "border-[#d8a84f] bg-[#fff8e8] text-[#1e211d] shadow-[0_8px_24px_rgba(96,66,23,0.12)]"
                : isDark
                  ? "border-white/10 bg-white/[0.04]"
                  : "border-[#ded8cc] bg-white"
            }`}
            data-website-home-block={homeBlock}
            key={sectionKey}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              const droppedKey = (event.dataTransfer.getData("text/plain") || draggedBlockKey) as WebsiteHomeBlockOrderKey | null
              if (droppedKey) onMoveBlock(droppedKey, homeBlockKey)
              onSetDraggedBlock(null)
            }}
          >
            <div className="flex items-stretch">
              {canReorder ? <button
                aria-label={`Reorder ${label}. Use arrow keys or drag.`}
                className={`flex w-11 shrink-0 cursor-grab items-center justify-center border-r active:cursor-grabbing ${isOpen ? "border-[#e0bd69] text-[#99702d]" : isDark ? "border-white/10 text-white/45" : "border-[#e7e1d7] text-[#9a9185]"}`}
                draggable
                onDragEnd={() => onSetDraggedBlock(null)}
                onDragStart={(event) => {
                  onSetDraggedBlock(homeBlockKey)
                  event.dataTransfer.effectAllowed = "move"
                  event.dataTransfer.setData("text/plain", homeBlockKey)
                }}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
                  event.preventDefault()
                  onMoveBlockByOffset(homeBlockKey, event.key === "ArrowUp" ? -1 : 1)
                }}
                title={`Drag to reorder ${label}`}
                type="button"
              >
                <GripVertical className="size-5" />
              </button> : null}
              <button
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-3 text-left text-sm font-semibold"
                onClick={() => isOpen ? onCloseSection() : onOpenSection(sectionKey)}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block">{label}</span>
                  <span className={`mt-0.5 block text-[11px] font-normal leading-4 ${isOpen ? "text-[#735223]" : mutedTextClass}`}>{block?.note}</span>
                </span>
                <ChevronDown className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <button
                aria-label={`${isVisible ? "Hide" : "Show"} ${label}`}
                aria-pressed={isVisible}
                className={`grid w-11 shrink-0 place-items-center border-l ${isOpen ? "border-[#e0bd69]" : isDark ? "border-white/10" : "border-[#e7e1d7]"}`}
                onClick={() => onToggleSectionVisibility(sectionKey, !isVisible)}
                title={`${isVisible ? "Hide" : "Show"} block`}
                type="button"
              >
                {isVisible ? <Eye className="size-4" /> : <EyeOff className="size-4 opacity-45" />}
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
    </div>
  )
}
