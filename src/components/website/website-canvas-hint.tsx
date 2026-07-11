"use client"

import { Edit3, X } from "lucide-react"
import { createPortal } from "react-dom"

import type { WebsiteControlTarget } from "@/lib/website-walkthroughs"
import type { WebsiteSectionOrderKey } from "@/lib/website-builder-rules"

export type WebsiteCanvasHintState = {
  control: WebsiteControlTarget
  description: string
  left: number
  sectionKey: WebsiteSectionOrderKey
  title: string
  top: number
}

export function WebsiteCanvasHint({
  hint,
  onClose,
  onShowMe,
}: {
  hint: WebsiteCanvasHintState | null
  onClose: () => void
  onShowMe: (sectionKey: WebsiteSectionOrderKey, control: WebsiteControlTarget) => void
}) {
  if (!hint || typeof document === "undefined") return null

  return createPortal(
    <aside
      aria-live="polite"
      className="fixed z-[900] w-[min(18rem,calc(100vw-1.5rem))] rounded-md border border-[#d8a84f] bg-white p-3 text-[#1e211d] shadow-2xl"
      style={{ left: hint.left, top: hint.top }}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#fff3cf] text-[#9b6d22]">
          <Edit3 className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{hint.title}</p>
          <p className="mt-1 text-xs leading-5 text-[#6f685d]">{hint.description}</p>
        </div>
        <button aria-label="Close edit hint" className="grid size-7 shrink-0 place-items-center rounded hover:bg-black/5" onClick={onClose} type="button">
          <X className="size-3.5" />
        </button>
      </div>
      <button
        className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-3 text-xs font-semibold text-white"
        onClick={() => onShowMe(hint.sectionKey, hint.control)}
        type="button"
      >
        <Edit3 className="size-3.5" />
        Show me
      </button>
    </aside>,
    document.body,
  )
}
