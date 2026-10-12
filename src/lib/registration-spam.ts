const LINK_IN_IDENTITY = /(?:https?:\/\/|www\.|bit\.ly\/|tinyurl\.com\/|t\.co\/)/i
const PROMOTIONAL_IDENTITY = /(?:unlock\s+\d+[km]?|one\s+tap\s+away|claim\s+(?:your|now)|free\s+money)/i

function suspiciousIdentityField(value: string | null | undefined) {
  const normalized = value?.trim() ?? ""
  if (!normalized) return false
  return LINK_IN_IDENTITY.test(normalized) || PROMOTIONAL_IDENTITY.test(normalized)
}

export function hasRegistrationSpamSignals(input: {
  firstName: string
  lastName?: string | null
  studioName?: string | null
}) {
  return [input.firstName, input.lastName, input.studioName].some(suspiciousIdentityField)
}
