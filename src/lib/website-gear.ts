export type WebsiteGearItem = {
  description: string
  id: string
  imageUrl: string
  name: string
  retailer: string
  url: string
}

export type WebsiteGearCategory = {
  id: string
  items: WebsiteGearItem[]
  title: string
}

export type WebsiteGearReviewItem = WebsiteGearItem & {
  approved: boolean
  categoryId: string
  error?: string
  query?: string
}

const defaultCategories: WebsiteGearCategory[] = [
  {
    id: "camera-bodies",
    title: "Camera bodies",
    items: [{ description: "", id: "camera-item-1", imageUrl: "", name: "", retailer: "", url: "" }],
  },
  {
    id: "favorite-lenses",
    title: "Favorite lenses",
    items: [{ description: "", id: "lens-item-1", imageUrl: "", name: "", retailer: "", url: "" }],
  },
  {
    id: "travel-accessories",
    title: "Travel accessories",
    items: [{ description: "", id: "travel-item-1", imageUrl: "", name: "", retailer: "", url: "" }],
  },
]

export function createDefaultWebsiteGearCategories(): WebsiteGearCategory[] {
  return defaultCategories.map((category) => ({
    ...category,
    items: category.items.map((item) => ({ ...item })),
  }))
}

export function normalizeWebsiteGearCategories(value: unknown): WebsiteGearCategory[] {
  if (!Array.isArray(value)) return createDefaultWebsiteGearCategories()

  return defaultCategories.map((fallbackCategory, categoryIndex) => {
    const savedCategory = value.find(
      (candidate): candidate is Partial<WebsiteGearCategory> =>
        Boolean(candidate) && typeof candidate === "object" && "id" in candidate && candidate.id === fallbackCategory.id,
    ) ?? (value[categoryIndex] as Partial<WebsiteGearCategory> | undefined)
    const savedItems = Array.isArray(savedCategory?.items) ? savedCategory.items : fallbackCategory.items

    return {
      id: fallbackCategory.id,
      title: typeof savedCategory?.title === "string" ? savedCategory.title : fallbackCategory.title,
      items: savedItems.flatMap((candidate, itemIndex) => {
        if (!candidate || typeof candidate !== "object") return []

        const item = candidate as Partial<WebsiteGearItem>
        return [{
          description: typeof item.description === "string" ? item.description : "",
          id: typeof item.id === "string" && item.id ? item.id : `${fallbackCategory.id}-item-${itemIndex + 1}`,
          imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : "",
          name: typeof item.name === "string" ? item.name : "",
          retailer: typeof item.retailer === "string" ? item.retailer : "",
          url: typeof item.url === "string" ? item.url : "",
        }]
      }),
    }
  })
}

export function getSafeWebsiteGearImageUrl(value: string) {
  if (/^\/api\/website\/media\/[a-zA-Z0-9_-]+$/.test(value)) return value

  try {
    const url = new URL(value)
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : ""
  } catch {
    return ""
  }
}

export function getSafeWebsiteGearLink(value: string) {
  try {
    const url = new URL(value)
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password ? url.toString() : ""
  } catch {
    return ""
  }
}

export function getCompletedWebsiteGearCategories(categories: WebsiteGearCategory[]): WebsiteGearCategory[] {
  return categories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => item.name.trim()),
    }))
    .filter((category) => category.items.length > 0)
}

export function addApprovedWebsiteGearItems(
  categories: WebsiteGearCategory[],
  reviewItems: WebsiteGearReviewItem[],
  createId: (categoryId: string, itemIndex: number) => string = (categoryId, itemIndex) =>
    `${categoryId}-import-${Date.now()}-${itemIndex}`,
): { categories: WebsiteGearCategory[]; importedCount: number } {
  const categoryIds = new Set(categories.map((category) => category.id))
  const existingKeys = new Set(categories.flatMap((category) => category.items.flatMap((item) => [
    item.name.trim().toLowerCase(),
    item.url.trim().toLowerCase(),
  ].filter(Boolean))))
  const importedItems = reviewItems.filter((item) => item.approved && categoryIds.has(item.categoryId)).filter((item) => {
    const nameKey = item.name.trim().toLowerCase()
    const urlKey = item.url.trim().toLowerCase()
    if (!nameKey || existingKeys.has(nameKey) || urlKey && existingKeys.has(urlKey)) return false
    existingKeys.add(nameKey)
    if (urlKey) existingKeys.add(urlKey)
    return true
  })

  return {
    categories: categories.map((category) => ({
      ...category,
      items: [
        ...importedItems
          .filter((item) => item.categoryId === category.id)
          .map((item, itemIndex) => ({
            description: item.description,
            id: createId(category.id, itemIndex),
            imageUrl: item.imageUrl,
            name: item.name,
            retailer: item.retailer,
            url: item.url,
          })),
        ...category.items,
      ],
    })),
    importedCount: importedItems.length,
  }
}

export function removeWebsiteGearItem(
  categories: WebsiteGearCategory[],
  categoryId: string,
  itemId: string,
): WebsiteGearCategory[] {
  return categories.map((category) => (
    category.id === categoryId
      ? { ...category, items: category.items.filter((item) => item.id !== itemId) }
      : category
  ))
}
