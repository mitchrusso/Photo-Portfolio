export type WebsiteGearItem = {
  description: string
  id: string
  name: string
  url: string
}

export type WebsiteGearCategory = {
  id: string
  items: WebsiteGearItem[]
  title: string
}

const defaultCategories: WebsiteGearCategory[] = [
  {
    id: "camera-bodies",
    title: "Camera bodies",
    items: [{ description: "", id: "camera-item-1", name: "", url: "" }],
  },
  {
    id: "favorite-lenses",
    title: "Favorite lenses",
    items: [{ description: "", id: "lens-item-1", name: "", url: "" }],
  },
  {
    id: "travel-accessories",
    title: "Travel accessories",
    items: [{ description: "", id: "travel-item-1", name: "", url: "" }],
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
          name: typeof item.name === "string" ? item.name : "",
          url: typeof item.url === "string" ? item.url : "",
        }]
      }),
    }
  })
}

export function getCompletedWebsiteGearCategories(categories: WebsiteGearCategory[]): WebsiteGearCategory[] {
  return categories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => item.name.trim()),
    }))
    .filter((category) => category.items.length > 0)
}
