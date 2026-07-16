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

export function getWebsitePublicationIssues(body: string) {
  let settings: JsonRecord
  try {
    settings = asRecord(JSON.parse(body))
  } catch {
    return ["The saved website draft could not be read. Save it again before publishing."]
  }

  const enabledBlocks = asRecord(settings.enabledBlocks)
  const enabledPages = asRecord(settings.enabledPages)
  const pageCopy = asRecord(settings.pageCopy)
  const issues: string[] = []

  if (
    isEnabled(enabledPages, "contact") &&
    !/^\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*$/.test(String(settings.contactEmail ?? ""))
  ) {
    issues.push("Add a valid contact email or hide the Contact page.")
  }

  const placeholderSections = [
    isEnabled(enabledBlocks, "textBlock") && pageCopy.introBody === DEFAULT_COPY_BY_FIELD.introBody ? "Home introduction" : "",
    isEnabled(enabledPages, "about") && pageCopy.aboutBody === DEFAULT_COPY_BY_FIELD.aboutBody ? "About" : "",
    isEnabled(enabledPages, "blog") && pageCopy.blogBody === DEFAULT_COPY_BY_FIELD.blogBody ? "Trips / Blog" : "",
    isEnabled(enabledPages, "gear") && pageCopy.gearBody === DEFAULT_COPY_BY_FIELD.gearBody ? "What's in My Bag" : "",
    isEnabled(enabledPages, "articles") && pageCopy.articlesBody === DEFAULT_COPY_BY_FIELD.articlesBody ? "Useful Articles" : "",
    isEnabled(enabledPages, "contact") && pageCopy.contactIntro === DEFAULT_COPY_BY_FIELD.contactIntro ? "Contact" : "",
  ].filter(Boolean)

  if (placeholderSections.length > 0) {
    issues.push(`Replace or hide the starter copy in: ${placeholderSections.join(", ")}.`)
  }

  return issues
}
