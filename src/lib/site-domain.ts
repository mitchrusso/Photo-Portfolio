export const PUBLIC_SITE_DOMAIN = "photoview.io"

const RESERVED_PUBLIC_SUBDOMAINS = new Set([
  "admin",
  "api",
  "app",
  "email",
  "mail",
  "media",
  "pay",
  "static",
  "support",
  "www",
])

const validSubdomainPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

export function normalizePublicSiteSubdomain(value: string) {
  const normalized = value.trim().toLowerCase()
  if (!validSubdomainPattern.test(normalized) || RESERVED_PUBLIC_SUBDOMAINS.has(normalized)) return ""
  return normalized
}

export function getPublicSiteSubdomain(host: string | null | undefined) {
  const normalizedHost = (host ?? "").trim().toLowerCase().replace(/\.$/, "").replace(/:\d+$/, "")
  const suffix = `.${PUBLIC_SITE_DOMAIN}`
  if (!normalizedHost.endsWith(suffix)) return ""

  const candidate = normalizedHost.slice(0, -suffix.length)
  if (candidate.includes(".")) return ""
  return normalizePublicSiteSubdomain(candidate)
}

export function getPublicSiteHost(workspaceSlug: string) {
  const subdomain = normalizePublicSiteSubdomain(workspaceSlug)
  return subdomain ? `${subdomain}.${PUBLIC_SITE_DOMAIN}` : ""
}

export function getPublicSiteUrl(workspaceSlug: string) {
  const host = getPublicSiteHost(workspaceSlug)
  return host ? `https://${host}` : ""
}
