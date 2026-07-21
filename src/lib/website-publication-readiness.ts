type JsonRecord = Record<string, unknown>

const DEFAULT_COPY_BY_FIELD = {
  aboutBody: "Write a short photographer bio, artist statement, or welcome note that helps visitors understand the person behind the work.",
  articlesBody: "Create useful articles that help photographers, collectors, friends, or future clients understand the stories, techniques, and places behind the work.",
  blogBody: "Share trips, field notes, image stories, and behind-the-scenes updates from recent photography sessions.",
  contactIntro: "Use this form for print questions, licensing, assignments, or travel and photography conversations.",
  gearBody: "List the cameras, lenses, bags, software, and field tools you recommend. This can later support affiliate links.",
  introBody: "Use this short introduction to tell visitors what kind of work they are about to see and why it matters.",
} as const

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {}
}

function isEnabled(record: JsonRecord, key: string, fallback = true) {
  return typeof record[key] === "boolean" ? record[key] : fallback
}

export type WebsitePublicationPreparation = {
  adjustments: string[]
  body: string
  issues: string[]
}

/**
 * Keep unfinished template guidance out of a public website without making it
 * impossible to publish the finished portions. The subscriber's saved draft is
 * never changed; hidden sections return automatically after they are completed
 * and the site is published again.
 */
export function prepareWebsiteForPublication(body: string): WebsitePublicationPreparation {
  let settings: JsonRecord
  try {
    settings = asRecord(JSON.parse(body))
  } catch {
    return {
      adjustments: [],
      body,
      issues: ["The saved website draft could not be read. Save it again before publishing."],
    }
  }

  const enabledBlocks = { ...asRecord(settings.enabledBlocks) }
  const enabledPages = { ...asRecord(settings.enabledPages) }
  const pageCopy = asRecord(settings.pageCopy)
  const adjustments: string[] = []

  if (isEnabled(enabledBlocks, "textBlock") && pageCopy.introBody === DEFAULT_COPY_BY_FIELD.introBody) {
    enabledBlocks.textBlock = false
    adjustments.push("Home introduction")
  }

  const starterPages = [
    ["about", "aboutBody", "About"],
    ["blog", "blogBody", "Trips / Blog"],
    ["gear", "gearBody", "What's in My Bag"],
    ["articles", "articlesBody", "Useful Articles"],
    ["contact", "contactIntro", "Contact"],
  ] as const

  for (const [page, field, label] of starterPages) {
    if (isEnabled(enabledPages, page) && pageCopy[field] === DEFAULT_COPY_BY_FIELD[field]) {
      enabledPages[page] = false
      adjustments.push(label)
    }
  }

  if (
    isEnabled(enabledPages, "contact") &&
    !/^\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*$/.test(String(settings.contactEmail ?? ""))
  ) {
    enabledPages.contact = false
    adjustments.push("Contact (add a valid email to show it)")
  }

  return {
    adjustments,
    body: JSON.stringify({ ...settings, enabledBlocks, enabledPages }),
    issues: [],
  }
}

export function getWebsitePublicationIssues(body: string) {
  return prepareWebsiteForPublication(body).issues
}
