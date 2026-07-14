import type { PortfolioGallery, PortfolioPhoto } from "@/lib/gallery-utils"
import type { ShowcaseCategory } from "@/lib/showcase-utils"

type Gallery = PortfolioGallery

export type SettingsTab = "setup" | "account" | "design" | "sharing" | "scheduler" | "gallery" | "imports" | "mobile" | "storage"
export type LibraryFilter = "all" | "visible" | "hidden" | "untagged" | "uncaptioned"

export const starterGallery: Gallery = {
  allowDownloads: true,
  client: "Personal",
  cover: "/marketing-preview/sunset-panorama.png",
  description: "Your first portfolio is ready for uploads, curation, and sharing.",
  favorites: 0,
  id: "my-first-portfolio",
  images: 0,
  infoPaneEnabled: false,
  name: "My First Portfolio",
  photoLabelMode: "none",
  photos: [],
  privacy: "Private link",
  revenue: "$0",
  showFileNames: false,
  status: "Draft",
}

const showcaseCategoryByGalleryKeyword: Array<[string, ShowcaseCategory]> = [
  ["sloss", "Architecture"],
  ["chicago", "Architecture"],
  ["slovenia", "Architecture"],
  ["greenland", "Landscape"],
  ["lofoten", "Landscape"],
  ["moab", "Fine Art"],
  ["brazil", "Black & White"],
  ["egypt", "Travel"],
  ["jordan", "Travel"],
  ["myanmar", "Travel"],
  ["bhutan", "Travel"],
]

export const settingsTabs: Array<{ id: SettingsTab; label: string; description: string }> = [
  { id: "setup", label: "Setup", description: "Photographer profile and social accounts" },
  { id: "account", label: "My Account", description: "Plan, usage, billing" },
  { id: "design", label: "Design", description: "Homepage, templates, layout" },
  { id: "sharing", label: "Sharing", description: "Links, embeds, social previews" },
  { id: "scheduler", label: "Scheduler", description: "Paced portfolio sharing" },
  { id: "gallery", label: "Gallery", description: "Access, covers, watermarking" },
  { id: "imports", label: "Imports", description: "SmugMug and direct uploads" },
  { id: "mobile", label: "Mobile", description: "Companion link and install guide" },
  { id: "storage", label: "Storage", description: "Usage and metering context" },
]

export const libraryFilterOptions: Array<{ id: LibraryFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "visible", label: "Visible" },
  { id: "hidden", label: "Hidden" },
  { id: "untagged", label: "Untagged" },
  { id: "uncaptioned", label: "No caption" },
]

export type AccountSummary = {
  billingCycle: "MONTHLY" | "ANNUAL" | null
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
  planName: string
  planSlug: string
  referral: {
    convertedCount: number
    earnedStorageBytes: number
    pendingCount: number
    referralCode: string
    referralUrl: string
    rewardDescription: string
  }
  status: string
  storageLimitBytes: number
  storagePercent: number
  storageUsedBytes: number
  stripeCustomerId: string | null
  trialEndsAt: string | null
  workspaceName: string
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function normalizeGalleryUrl(url?: string) {
  if (!url) return ""

  try {
    const parsedUrl = new URL(url)
    parsedUrl.hash = ""
    parsedUrl.search = ""
    return parsedUrl.toString().replace(/\/$/, "")
  } catch {
    return url.replace(/\/$/, "")
  }
}

export function inferShowcaseCategory(gallery: Gallery): ShowcaseCategory {
  const haystack = `${gallery.id} ${gallery.name}`.toLowerCase()
  const match = showcaseCategoryByGalleryKeyword.find(([keyword]) => haystack.includes(keyword))
  return match?.[1] ?? "Travel"
}

export function buildShowcaseTags(galleryName: string, category: ShowcaseCategory, title: string) {
  const words = `${galleryName} ${title}`
    .split(/[^a-z0-9]+/i)
    .filter((word) => word.length > 4)
    .slice(0, 3)
    .map((word) => word.toLowerCase())

  return Array.from(new Set([category.toLowerCase(), galleryName.toLowerCase(), ...words])).slice(0, 5)
}

export function dedupeImportedGalleries(incoming: Gallery[], current: Gallery[]) {
  const existingUrls = new Set(current.map((gallery) => normalizeGalleryUrl(gallery.url)).filter(Boolean))
  const existingIds = new Set(current.map((gallery) => gallery.id))
  const added: Gallery[] = []
  let skipped = 0

  for (const gallery of incoming) {
    const galleryUrl = normalizeGalleryUrl(gallery.url)

    if (galleryUrl && existingUrls.has(galleryUrl)) {
      skipped += 1
      continue
    }

    let id = gallery.id
    if (existingIds.has(id)) {
      id = `${id}-${Date.now()}-${added.length + 1}`
    }

    existingIds.add(id)
    if (galleryUrl) existingUrls.add(galleryUrl)
    added.push({ ...gallery, id })
  }

  return { galleries: [...added, ...current], added, skipped }
}

export type ImportResult = {
  source: string
  found: number
  added: number
  skipped: number
}
export type ActivePanel = "photos" | "library" | "settings" | "website"
export type ShowcaseSubmitStatus = "idle" | "submitted" | "duplicate" | "removed"
export type LibraryPhotoItem = {
  gallery: Gallery
  key: string
  photo: PortfolioPhoto
}
export type AiPortfolioSuggestion = {
  captionUpdates: Array<{
    caption: string
    photoId: string
    tags: string[]
  }>
  coverPhotoId: string
  coverReason: string
  duplicateGroups: Array<{
    photoIds: string[]
    reason: string
  }>
  intro: string
  orderReason: string
  orderedPhotoIds: string[]
  socialPosts: {
    email: string
    facebook: string
    instagram: string
    linkedin: string
    pinterest: string
    x: string
  }
  titleIdeas: string[]
}
export type AiPortfolioAction = "curate" | "social"
export type MobileImportPreview = {
  file: File
  id: string
  selected: boolean
  url: string
}
export type WebsiteWorkPhotoItem = {
  id: string
  source: string
  title: string
}
export type WebsiteTripEntry = {
  body: string
  id: string
  linkLabel: string
  linkUrl: string
  meta: string
  title: string
}

