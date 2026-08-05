import { z } from "zod"

import { getPrismaClient } from "@/lib/db"
import { getCustomDomainLookupCandidates, normalizeCustomDomain } from "@/lib/custom-domain"
import { getPublicWorkspacePortfolioGalleries } from "@/lib/portfolio-persistence"
import { normalizePublicSiteSubdomain } from "@/lib/site-domain"
import { stripPrivateWebsiteSettings } from "@/lib/website-settings-security"

export const WEBSITE_DRAFT_SLUG = "photoviewpro-website-draft"
export const WEBSITE_PUBLISHED_SLUG = "photoviewpro-website-published"

export const websiteSettingsPayloadSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
})

export async function getPublishedWebsite(workspaceSlug: string) {
  const publicSiteSlug = normalizePublicSiteSubdomain(workspaceSlug)
  if (!publicSiteSlug) return null

  const prisma = getPrismaClient()
  const published = await prisma.contentPost.findFirst({
    select: {
      body: true,
      publishedAt: true,
      workspaceId: true,
      workspace: { select: { slug: true } },
    },
    where: {
      slug: WEBSITE_PUBLISHED_SLUG,
      status: "PUBLISHED",
      workspace: {
        OR: [
          { websiteSubdomain: publicSiteSlug },
          {
            slug: publicSiteSlug,
            websiteSubdomain: null,
          },
        ],
      },
    },
  })

  if (!published?.body) return null

  try {
    const settings = stripPrivateWebsiteSettings(JSON.parse(published.body) as Record<string, unknown>)
    const galleries = await getPublicWorkspacePortfolioGalleries(
      published.workspace.slug,
      undefined,
      { includeVisiblePhotos: true },
    ) ?? []

    return {
      galleries,
      publishedAt: published.publishedAt,
      settings,
    }
  } catch {
    return null
  }
}

export async function getPublishedWebsiteByCustomDomain(domain: string) {
  const prisma = getPrismaClient()
  const normalizedDomain = normalizeCustomDomain(domain)
  if (!normalizedDomain) return null

  const candidates = getCustomDomainLookupCandidates(normalizedDomain)
  const publications = await prisma.contentPost.findMany({
    select: {
      body: true,
      publishedAt: true,
      workspaceId: true,
      workspace: { select: { customDomain: true, slug: true } },
    },
    where: {
      slug: WEBSITE_PUBLISHED_SLUG,
      status: "PUBLISHED",
      workspace: {
        customDomain: { in: candidates },
        customDomainVerifiedAt: { not: null },
      },
    },
  })
  const published = publications.find(
    (publication) => publication.workspace.customDomain === normalizedDomain,
  ) ?? publications[0]

  if (!published?.body) return null

  try {
    const settings = stripPrivateWebsiteSettings(JSON.parse(published.body) as Record<string, unknown>)
    const galleries = await getPublicWorkspacePortfolioGalleries(
      published.workspace.slug,
      undefined,
      { includeVisiblePhotos: true },
    ) ?? []

    return {
      canonicalDomain: published.workspace.customDomain ?? normalizedDomain,
      galleries,
      publishedAt: published.publishedAt,
      settings,
    }
  } catch {
    return null
  }
}
