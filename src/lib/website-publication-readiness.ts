import { stripPrivateWebsiteSettings } from "./website-settings-security.ts"

type JsonRecord = Record<string, unknown>

const DEFAULT_COPY_BY_FIELD = {
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
 * Keep the optional starter Home introduction off a public website while
 * honoring every explicit page-navigation choice made by the photographer.
 * Contact remains unavailable until it has a valid delivery address.
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

  if (
    isEnabled(enabledPages, "contact") &&
    !/^\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*$/.test(String(settings.contactEmail ?? ""))
  ) {
    enabledPages.contact = false
    adjustments.push("Contact (add a valid email to show it)")
  }

  return {
    adjustments,
    body: JSON.stringify(stripPrivateWebsiteSettings({ ...settings, enabledBlocks, enabledPages })),
    issues: [],
  }
}

export function getWebsitePublicationIssues(body: string) {
  return prepareWebsiteForPublication(body).issues
}
