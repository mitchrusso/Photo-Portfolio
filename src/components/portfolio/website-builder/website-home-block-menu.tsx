"use client"

import { ChevronDown, Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"

import {
  type WebsiteCustomBlock,
  type WebsiteHomeBlockOrderKey,
  type WebsiteSectionOrderKey,
} from "@/lib/website-builder-rules"

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
  onRemoveCustomBlock: (customBlockId: string) => void
  onSetDraggedBlock: Dispatch<SetStateAction<WebsiteHomeBlockOrderKey | null>>
  onSetEditorHost: Dispatch<SetStateAction<HTMLDivElement | null>>
  onToggleSectionVisibility: (sectionKey: WebsiteSectionOrderKey, visible: boolean) => void
  onUpdateCustomBlock: (customBlockId: string, patch: Partial<WebsiteCustomBlock>) => void
  orderedBlockKeys: WebsiteHomeBlockOrderKey[]
  sectionLabel: (sectionKey: WebsiteSectionOrderKey) => string
  sectionVisible: (sectionKey: WebsiteSectionOrderKey) => boolean
}

function homeBlockFromSectionKey(sectionKey: WebsiteSectionOrderKey) {
  return sectionKey.startsWith("home:") ? sectionKey.slice("home:".length) : null
}

export function WebsiteHomeBlockMenu({
  activeSectionKey,
  blockOptions,
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
  onRemoveCustomBlock,
  onSetDraggedBlock,
  onSetEditorHost,
  onToggleSectionVisibility,
  onUpdateCustomBlock,
  orderedBlockKeys,
  sectionLabel,
  sectionVisible,
}: WebsiteHomeBlockMenuProps) {
  return (
    <div className="shrink-0 space-y-2" data-testid="website-home-block-menu">
      <div className="px-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold">Home page blocks</p>
          <span className={`text-[10px] ${mutedTextClass}`}>{customBlocks.length}/{maxCustomBlocks} custom</span>
        </div>
        <p className={`mt-0.5 text-[11px] leading-4 ${mutedTextClass}`}>These blocks mirror the Live Canvas from top to bottom. Open one to edit it, use the eye to show or hide it, or drag it to change the layout.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            className="flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#ded8cc] bg-white px-2 text-[11px] font-semibold text-[#1e211d] disabled:opacity-45"
            disabled={customBlocks.length >= maxCustomBlocks}
            onClick={() => onAddCustomBlock("text")}
            type="button"
          >
            <Plus className="size-3.5" />
            Text block
          </button>
          <button
            className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-[#1f2a24] px-2 text-[11px] font-semibold text-white disabled:opacity-45"
            disabled={customBlocks.length >= maxCustomBlocks}
            onClick={() => onAddCustomBlock("portfolio")}
            type="button"
          >
            <Plus className="size-3.5" />
            Portfolio grid
          </button>
        </div>
      </div>

      {orderedBlockKeys.map((homeBlockKey) => {
        if (homeBlockKey.startsWith("custom:")) {
          const customBlockId = homeBlockKey.slice("custom:".length)
          const customBlock = customBlocks.find((block) => block.id === customBlockId)
          if (!customBlock) return null

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
                <button
                  aria-label={`Reorder ${customBlock.title}. Use arrow keys or drag.`}
                  className={`flex w-10 shrink-0 cursor-grab items-center justify-center border-r active:cursor-grabbing ${isDark ? "border-white/10 text-white/45" : "border-[#e7e1d7] text-[#9a9185]"}`}
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
                </button>
                <span className="min-w-0 flex-1 px-3 py-3 text-left text-sm font-semibold">
                  <span className="block truncate">{customBlock.title}</span>
                  <span className={`mt-0.5 block text-[11px] font-normal leading-4 ${mutedTextClass}`}>
                    {customBlock.type === "portfolio" ? `${customBlock.galleryIds.length} selected portfolios` : "Custom text section"}
                  </span>
                </span>
                <button
                  aria-label={`${customBlock.visible ? "Hide" : "Show"} ${customBlock.title}`}
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
                  Heading
                  <input
                    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm font-normal ${isDark ? "border-white/10 bg-black/20 text-white" : "border-[#d8d1c5] bg-white text-[#1e211d]"}`}
                    onChange={(event) => onUpdateCustomBlock(customBlock.id, { title: event.target.value })}
                    value={customBlock.title}
                  />
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
                  <div className="flex gap-1">
                    <button className="rounded-md border border-current/15 px-2 py-1 text-[11px] font-semibold" onClick={() => onMoveBlockByOffset(homeBlockKey, -1)} type="button">Move up</button>
                    <button className="rounded-md border border-current/15 px-2 py-1 text-[11px] font-semibold" onClick={() => onMoveBlockByOffset(homeBlockKey, 1)} type="button">Move down</button>
                  </div>
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
              <button
                aria-label={`Reorder ${label}. Use arrow keys or drag.`}
                className={`flex w-10 shrink-0 cursor-grab items-center justify-center border-r active:cursor-grabbing ${isOpen ? "border-[#e0bd69] text-[#99702d]" : isDark ? "border-white/10 text-white/45" : "border-[#e7e1d7] text-[#9a9185]"}`}
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
              </button>
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
