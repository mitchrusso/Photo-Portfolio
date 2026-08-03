export type WebsiteStoryAccordionItem = {
  body: string
  galleryId: string
  id: string
  title: string
}

export type WebsiteStoryAccordionSettings = {
  enabled: boolean
  heading: string
  items: WebsiteStoryAccordionItem[]
}

export const DEFAULT_WEBSITE_STORY_ACCORDION: WebsiteStoryAccordionSettings = {
  enabled: false,
  heading: "My story",
  items: [
    { body: "", galleryId: "", id: "story-1", title: "Origin" },
    { body: "", galleryId: "", id: "story-2", title: "Create" },
    { body: "", galleryId: "", id: "story-3", title: "Build" },
  ],
}

export const MAX_WEBSITE_STORY_ACCORDION_ITEMS = 6
export const MIN_WEBSITE_STORY_ACCORDION_ITEMS = 2

export function normalizeWebsiteStoryAccordion(
  value: unknown,
): WebsiteStoryAccordionSettings {
  const candidate = value && typeof value === "object"
    ? value as Partial<WebsiteStoryAccordionSettings>
    : {}
  const sourceItems = Array.isArray(candidate.items)
    ? candidate.items
    : DEFAULT_WEBSITE_STORY_ACCORDION.items
  const seen = new Set<string>()
  const items = sourceItems
    .slice(0, MAX_WEBSITE_STORY_ACCORDION_ITEMS)
    .map((value, index) => {
      const item = value && typeof value === "object"
        ? value as Partial<WebsiteStoryAccordionItem>
        : {}
      const baseId = typeof item.id === "string" && item.id.trim()
        ? item.id.trim().replace(/[^a-zA-Z0-9_-]/g, "-")
        : `story-${index + 1}`
      let id = baseId
      let suffix = 2
      while (seen.has(id)) {
        id = `${baseId}-${suffix}`
        suffix += 1
      }
      seen.add(id)
      return {
        body: typeof item.body === "string" ? item.body : "",
        galleryId: typeof item.galleryId === "string" ? item.galleryId : "",
        id,
        title: typeof item.title === "string" && item.title.trim()
          ? item.title
          : `Chapter ${index + 1}`,
      }
    })

  while (items.length < MIN_WEBSITE_STORY_ACCORDION_ITEMS) {
    const index = items.length
    items.push({
      body: "",
      galleryId: "",
      id: `story-${index + 1}`,
      title: `Chapter ${index + 1}`,
    })
  }

  return {
    enabled: candidate.enabled === true,
    heading: typeof candidate.heading === "string" ? candidate.heading : DEFAULT_WEBSITE_STORY_ACCORDION.heading,
    items,
  }
}
