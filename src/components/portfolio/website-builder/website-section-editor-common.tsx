"use client"

import { ChevronUp } from "lucide-react"
import type { ReactNode, Ref } from "react"

import type {
  WebsiteBuilderPageKey,
  WebsiteCustomPage,
  WebsiteNavigationPlacement,
} from "@/lib/website-builder-rules"

type WebsiteSectionEditorShellProps = {
  children: ReactNode
  isDark: boolean
  label: string
  mutedTextClass: string
  onClose: () => void
  scrollRef: Ref<HTMLElement>
}

export function WebsiteSectionEditorShell({
  children,
  isDark,
  label,
  mutedTextClass,
  onClose,
  scrollRef,
}: WebsiteSectionEditorShellProps) {
  return (
    <section className="min-w-0 max-w-full" ref={scrollRef}>
      <div className="min-w-0 max-w-full">
        <div className={`border-b px-4 pt-4 ${isDark ? "border-white/10 bg-[#151713]" : "border-[#ded8cc] bg-white"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Editing</p>
              <h3 className="mt-1 truncate text-base font-semibold">{label}</h3>
            </div>
            <button
              aria-label="Close section editor"
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold ${isDark ? "border-white/10" : "border-[#ded8cc]"}`}
              onClick={onClose}
              title="Close editor"
              type="button"
            >
              <ChevronUp className="size-4" />
              Close
            </button>
          </div>
          <p className={`pb-3 pt-2 text-xs leading-5 ${mutedTextClass}`}>Make your changes below. Use Close or click the page heading again when you are finished.</p>
        </div>
        <div className="space-y-3 p-4">{children}</div>
      </div>
    </section>
  )
}

type WebsiteSectionVisibilityControlProps = {
  checked: boolean
  isDark: boolean
  mutedTextClass: string
  onChange: (visible: boolean) => void
}

export function WebsiteSectionVisibilityControl({
  checked,
  isDark,
  mutedTextClass,
  onChange,
}: WebsiteSectionVisibilityControlProps) {
  return (
    <label
      className={`flex items-center justify-between gap-3 rounded-md border p-3 text-sm ${isDark ? "border-white/10 bg-black/20" : "border-[#e3d3af] bg-white"}`}
      data-website-editor-field="visibility"
    >
      <span>
        <span className="block font-semibold">Show on website</span>
        <span className={`mt-0.5 block text-xs ${mutedTextClass}`}>Display this section in the page body.</span>
      </span>
      <input
        checked={checked}
        className="size-4 shrink-0 accent-[#d8a84f]"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  )
}

type WebsitePageNavigationControlsProps = {
  customPage: WebsiteCustomPage | null
  enabledPages: Record<WebsiteBuilderPageKey, boolean>
  fieldClass: string
  isDark: boolean
  mutedTextClass: string
  navigationLabels: Record<WebsiteBuilderPageKey, string>
  navigationPlacement: Record<WebsiteBuilderPageKey, WebsiteNavigationPlacement>
  onSetCustomPage: (patch: Partial<WebsiteCustomPage>) => void
  onSetPageEnabled: (page: Exclude<WebsiteBuilderPageKey, "home" | "custom">, enabled: boolean) => void
  onSetPageLabel: (page: Exclude<WebsiteBuilderPageKey, "home" | "custom">, label: string) => void
  onSetPagePlacement: (page: Exclude<WebsiteBuilderPageKey, "home" | "custom">, placement: WebsiteNavigationPlacement) => void
  pageSection: Exclude<WebsiteBuilderPageKey, "home"> | null
}

export function WebsitePageNavigationControls({
  customPage,
  enabledPages,
  fieldClass,
  isDark,
  mutedTextClass,
  navigationLabels,
  navigationPlacement,
  onSetCustomPage,
  onSetPageEnabled,
  onSetPageLabel,
  onSetPagePlacement,
  pageSection,
}: WebsitePageNavigationControlsProps) {
  if (pageSection === "custom" && customPage) {
    return (
      <>
        <label className={`flex items-center justify-between gap-3 rounded-md border p-3 text-sm ${isDark ? "border-white/10 bg-black/20" : "border-[#e3d3af] bg-white"}`}>
          <span>
            <span className="block font-semibold">Show navigation link</span>
            <span className={`mt-0.5 block text-xs ${mutedTextClass}`}>Add this custom page to the top menu or website footer.</span>
          </span>
          <input
            checked={customPage.showInNavigation}
            className="size-4 shrink-0 accent-[#d8a84f]"
            onChange={(event) => onSetCustomPage({ showInNavigation: event.target.checked })}
            type="checkbox"
          />
        </label>
        {customPage.showInNavigation ? (
          <>
            <label className="grid gap-1 text-xs font-medium">
              Link position
              <select
                className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                onChange={(event) => onSetCustomPage({ navigationPlacement: event.target.value as WebsiteNavigationPlacement })}
                value={customPage.navigationPlacement}
              >
                <option value="top">Show at top</option>
                <option value="bottom">Show at bottom</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium">
              Link label
              <input
                className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                onChange={(event) => onSetCustomPage({ navigationLabel: event.target.value })}
                value={customPage.navigationLabel}
              />
            </label>
          </>
        ) : null}
      </>
    )
  }

  if (!pageSection || pageSection === "custom") return null

  return (
    <>
      <label className={`flex items-center justify-between gap-3 rounded-md border p-3 text-sm ${isDark ? "border-white/10 bg-black/20" : "border-[#e3d3af] bg-white"}`}>
        <span>
          <span className="block font-semibold">Show navigation link</span>
          <span className={`mt-0.5 block text-xs ${mutedTextClass}`}>Add this page to the top menu or website footer.</span>
        </span>
        <input
          checked={enabledPages[pageSection]}
          className="size-4 shrink-0 accent-[#d8a84f]"
          onChange={(event) => onSetPageEnabled(pageSection, event.target.checked)}
          type="checkbox"
        />
      </label>
      {enabledPages[pageSection] ? (
        <>
          <label className="grid gap-1 text-xs font-medium">
            Link position
            <select
              className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
              onChange={(event) => onSetPagePlacement(pageSection, event.target.value as WebsiteNavigationPlacement)}
              value={navigationPlacement[pageSection]}
            >
              <option value="top">Show at top</option>
              <option value="bottom">Show at bottom</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium">
            Link label
            <input
              className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
              onChange={(event) => onSetPageLabel(pageSection, event.target.value)}
              value={navigationLabels[pageSection]}
            />
          </label>
        </>
      ) : null}
    </>
  )
}

type WebsiteSectionBodyControlsProps = {
  body: string | null
  fieldClass: string
  isDark: boolean
  label: string
  mutedTextClass: string
  onSetShowBody: (showBody: boolean) => void
  onUpdateBody: (body: string) => void
  showBody: boolean
}

export function WebsiteSectionBodyControls({
  body,
  fieldClass,
  isDark,
  label,
  mutedTextClass,
  onSetShowBody,
  onUpdateBody,
  showBody,
}: WebsiteSectionBodyControlsProps) {
  if (body === null) return null

  return (
    <>
      <label className={`flex items-center justify-between gap-3 rounded-md border p-3 text-sm ${isDark ? "border-white/10 bg-black/20" : "border-[#e3d3af] bg-white"}`}>
        <span>
          <span className="block font-semibold">Show body text</span>
          <span className={`mt-0.5 block text-xs ${mutedTextClass}`}>Hide the description without deleting its text.</span>
        </span>
        <input
          checked={showBody}
          className="size-4 shrink-0 accent-[#d8a84f]"
          onChange={(event) => onSetShowBody(event.target.checked)}
          type="checkbox"
        />
      </label>
      <label className="grid gap-1 text-xs font-medium" data-website-editor-field="body">
        <span className="flex items-center justify-between gap-3">
          <span>Body text</span>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
            showBody ? "border-emerald-700/20 text-emerald-700" : "border-current/15 opacity-55"
          }`}>
            {showBody ? "Visible" : "Hidden on website"}
          </span>
        </span>
        <textarea
          aria-label={`${label} body text`}
          autoCapitalize="sentences"
          className={`min-h-28 resize-y rounded-md border px-3 py-2 text-sm font-normal leading-6 outline-none ${fieldClass}`}
          onChange={(event) => onUpdateBody(event.target.value)}
          onDragStart={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          placeholder="Add supporting text"
          rows={8}
          spellCheck
          value={body}
        />
        <span className={`text-[11px] font-normal leading-4 ${mutedTextClass}`}>
          {showBody
            ? "Edit freely and press Return for paragraph spacing. Long-form text and multiple paragraphs are supported."
            : "This text remains saved and editable. Turn on Show body text when you want visitors to see it."}
        </span>
      </label>
    </>
  )
}
