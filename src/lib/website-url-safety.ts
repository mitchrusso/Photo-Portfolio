export function getSafeWebsiteActionUrl(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback
  const candidate = value.trim()
  if (!candidate) return fallback

  if (/^#[a-zA-Z0-9_-]+$/.test(candidate)) return candidate
  if (candidate.startsWith("/") && !candidate.startsWith("//") && !/[\r\n\\]/.test(candidate)) return candidate

  try {
    const url = new URL(candidate)
    if ((url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password) {
      return url.toString()
    }
  } catch {
    // Invalid and scriptable URLs are replaced with the caller's safe fallback.
  }

  return fallback
}
