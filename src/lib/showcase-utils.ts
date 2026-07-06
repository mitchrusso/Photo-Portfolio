import { migratedGalleries } from "@/data/migrated-galleries"
import { getDisplayUrl, getThumbnailUrl, isRenderableImage } from "@/lib/gallery-utils"

export const SHOWCASE_SUBMISSIONS_STORAGE_KEY = "photoviewpro-showcase-submissions-v1"
export const SHOWCASE_VOTES_STORAGE_KEY = "photoviewpro-showcase-votes-v1"
export const SHOWCASE_COMMENTS_STORAGE_KEY = "photoviewpro-showcase-comments-v1"

export type ShowcaseCategory =
  | "Architecture"
  | "Black & White"
  | "Fine Art"
  | "Landscape"
  | "Street"
  | "Travel"
  | "Wildlife"

export type ShowcaseStatus = "Pending" | "Approved" | "Rejected" | "Featured"

export type ShowcasePhoto = {
  id: string
  category: ShowcaseCategory
  comments: number
  imageUrl: string
  location?: string
  photographer: string
  portfolioId: string
  portfolioName: string
  status: ShowcaseStatus
  submittedAt: string
  tags: string[]
  thumbnailUrl: string
  title: string
  votes: number
}

const categoryByGallery: Record<string, ShowcaseCategory> = {
  "alabama-hills-and-trona-pinnacles": "Landscape",
  bhutan: "Travel",
  brazil: "Black & White",
  chicago: "Architecture",
  egypt: "Travel",
  greenland: "Landscape",
  iceland: "Fine Art",
  jordan: "Travel",
  "lofoten-norway": "Landscape",
  "moab-night-sky": "Fine Art",
  myanmar: "Travel",
  slovenia: "Architecture",
  "sloss-furnaces": "Architecture",
}

const fallbackCategories: ShowcaseCategory[] = ["Travel", "Landscape", "Fine Art", "Architecture"]

export const showcaseCategories: Array<"All" | ShowcaseCategory> = [
  "All",
  "Travel",
  "Landscape",
  "Fine Art",
  "Architecture",
  "Black & White",
  "Street",
  "Wildlife",
]

export const showcaseTopics = ["All", "Editor's Picks", "Most Loved", "New This Week", "Mobile Friendly"] as const

export const seedShowcasePhotos: ShowcasePhoto[] = migratedGalleries.flatMap((gallery, galleryIndex) => {
  const photos = (gallery.photos ?? []).filter(isRenderableImage).slice(0, 2)
  const category = categoryByGallery[gallery.id] ?? fallbackCategories[galleryIndex % fallbackCategories.length]

  return photos.map((photo, photoIndex) => ({
    id: `seed-${gallery.id}-${photo.id}`,
    category,
    comments: (galleryIndex + photoIndex) % 5,
    imageUrl: getDisplayUrl(photo) ?? gallery.cover,
    location: gallery.name,
    photographer: gallery.client || "PhotoViewPro Photographer",
    portfolioId: gallery.id,
    portfolioName: gallery.name,
    status: photoIndex === 0 && galleryIndex % 4 === 0 ? "Featured" : "Approved",
    submittedAt: new Date(Date.UTC(2026, 6, Math.max(1, 5 - galleryIndex))).toISOString(),
    tags: buildTags(gallery.name, category, photo.title),
    thumbnailUrl: getThumbnailUrl(photo),
    title: photo.title || gallery.name,
    votes: 18 + galleryIndex * 7 + photoIndex * 5,
  }))
})

function buildTags(galleryName: string, category: ShowcaseCategory, title: string) {
  const baseTags = [category.toLowerCase(), galleryName.toLowerCase()]
  const titleTags = title
    .split(/[^a-z0-9]+/i)
    .filter((word) => word.length > 4)
    .slice(0, 2)
    .map((word) => word.toLowerCase())

  return Array.from(new Set([...baseTags, ...titleTags])).slice(0, 5)
}
