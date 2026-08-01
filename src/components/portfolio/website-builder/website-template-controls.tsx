"use client"

import { ChevronDown, ChevronUp, Palette, Upload } from "lucide-react"
import Image from "next/image"

import {
  normalizeWebsiteBackgroundBrightness,
  normalizeWebsiteBackgroundScreenBack,
} from "@/lib/website-background-style"
import type { WebsiteContentWidthMode } from "@/lib/website-builder-rules"
import type { WebsiteImageFrame } from "@/lib/website-image-frame"

export type WebsiteFontStyle = "clean" | "editorial" | "classic" | "mono"
export type WebsiteImageShape = "square" | "soft" | "pill" | "arch"

export const websiteFontOptions: Array<{ key: WebsiteFontStyle; label: string; note: string }> = [
  { key: "clean", label: "Clean", note: "Modern, simple, easy to scan" },
  { key: "editorial", label: "Editorial", note: "Magazine-like headlines" },
  { key: "classic", label: "Classic", note: "Warmer serif photography feel" },
  { key: "mono", label: "Field notes", note: "Travel journal and archive style" },
]

export const websiteFrameOptions: Array<{ key: WebsiteImageFrame; label: string; note: string }> = [
  { key: "none", label: "None", note: "Images sit directly on the page" },
  { key: "thin", label: "Thin", note: "A quiet gallery border" },
  { key: "gold", label: "Gold", note: "A warm premium frame" },
  { key: "shadow", label: "Shadow", note: "Lifted card presentation" },
  { key: "print", label: "Print", note: "White mat around images" },
]

export const websiteShapeOptions: Array<{ key: WebsiteImageShape; label: string; note: string }> = [
  { key: "square", label: "Square", note: "Sharp editorial edges" },
  { key: "soft", label: "Soft", note: "Small rounded corners" },
  { key: "pill", label: "Rounded", note: "Larger rounded corners" },
  { key: "arch", label: "Arch", note: "Portrait-forward arch shape" },
]

export type WebsiteTemplateControlSettings = {
  contentWidthMode: WebsiteContentWidthMode
  imageFrame: WebsiteImageFrame
  imageFrameThickness: number
  imageShape: WebsiteImageShape
  siteAccentColor: string
  siteBackgroundColor: string
  siteBackgroundImageBrightness: number
  siteBackgroundImageScreenBack: number
  siteBackgroundImageUrl: string
  siteFontStyle: WebsiteFontStyle
  siteTextColor: string
}

type UploadStatus = "idle" | "uploading" | "uploaded" | "error"

type WebsiteTemplateControlsProps = {
  fieldClass: string
  frameThickness: number
  isDark: boolean
  isOpen: boolean
  mutedTextClass: string
  onClose: () => void
  onRemoveBackground: () => void
  onToggle: () => void
  onUpdate: (patch: Partial<WebsiteTemplateControlSettings>) => void
  onUploadBackground: (file: File) => void
  settings: WebsiteTemplateControlSettings
  uploadError: string
  uploadStatus: UploadStatus
}

const contentWidthOptions: Array<{ key: WebsiteContentWidthMode; label: string; note: string }> = [
  {
    key: "adaptive",
    label: "Adaptive Width",
    note: "Comfortable reading width on large screens; automatically fills phones and tablets.",
  },
  {
    key: "full",
    label: "Full Screen",
    note: "Uses the available browser width while keeping safe margins on small screens.",
  },
]

const colorOptions = [
  { label: "Background", key: "siteBackgroundColor" as const },
  { label: "Text", key: "siteTextColor" as const },
  { label: "Accent", key: "siteAccentColor" as const },
]

export function WebsiteTemplateControls({
  fieldClass,
  frameThickness,
  isDark,
  isOpen,
  mutedTextClass,
  onClose,
  onRemoveBackground,
  onToggle,
  onUpdate,
  onUploadBackground,
  settings,
  uploadError,
  uploadStatus,
}: WebsiteTemplateControlsProps) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-md border transition ${isOpen ? "border-[#d8a84f] bg-[#fff8e8] text-[#1e211d] shadow-[0_8px_24px_rgba(96,66,23,0.12)]" : isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}
      data-testid="website-template-controls-card"
    >
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm font-semibold"
        onClick={onToggle}
        title="Open responsive width, colors, background, fonts, frames, and image-shape controls"
        type="button"
      >
        <span className="flex min-w-0 items-center gap-3">
          <Palette className="size-4 shrink-0 text-[#99702d]" />
          <span className="min-w-0">
            <span className="block">Template controls</span>
            <span className={`mt-0.5 block text-[11px] font-normal leading-4 ${isOpen ? "text-[#735223]" : mutedTextClass}`}>
              Customize colors, fonts, image frames, and shapes; choose responsive width
            </span>
          </span>
        </span>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? (
        <div
          aria-label="Scrollable template controls"
          className={`space-y-5 overflow-y-scroll overscroll-contain border-t p-3 pr-2 ${isDark ? "border-white/10" : "border-[#e0bd69]"}`}
          data-testid="website-template-controls-panel"
          onWheelCapture={(event) => event.stopPropagation()}
          style={{ height: "min(52vh, 520px)", scrollbarGutter: "stable" }}
          tabIndex={0}
        >
          <div className="grid gap-2">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Colors</p>
            {colorOptions.map((color) => (
              <label className="flex items-center justify-between gap-3 text-xs font-semibold" key={color.key}>
                {color.label}
                <span className="flex items-center gap-2">
                  <input
                    aria-label={`${color.label} color`}
                    className="size-8 cursor-pointer rounded border border-current/20 bg-transparent p-0"
                    onChange={(event) => onUpdate({ [color.key]: event.target.value })}
                    type="color"
                    value={settings[color.key]}
                  />
                  <input
                    aria-label={`${color.label} hex value`}
                    className={`h-8 w-24 rounded-md border px-2 font-mono text-[11px] font-normal uppercase outline-none ${fieldClass}`}
                    maxLength={7}
                    onChange={(event) => {
                      const value = event.target.value
                      if (/^#[0-9a-f]{6}$/i.test(value)) onUpdate({ [color.key]: value })
                    }}
                    value={settings[color.key]}
                  />
                </span>
              </label>
            ))}
          </div>

          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Content width</p>
            <div
              aria-label="Website content width"
              className="mt-2 grid grid-cols-2 gap-2"
              role="group"
              title="Choose how much horizontal space the website uses. Both choices automatically adapt to phones and tablets."
            >
              {contentWidthOptions.map((option) => (
                <button
                  aria-pressed={settings.contentWidthMode === option.key}
                  className={`rounded-md border p-2 text-left ${
                    settings.contentWidthMode === option.key
                      ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]"
                      : isDark ? "border-white/10" : "border-[#ded8cc]"
                  }`}
                  key={option.key}
                  onClick={() => onUpdate({ contentWidthMode: option.key })}
                  title={option.note}
                  type="button"
                >
                  <span className="block text-xs font-semibold">{option.label}</span>
                  <span className="mt-1 block text-[10px] font-normal leading-4 opacity-70">{option.note}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-[#ded8cc] bg-white p-3 text-[#1e211d]">
            <p className="text-xs font-semibold">Background image <span className="font-normal text-[#756c60]">(optional)</span></p>
            <p className="mt-1 text-[11px] leading-4 text-[#756c60]">Upload your own image to cover the website background. The background color above remains visible while the image loads and wherever it does not cover.</p>
            {settings.siteBackgroundImageUrl ? (
              <div className="relative mt-3 aspect-[16/7] overflow-hidden rounded-md border border-[#ded8cc] bg-[#f4efe6]">
                <Image
                  alt="Current website background"
                  className="object-cover"
                  fill
                  sizes="320px"
                  src={settings.siteBackgroundImageUrl}
                  unoptimized
                />
                {settings.siteBackgroundImageScreenBack > 0 ? (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      backgroundColor: settings.siteBackgroundColor,
                      opacity: settings.siteBackgroundImageScreenBack / 100,
                    }}
                  />
                ) : null}
                {settings.siteBackgroundImageBrightness !== 100 ? (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      backgroundColor: settings.siteBackgroundImageBrightness < 100 ? "#000000" : "#ffffff",
                      opacity: settings.siteBackgroundImageBrightness < 100
                        ? 1 - settings.siteBackgroundImageBrightness / 100
                        : (settings.siteBackgroundImageBrightness - 100) / 100,
                    }}
                  />
                ) : null}
              </div>
            ) : null}

            <label className={`mt-3 block rounded-md border border-[#ded8cc] p-3 ${settings.siteBackgroundImageUrl ? "bg-[#fbfaf7]" : "bg-[#f3f1ec] opacity-60"}`}>
              <span className="flex items-center justify-between gap-3 text-xs font-semibold">
                Screen back image
                <span>{settings.siteBackgroundImageScreenBack}%</span>
              </span>
              <input
                aria-label="Screen back website background image"
                className="mt-2 w-full accent-[#d8a84f]"
                disabled={!settings.siteBackgroundImageUrl}
                max="100"
                min="0"
                onChange={(event) => onUpdate({
                  siteBackgroundImageScreenBack: normalizeWebsiteBackgroundScreenBack(event.target.value),
                })}
                step="5"
                type="range"
                value={settings.siteBackgroundImageScreenBack}
              />
              <span className="mt-1 block text-[11px] font-normal leading-4 text-[#756c60]">Move right to fade the image toward the selected background color. At 0% the image is fully visible; at 100% only the color remains.</span>
            </label>

            <label className={`mt-3 block rounded-md border border-[#ded8cc] p-3 ${settings.siteBackgroundImageUrl ? "bg-[#fbfaf7]" : "bg-[#f3f1ec] opacity-60"}`}>
              <span className="flex items-center justify-between gap-3 text-xs font-semibold">
                Brightness
                <span>{settings.siteBackgroundImageBrightness}%</span>
              </span>
              <input
                aria-label="Website background image brightness"
                className="mt-2 w-full accent-[#d8a84f]"
                disabled={!settings.siteBackgroundImageUrl}
                max="175"
                min="25"
                onChange={(event) => onUpdate({
                  siteBackgroundImageBrightness: normalizeWebsiteBackgroundBrightness(event.target.value),
                })}
                step="5"
                type="range"
                value={settings.siteBackgroundImageBrightness}
              />
              <span className="mt-1 block text-[11px] font-normal leading-4 text-[#756c60]">100% keeps the original brightness. Move left to darken the image or right to brighten it.</span>
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-[#1f2a24] px-3 text-xs font-semibold text-white">
                <Upload className="size-4" />
                {uploadStatus === "uploading"
                  ? "Uploading…"
                  : settings.siteBackgroundImageUrl
                    ? "Replace image"
                    : "Upload background"}
                <input
                  accept="image/avif,image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={uploadStatus === "uploading"}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) onUploadBackground(file)
                    event.currentTarget.value = ""
                  }}
                  type="file"
                />
              </label>
              {settings.siteBackgroundImageUrl ? (
                <button
                  className="h-10 rounded-md border border-[#d8cfc1] bg-white px-3 text-xs font-semibold text-[#8f2019]"
                  onClick={onRemoveBackground}
                  type="button"
                >
                  Remove image
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-[11px] leading-4 text-[#756c60]">For the best result, use a high-resolution landscape image with enough contrast for your text.</p>
            {uploadStatus === "error" ? <p className="mt-2 text-xs font-semibold text-[#b42318]">{uploadError}</p> : null}
          </div>

          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Font</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {websiteFontOptions.map((option) => (
                <button
                  className={`rounded-md border px-2 py-2 text-left text-xs ${settings.siteFontStyle === option.key ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]" : isDark ? "border-white/10" : "border-[#ded8cc]"}`}
                  key={option.key}
                  onClick={() => onUpdate({ siteFontStyle: option.key })}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Image frame</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {websiteFrameOptions.map((option) => (
                <button
                  className={`rounded-md border px-2 py-2 text-left text-xs ${settings.imageFrame === option.key ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]" : isDark ? "border-white/10" : "border-[#ded8cc]"}`}
                  key={option.key}
                  onClick={() => onUpdate({ imageFrame: option.key })}
                  title={option.key === "none"
                    ? "Remove the gold box, border, mat, or shadow from the Hero and other website images"
                    : `${option.label}: ${option.note}`}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className={`mt-3 grid gap-2 text-xs ${settings.imageFrame === "none" ? "opacity-45" : ""}`}>
                  <span className="flex justify-between"><span>Thickness</span><span>{frameThickness}px</span></span>
                  <input
                    aria-label="Image frame line thickness"
                    className="accent-[#d8a84f]"
                disabled={settings.imageFrame === "none"}
                max="16"
                min="1"
                onChange={(event) => onUpdate({ imageFrameThickness: Number(event.target.value) })}
                onInput={(event) => {
                  const nextImageFrameThickness = Number(event.currentTarget.value)
                  onUpdate({ imageFrameThickness: nextImageFrameThickness })
                }}
                step="1"
                title={settings.imageFrame === "none" ? "Choose a frame style before adjusting thickness" : "Adjust the website image-frame line from 1 to 16 pixels"}
                type="range"
                value={frameThickness || 1}
              />
            </label>
          </div>

          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Image shape</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {websiteShapeOptions.map((option) => (
                <button
                  className={`rounded-md border px-2 py-2 text-left text-xs ${settings.imageShape === option.key ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]" : isDark ? "border-white/10" : "border-[#ded8cc]"}`}
                  key={option.key}
                  onClick={() => onUpdate({ imageShape: option.key })}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            aria-label="Close Template controls"
            className={`flex h-11 w-full items-center justify-center gap-2 rounded-md border text-sm font-semibold ${isDark ? "border-white/15 bg-white/[0.06]" : "border-[#cfc5b5] bg-white"}`}
            onClick={onClose}
            type="button"
          >
            <ChevronUp className="size-4" />
            Close section
          </button>
        </div>
      ) : null}
    </div>
  )
}
