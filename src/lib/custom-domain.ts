import { PUBLIC_SITE_DOMAIN } from "./site-domain.ts"

const domainLabelPattern = /^(?:xn--)?[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

const blockedHosts = new Set([
  PUBLIC_SITE_DOMAIN,
  `www.${PUBLIC_SITE_DOMAIN}`,
  "localhost",
])

export function normalizeCustomDomain(value: string) {
  let candidate = value.trim().toLowerCase()
  if (!candidate) return ""

  try {
    const parsed = new URL(candidate.includes("://") ? candidate : `https://${candidate}`)
    if (parsed.username || parsed.password || parsed.port || parsed.pathname !== "/" || parsed.search || parsed.hash) {
      return ""
    }
    candidate = parsed.hostname.replace(/\.$/, "")
  } catch {
    return ""
  }

  if (
    candidate.length > 253
    || blockedHosts.has(candidate)
    || candidate.endsWith(`.${PUBLIC_SITE_DOMAIN}`)
    || candidate.endsWith(".vercel.app")
    || !candidate.includes(".")
  ) {
    return ""
  }

  const labels = candidate.split(".")
  if (labels.length < 2 || labels.some((label) => !domainLabelPattern.test(label))) return ""
  if (labels.at(-1)?.length === 1 || /^\d+$/.test(labels.at(-1) ?? "")) return ""

  return candidate
}

export function getCustomSiteHost(host: string | null | undefined) {
  const normalized = (host ?? "").trim().toLowerCase().replace(/\.$/, "").replace(/:\d+$/, "")
  if (!normalized || blockedHosts.has(normalized)) return ""
  return normalizeCustomDomain(normalized)
}

export function customDomainUrl(domain: string) {
  const normalized = normalizeCustomDomain(domain)
  return normalized ? `https://${normalized}` : ""
}

export function getCustomDomainCompanion(domainValue: string, apexValue?: string) {
  const domain = normalizeCustomDomain(domainValue)
  const apex = normalizeCustomDomain(apexValue ?? "")
  if (!domain) return ""

  if (apex) {
    if (domain === apex) return normalizeCustomDomain(`www.${apex}`)
    if (domain === `www.${apex}`) return apex
    return ""
  }

  return domain.startsWith("www.")
    ? normalizeCustomDomain(domain.slice(4))
    : normalizeCustomDomain(`www.${domain}`)
}

export function getCustomDomainLookupCandidates(domainValue: string) {
  const domain = normalizeCustomDomain(domainValue)
  if (!domain) return []
  const companion = getCustomDomainCompanion(domain)
  return companion ? [domain, companion] : [domain]
}
