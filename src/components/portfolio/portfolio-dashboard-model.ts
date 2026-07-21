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

export const settingsTabs: Array<{ id: SettingsTab; label: string; description: string; help: string; helpQuestion: string }> = [
  { id: "setup", label: "Social Settings", description: "Social profile links and sharing destinations", help: "Add the public social profiles you use to promote your work. Saved accounts become available throughout PhotoView.io sharing tools.", helpQuestion: "How do I add and manage my social profile links?" },
  { id: "account", label: "My Account", description: "Plan, usage, and billing", help: "Confirm the signed-in account, review plan and trial status, manage payment details, referrals, cancellation, and subscriber access.", helpQuestion: "How do I manage my PhotoView.io account, plan, and billing?" },
  { id: "design", label: "Design", description: "Homepage, templates, and layout", help: "Choose the portfolio used in the live preview, compare gallery templates, and tune the visual presentation of your work.", helpQuestion: "How do I choose and customize a gallery design?" },
  { id: "sharing", label: "Sharing", description: "Links, embeds, social previews, and QR codes", help: "Choose exactly what to share, then copy a link, send an invitation, create an embed, open a social destination, or generate a QR code.", helpQuestion: "How do I share a portfolio, use a QR code, or create an embed?" },
  { id: "scheduler", label: "Scheduler", description: "Designed, paced social campaigns", help: "Build a campaign, select photographs and connected accounts, control timing, review every prepared post, and activate only when ready.", helpQuestion: "How do I build, review, and activate a social media campaign?" },
  { id: "gallery", label: "Portfolio", description: "Access, covers, downloads, and watermarking", help: "Control public access, privacy, downloads, cover behavior, photo labels, and text or custom-image watermarks for the active portfolio.", helpQuestion: "How do I control portfolio access, downloads, covers, and watermarks?" },
  { id: "imports", label: "Imports", description: "Lightroom, Phone, Smart Folders, SmugMug Import, and Photo Upload", help: "Choose one focused import page across the top. Each system includes its setup, destination controls, and step-by-step help.", helpQuestion: "Which import method should I use, and how do I set it up?" },
  { id: "mobile", label: "Mobile", description: "Companion link and install guide", help: "Create a phone-friendly link, choose the portfolios it includes, send it, and add the experience to a phone home screen.", helpQuestion: "How do I create, send, and install a mobile companion link?" },
  { id: "storage", label: "Storage", description: "Usage, file counts, and plan capacity", help: "See how much capacity is used, understand which files count toward storage, and learn what happens as the account approaches its limit.", helpQuestion: "What counts toward storage and what happens when I approach my limit?" },
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
  galleryId?: string
  id: string
  linkLabel: string
  linkUrl: string
  meta: string
  title: string
}
