type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {}
}

/**
 * Import credentials are one-time secrets, not website content. Keep the
 * subscriber's non-secret Lightroom preferences while preventing an issued
 * key from entering saved drafts, published settings, or public page props.
 */
export function stripPrivateWebsiteSettings(settings: JsonRecord): JsonRecord {
  const lightroomImport = asRecord(settings.lightroomImport)

  return {
    ...settings,
    lightroomImport: {
      ...lightroomImport,
      apiKey: "",
    },
  }
}
