"use client"

import {
  ChevronLeft,
  Globe2,
  Monitor,
  Moon,
  MousePointer2,
  Save,
  Smartphone,
  Sparkles,
  Sun,
} from "lucide-react"
import type { ReactNode } from "react"

import { AskAiHelp } from "@/components/ai/ask-ai-help"
import { ReleaseNotifications } from "@/components/portfolio/release-notifications"
import type { WebsiteBuilderPageKey } from "@/lib/website-builder-rules"

export type WebsitePreviewDevice = "desktop" | "mobile"
export type WebsiteSaveStatus = "idle" | "saving" | "saved" | "local" | "error"

type WebsitePageOption = {
  key: WebsiteBuilderPageKey
  label: string
}

type WebsiteBuilderToolbarProps = {
  fieldClass: string
  hasUnsavedChanges: boolean
  isDark: boolean
  mutedTextClass: string
  onBack: () => void
  onOpenAddress: () => void
  onOpenTour: () => void
  onSave: () => void
  onSelectPage: (page: WebsiteBuilderPageKey) => void
  onSetPreviewDevice: (device: WebsitePreviewDevice) => void
  onToggleEditHints: () => void
  onToggleTheme: () => void
  page: WebsiteBuilderPageKey
  pageOptions: WebsitePageOption[]
  previewDevice: WebsitePreviewDevice
  publishedAt: string | null
  saveStatus: WebsiteSaveStatus
  surfaceClass: string
  websiteEditHintsEnabled: boolean
}

function WebsiteToolbarTooltip({
  align = "center",
  children,
  label,
}: {
  align?: "center" | "left" | "right"
  children: ReactNode
  label: string
}) {
  const positionClass = align === "left"
    ? "left-0"
    : align === "right"
      ? "right-0"
      : "left-1/2 -translate-x-1/2"

  return (
    <div className="group/website-toolbar-tip relative flex shrink-0">
      {children}
      <span
        className={`pointer-events-none absolute top-[calc(100%+0.5rem)] z-[90] hidden w-max max-w-56 rounded-md bg-[#1f2a24] px-2.5 py-1.5 text-center text-[11px] font-semibold leading-4 text-white shadow-lg group-hover/website-toolbar-tip:block group-focus-within/website-toolbar-tip:block ${positionClass}`}
        role="tooltip"
      >
        {label}
      </span>
    </div>
  )
}

export function WebsiteBuilderToolbar({
  fieldClass,
  hasUnsavedChanges,
  isDark,
  mutedTextClass,
  onBack,
  onOpenAddress,
  onOpenTour,
  onSave,
  onSelectPage,
  onSetPreviewDevice,
  onToggleEditHints,
  onToggleTheme,
  page,
  pageOptions,
  previewDevice,
  publishedAt,
  saveStatus,
  surfaceClass,
  websiteEditHintsEnabled,
}: WebsiteBuilderToolbarProps) {
  const publishedLabel = publishedAt
    ? `Published ${new Date(publishedAt).toLocaleString()}`
    : "This website is still a draft and is not live"

  return (
    <div className={`sticky top-0 z-40 flex min-w-0 flex-wrap items-center gap-2 overflow-visible rounded-md border px-3 py-2 shadow-sm ${surfaceClass}`} data-testid="website-builder-toolbar">
      <div className="flex w-full min-w-0 flex-wrap items-center gap-2 xl:w-auto xl:flex-1 xl:flex-nowrap">
        <WebsiteToolbarTooltip align="left" label="Back to the photo dashboard">
          <button
            aria-label="Back to dashboard"
            className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/15 bg-white/10 text-white" : "border-[#d4cdc0] bg-white"}`}
            onClick={onBack}
            type="button"
          >
            <ChevronLeft className="size-4" />
            <span className="hidden 2xl:inline">Dashboard</span>
          </button>
        </WebsiteToolbarTooltip>
        <div className="flex h-10 items-center gap-2 px-1">
          <Globe2 className="size-5 text-[#99702d]" />
          <span className="hidden text-base font-semibold 2xl:inline">Site</span>
        </div>
        <WebsiteToolbarTooltip label="Choose the website page to edit">
          <label className={`flex h-10 min-w-32 items-center gap-2 rounded-md border px-3 2xl:min-w-40 ${fieldClass}`}>
            <span className={`hidden text-xs font-semibold 2xl:inline ${mutedTextClass}`}>Focus</span>
            <select
              aria-label="Page or section to focus"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
              onChange={(event) => onSelectPage(event.target.value as WebsiteBuilderPageKey)}
              value={page}
            >
              {pageOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </label>
        </WebsiteToolbarTooltip>
        <div className={`flex h-10 items-center rounded-md border p-1 ${isDark ? "border-white/15 bg-white/[0.04]" : "border-[#d4cdc0] bg-[#f6f3ed]"}`}>
          <WebsiteToolbarTooltip label="Show the desktop layout">
            <button
              aria-label="Desktop preview"
              className={`flex size-8 items-center justify-center rounded ${previewDevice === "desktop" ? "bg-[#1f2a24] text-white" : mutedTextClass}`}
              onClick={() => onSetPreviewDevice("desktop")}
              title="Desktop preview"
              type="button"
            >
              <Monitor className="size-4" />
            </button>
          </WebsiteToolbarTooltip>
          <WebsiteToolbarTooltip label="Show the mobile layout">
            <button
              aria-label="Mobile preview"
              className={`flex size-8 items-center justify-center rounded ${previewDevice === "mobile" ? "bg-[#1f2a24] text-white" : mutedTextClass}`}
              onClick={() => onSetPreviewDevice("mobile")}
              title="Mobile preview"
              type="button"
            >
              <Smartphone className="size-4" />
            </button>
          </WebsiteToolbarTooltip>
        </div>
        <WebsiteToolbarTooltip label={`${websiteEditHintsEnabled ? "Turn off" : "Turn on"} editing guidance inside the Live Canvas`}>
          <button
            aria-label={`Turn Edit Hints ${websiteEditHintsEnabled ? "off" : "on"}`}
            aria-pressed={websiteEditHintsEnabled}
            className={`flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-xs font-semibold ${
              websiteEditHintsEnabled
                ? "border-[#d8a84f] bg-[#fff8e8] text-[#735223]"
                : isDark
                  ? "border-white/15 bg-white/[0.04]"
                  : "border-[#d4cdc0] bg-white"
            }`}
            onClick={onToggleEditHints}
            title={`${websiteEditHintsEnabled ? "Turn off" : "Turn on"} helpful edit directions for the Live Canvas`}
            type="button"
          >
            <MousePointer2 className="size-4" />
            <span className="hidden 2xl:inline">Hints: {websiteEditHintsEnabled ? "On" : "Off"}</span>
            <span
              aria-hidden="true"
              className={`relative h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors ${websiteEditHintsEnabled ? "bg-[#c58b25]" : isDark ? "bg-white/20" : "bg-[#c9c4ba]"}`}
            >
              <span
                className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${websiteEditHintsEnabled ? "translate-x-4" : "translate-x-0"}`}
              />
            </span>
          </button>
        </WebsiteToolbarTooltip>
        <WebsiteToolbarTooltip label="Ask AI how to use PhotoView">
          <AskAiHelp
            buttonClassName={`flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-medium max-2xl:w-10 max-2xl:justify-center max-2xl:gap-0 max-2xl:px-0 max-2xl:text-[0px] ${
              isDark ? "border-[#d8a84f]/35 bg-[#d8a84f]/15 text-[#f7dd9a]" : "border-[#d8a84f] bg-[#fff8e8] text-[#735223]"
            }`}
          />
        </WebsiteToolbarTooltip>
        <WebsiteToolbarTooltip label="Start a guided website-builder tour">
          <button
            aria-label="Take a Tour"
            className={`flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-medium max-2xl:w-10 max-2xl:justify-center max-2xl:gap-0 max-2xl:px-0 max-2xl:text-[0px] ${
              isDark ? "border-[#d8a84f]/35 bg-[#d8a84f]/15 text-[#f7dd9a]" : "border-[#d8a84f] bg-[#fff8e8] text-[#735223]"
            }`}
            onClick={onOpenTour}
            title="Take a guided tour"
            type="button"
          >
            <Sparkles className="size-4" />
            Take a Tour
          </button>
        </WebsiteToolbarTooltip>
        <WebsiteToolbarTooltip label="Review new PhotoView features">
          <ReleaseNotifications isDark={isDark} />
        </WebsiteToolbarTooltip>
        <WebsiteToolbarTooltip label={isDark ? "Switch to the light interface" : "Switch to the dark interface"}>
          <button
            aria-label={isDark ? "Use light theme" : "Use dark theme"}
            className={`grid size-10 shrink-0 place-items-center rounded-md border ${
              isDark ? "border-white/15 bg-white/10 text-white" : "border-[#d4cdc0] bg-white"
            }`}
            onClick={onToggleTheme}
            title={isDark ? "Light theme" : "Dark theme"}
            type="button"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </WebsiteToolbarTooltip>
      </div>
      <div className="flex w-full min-w-0 flex-wrap items-center gap-2 xl:ml-auto xl:w-auto xl:shrink-0 xl:flex-nowrap">
        <WebsiteToolbarTooltip label={publishedLabel}>
          <span
            className={`flex h-10 items-center rounded-md border px-3 text-xs font-semibold ${
              publishedAt
                ? "border-[#b9c99d] bg-[#e9f1dc] text-[#466026]"
                : "border-[#d8a84f]/50 bg-[#fff8e8] text-[#735223]"
            }`}
            title={publishedAt ? `Last published ${new Date(publishedAt).toLocaleString()}` : "This website address is not live until you publish it from Preview."}
          >
            {publishedAt ? "Published" : "Draft—not live"}
          </span>
        </WebsiteToolbarTooltip>
        {saveStatus === "saving" ? (
          <span className="flex h-10 items-center rounded-md bg-[#f2eee7] px-3 text-xs font-semibold text-[#6b6257]">Saving…</span>
        ) : null}
        {saveStatus === "saved" ? (
          <span className="flex h-10 items-center rounded-md bg-[#e9f1dc] px-3 text-xs font-semibold text-[#466026]">Saved to account</span>
        ) : null}
        {saveStatus === "local" ? (
          <span className="flex h-10 items-center rounded-md bg-[#fff8e8] px-3 text-xs font-semibold text-[#735223]">Saved on this device</span>
        ) : null}
        {saveStatus === "error" ? (
          <span className="flex h-10 items-center rounded-md bg-red-50 px-3 text-xs font-semibold text-red-700">Save failed</span>
        ) : null}
        <WebsiteToolbarTooltip label={hasUnsavedChanges ? "Save your website draft" : "Your website draft is saved"}>
          <button
            className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold disabled:cursor-default ${hasUnsavedChanges ? "border-[#9f1f17] bg-[#b42318] text-white shadow-sm hover:bg-[#941b14]" : isDark ? "border-white/15 bg-white/10 text-white/65" : "border-[#d4cdc0] bg-[#f5f2ec] text-[#777064]"}`}
            disabled={saveStatus === "saving" || !hasUnsavedChanges}
            onClick={onSave}
            type="button"
          >
            <Save className="size-4" />
            {saveStatus === "saving" ? "Saving…" : hasUnsavedChanges ? "Save" : "Saved"}
          </button>
        </WebsiteToolbarTooltip>
        <WebsiteToolbarTooltip align="right" label="Choose or review the website address">
          <button
            className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/15 bg-white/10 text-white" : "border-[#d4cdc0] bg-white"}`}
            onClick={onOpenAddress}
            title="Website address"
            type="button"
          >
            <Globe2 className="size-4" />
            Address
          </button>
        </WebsiteToolbarTooltip>
      </div>
    </div>
  )
}
