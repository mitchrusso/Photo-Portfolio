export type EditablePhotoDetails = {
  camera?: string
  category?: string
  capturedDate?: string
  lens?: string
  location?: string
  notes?: string
  story?: string
  tags?: string[]
  trip?: string
}

const editableTextFields = [
  "camera",
  "category",
  "capturedDate",
  "lens",
  "location",
  "notes",
  "story",
  "trip",
] as const

function asMetadataRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {}
}

export function hasEditablePhotoDetailUpdates(details: EditablePhotoDetails) {
  return editableTextFields.some((field) => details[field] !== undefined) || details.tags !== undefined
}

export function mergeEditablePhotoDetails(metadata: unknown, details: EditablePhotoDetails) {
  const next = asMetadataRecord(metadata)

  editableTextFields.forEach((field) => {
    if (details[field] === undefined) return

    const value = details[field]?.trim()
    if (value) next[field] = value
    else delete next[field]
  })

  if (details.tags !== undefined) {
    const tags = Array.from(new Set(details.tags.map((tag) => tag.trim()).filter(Boolean)))
    if (tags.length > 0) next.tags = tags
    else delete next.tags
  }

  return next
}
