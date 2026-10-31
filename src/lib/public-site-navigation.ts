import { getCustomSiteHost } from "./custom-domain.ts"
import { getPublicSiteSubdomain } from "./site-domain.ts"

export function getPublicWebsiteHomeHref(
  host: string | null | undefined,
  workspaceSlug: string,
  websiteSubdomain?: string | null,
) {
  if (getCustomSiteHost(host) || getPublicSiteSubdomain(host)) return "/"
  return `/site/${encodeURIComponent(websiteSubdomain?.trim() || workspaceSlug)}`
}
