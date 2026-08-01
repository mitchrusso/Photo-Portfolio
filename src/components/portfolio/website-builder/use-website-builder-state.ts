"use client"

import { useRef, useState } from "react"
import type { WebsiteCanvasHintState } from "@/components/website/website-canvas-hint"
import type { WebsiteAddressStatus } from "@/components/portfolio/website-builder/website-address-dialog"
import type {
  WebsiteBuilderSectionKey,
  WebsiteBuilderSettings,
  WebsiteBuilderTool,
} from "@/components/portfolio/website-builder/website-builder-model"
import type { WebsitePreviewDevice } from "@/components/portfolio/website-builder/website-builder-toolbar"
import type {
  WebsiteBuilderPageKey,
  WebsiteHomeBlockOrderKey,
  WebsiteSectionOrderKey,
} from "@/lib/website-builder-rules"
import type { WebsiteControlTarget } from "@/lib/website-walkthroughs"

type UploadStatus = "idle" | "uploading" | "uploaded" | "error"
type WebsiteSaveStatus = "idle" | "saving" | "saved" | "local" | "error"

export function useWebsiteBuilderState(createInitialSettings: () => WebsiteBuilderSettings) {
  const [websiteSettings, setWebsiteSettings] = useState(createInitialSettings)
  const [websiteSaveStatus, setWebsiteSaveStatus] = useState<WebsiteSaveStatus>("idle")
  const [savedWebsiteSettingsSnapshot, setSavedWebsiteSettingsSnapshot] = useState<string | null>(null)
  const [websiteBuilderPage, setWebsiteBuilderPage] = useState<WebsiteBuilderPageKey>("home")
  const [activeCustomPageId, setActiveCustomPageId] = useState("custom-1")
  const [websiteBuilderSection, setWebsiteBuilderSection] = useState<WebsiteBuilderSectionKey>("hero")
  const [websiteBuilderTool, setWebsiteBuilderTool] = useState<WebsiteBuilderTool>("pages")
  const [websiteInspectorOpen, setWebsiteInspectorOpen] = useState(false)
  const [websiteInlineEditorHost, setWebsiteInlineEditorHost] = useState<HTMLDivElement | null>(null)
  const [websiteEditHintsEnabled, setWebsiteEditHintsEnabled] = useState(true)
  const [websiteCanvasHint, setWebsiteCanvasHint] = useState<WebsiteCanvasHintState | null>(null)
  const [pendingWebsiteControl, setPendingWebsiteControl] = useState<{
    control: WebsiteControlTarget
    sectionKey: WebsiteSectionOrderKey
  } | null>(null)
  const [websitePreviewDevice, setWebsitePreviewDevice] = useState<WebsitePreviewDevice>("desktop")
  const [websitePublishOpen, setWebsitePublishOpen] = useState(false)
  const [websitePublishedAt, setWebsitePublishedAt] = useState<string | null>(null)
  const [websiteAddressStatus, setWebsiteAddressStatus] = useState<WebsiteAddressStatus>("idle")
  const [websiteAddressError, setWebsiteAddressError] = useState("")
  const [websiteAddressDraft, setWebsiteAddressDraft] = useState("")
  const [draggedWebsiteSection, setDraggedWebsiteSection] = useState<WebsiteHomeBlockOrderKey | null>(null)
  const [draggedWebsitePage, setDraggedWebsitePage] = useState<WebsiteBuilderPageKey | null>(null)
  const [aboutImageUploadStatus, setAboutImageUploadStatus] = useState<UploadStatus>("idle")
  const [aboutImageUploadError, setAboutImageUploadError] = useState("")
  const [aboutVideoUploadStatus, setAboutVideoUploadStatus] = useState<UploadStatus>("idle")
  const [aboutVideoUploadError, setAboutVideoUploadError] = useState("")
  const [aboutVideoConversionProgress, setAboutVideoConversionProgress] = useState<number | null>(null)
  const [siteLogoUploadStatus, setSiteLogoUploadStatus] = useState<UploadStatus>("idle")
  const [siteLogoUploadError, setSiteLogoUploadError] = useState("")
  const [siteBackgroundImageUploadStatus, setSiteBackgroundImageUploadStatus] = useState<UploadStatus>("idle")
  const [siteBackgroundImageUploadError, setSiteBackgroundImageUploadError] = useState("")
  const [heroImageUploadStatus, setHeroImageUploadStatus] = useState<UploadStatus>("idle")
  const [heroVideoUploadStatus, setHeroVideoUploadStatus] = useState<UploadStatus>("idle")
  const [heroVideoUploadError, setHeroVideoUploadError] = useState("")
  const [heroVideoConversionProgress, setHeroVideoConversionProgress] = useState<number | null>(null)
  const [heroLibraryQuery, setHeroLibraryQuery] = useState("")
  const websiteInspectorScrollRef = useRef<HTMLElement>(null)
  const websitePreviewScrollRef = useRef<HTMLDivElement>(null)

  return {
    aboutImageUploadError,
    aboutImageUploadStatus,
    aboutVideoConversionProgress,
    aboutVideoUploadError,
    aboutVideoUploadStatus,
    activeCustomPageId,
    draggedWebsitePage,
    draggedWebsiteSection,
    heroImageUploadStatus,
    heroLibraryQuery,
    heroVideoConversionProgress,
    heroVideoUploadError,
    heroVideoUploadStatus,
    pendingWebsiteControl,
    savedWebsiteSettingsSnapshot,
    setAboutImageUploadError,
    setAboutImageUploadStatus,
    setAboutVideoConversionProgress,
    setAboutVideoUploadError,
    setAboutVideoUploadStatus,
    setActiveCustomPageId,
    setDraggedWebsitePage,
    setDraggedWebsiteSection,
    setHeroImageUploadStatus,
    setHeroLibraryQuery,
    setHeroVideoConversionProgress,
    setHeroVideoUploadError,
    setHeroVideoUploadStatus,
    setPendingWebsiteControl,
    setSavedWebsiteSettingsSnapshot,
    setSiteBackgroundImageUploadError,
    setSiteBackgroundImageUploadStatus,
    setSiteLogoUploadError,
    setSiteLogoUploadStatus,
    setWebsiteAddressDraft,
    setWebsiteAddressError,
    setWebsiteAddressStatus,
    setWebsiteBuilderPage,
    setWebsiteBuilderSection,
    setWebsiteBuilderTool,
    setWebsiteCanvasHint,
    setWebsiteEditHintsEnabled,
    setWebsiteInlineEditorHost,
    setWebsiteInspectorOpen,
    setWebsitePreviewDevice,
    setWebsitePublishedAt,
    setWebsitePublishOpen,
    setWebsiteSaveStatus,
    setWebsiteSettings,
    siteBackgroundImageUploadError,
    siteBackgroundImageUploadStatus,
    siteLogoUploadError,
    siteLogoUploadStatus,
    websiteAddressDraft,
    websiteAddressError,
    websiteAddressStatus,
    websiteBuilderPage,
    websiteBuilderSection,
    websiteBuilderTool,
    websiteCanvasHint,
    websiteEditHintsEnabled,
    websiteInlineEditorHost,
    websiteInspectorOpen,
    websiteInspectorScrollRef,
    websitePreviewDevice,
    websitePreviewScrollRef,
    websitePublishedAt,
    websitePublishOpen,
    websiteSaveStatus,
    websiteSettings,
  }
}
