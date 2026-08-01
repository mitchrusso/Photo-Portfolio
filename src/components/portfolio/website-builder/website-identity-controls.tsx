"use client"

import { ChevronDown, ChevronUp, ImagePlus, Upload } from "lucide-react"
import Image from "next/image"

type WebsiteIdentityControlsProps = {
  fieldClass: string
  isDark: boolean
  isOpen: boolean
  mutedTextClass: string
  onClose: () => void
  onRemoveLogo: () => void
  onSetSiteName: (siteName: string) => void
  onSetShowIdentity: (showIdentity: boolean) => void
  onToggle: () => void
  onUploadLogo: (file: File) => void
  showSiteIdentity: boolean
  siteLogoUploadError: string
  siteLogoUploadStatus: "idle" | "uploading" | "uploaded" | "error"
  siteLogoUrl: string
  siteName: string
}

export function WebsiteIdentityControls({
  fieldClass,
  isDark,
  isOpen,
  mutedTextClass,
  onClose,
  onRemoveLogo,
  onSetSiteName,
  onSetShowIdentity,
  onToggle,
  onUploadLogo,
  showSiteIdentity,
  siteLogoUploadError,
  siteLogoUploadStatus,
  siteLogoUrl,
  siteName,
}: WebsiteIdentityControlsProps) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-md border transition ${isOpen ? "border-[#d8a84f] bg-[#fff8e8] text-[#1e211d] shadow-[0_8px_24px_rgba(96,66,23,0.12)]" : isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}
      data-testid="website-identity-controls-card"
    >
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm font-semibold"
        onClick={onToggle}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-3">
          <ImagePlus className="size-4 shrink-0 text-[#99702d]" />
          <span className="min-w-0">
            <span className="block">Website identity</span>
            <span className={`mt-0.5 block text-[11px] font-normal leading-4 ${isOpen ? "text-[#735223]" : mutedTextClass}`}>
              Add the name and optional logo shown at the top of your site
            </span>
          </span>
        </span>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? (
        <div className={`space-y-4 border-t p-3 ${isDark ? "border-white/10" : "border-[#e0bd69]"}`}>
          <label className="flex items-start gap-3 rounded-md border border-[#ded8cc] bg-white p-3 text-xs text-[#1e211d]">
            <input
              checked={showSiteIdentity}
              className="mt-0.5 size-4 accent-[#d8a84f]"
              onChange={(event) => onSetShowIdentity(event.target.checked)}
              type="checkbox"
            />
            <span>
              <span className="block font-semibold">Show name and logo</span>
              <span className="mt-1 block leading-5 text-[#756c60]">Display this identity in the header on every website page.</span>
            </span>
          </label>

          <label className="grid gap-2 text-xs font-semibold">
            Website name
            <input
              className={`h-10 rounded-md border px-3 text-sm outline-none ${fieldClass}`}
              maxLength={80}
              onChange={(event) => onSetSiteName(event.target.value)}
              placeholder="Your name or photography business"
              value={siteName}
            />
            <span className={`font-normal leading-4 ${mutedTextClass}`}>Use your name, studio name, or the title visitors should recognize.</span>
          </label>

          <div>
            <p className="text-xs font-semibold">Logo <span className="font-normal text-[#756c60]">(optional)</span></p>
            {siteLogoUrl ? (
              <div className="mt-2 flex items-center gap-3 rounded-md border border-[#ded8cc] bg-white p-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-[#e7e1d7] bg-[#f7f4ee]">
                  <Image alt="Current website logo" className="object-contain p-1" fill sizes="56px" src={siteLogoUrl} unoptimized />
                </div>
                <p className="min-w-0 text-xs leading-5 text-[#756c60]">Your uploaded logo will be fitted into the header without cropping.</p>
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-[#1f2a24] px-3 text-xs font-semibold text-white">
                <Upload className="size-4" />
                {siteLogoUploadStatus === "uploading" ? "Uploading…" : siteLogoUrl ? "Replace logo" : "Upload logo"}
                <input
                  accept="image/avif,image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={siteLogoUploadStatus === "uploading"}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) onUploadLogo(file)
                    event.currentTarget.value = ""
                  }}
                  type="file"
                />
              </label>
              {siteLogoUrl ? (
                <button
                  className="h-10 rounded-md border border-[#d8cfc1] bg-white px-3 text-xs font-semibold text-[#8f2019]"
                  onClick={onRemoveLogo}
                  type="button"
                >
                  Remove logo
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-[11px] leading-4 text-[#756c60]">PNG with a transparent background works best. JPG, WebP, and AVIF are also supported.</p>
            {siteLogoUploadStatus === "error" ? <p className="mt-2 text-xs font-semibold text-[#b42318]">{siteLogoUploadError}</p> : null}
          </div>

          <button
            aria-label="Close Website identity controls"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#cfc5b5] bg-white text-sm font-semibold"
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
