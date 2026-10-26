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

function publishedBodyPreventsImageRightClick(body: string | null | undefined) {
  if (!body) return false

  try {
    const settings = JSON.parse(body) as Record<string, unknown>
    return settings.preventImageRightClick === true
  } catch {
    return false
  }
}

export async function getPublishedWebsiteImageProtection(workspaceSlug: string | undefined) {
  const normalizedWorkspaceSlug = workspaceSlug?.trim() ?? ""
  if (!normalizedWorkspaceSlug) return false

  const prisma = getPrismaClient()
  const website = await prisma.website.findFirst({
    select: { publishedBody: true },
    where: {
      deletedAt: null,
      publishedBody: { not: null },
      status: "ACTIVE",
      workspace: {
        OR: [
          { slug: normalizedWorkspaceSlug },
          { websiteSubdomain: normalizedWorkspaceSlug },
        ],
      },
    },
  })
  if (website?.publishedBody) return publishedBodyPreventsImageRightClick(website.publishedBody)

  const publication = await prisma.contentPost.findFirst({
    select: { body: true },
    where: {
      slug: WEBSITE_PUBLISHED_SLUG,
      status: "PUBLISHED",
      workspace: {
        OR: [
          { slug: normalizedWorkspaceSlug },
          { websiteSubdomain: normalizedWorkspaceSlug },
        ],
      },
    },
  })

  return publishedBodyPreventsImageRightClick(publication?.body)
}

export async function getPublishedWebsite(workspaceSlug: string) {
  const publicSiteSlug = normalizePublicSiteSubdomain(workspaceSlug)
  if (!publicSiteSlug) return null

  const prisma = getPrismaClient()
  const website = await prisma.website.findFirst({
    select: {
      publishedAt: true,
      publishedBody: true,
      subdomain: true,
      workspace: { select: { slug: true } },
    },
    where: {
      deletedAt: null,
      publishedBody: { not: null },
      status: "ACTIVE",
      subdomain: publicSiteSlug,
    },
  })
  if (website?.publishedBody) {
    try {
      const settings = {
        ...stripPrivateWebsiteSettings(JSON.parse(website.publishedBody) as Record<string, unknown>),
        subdomain: website.subdomain,
      }
      const galleries = await getPublicWorkspacePortfolioGalleries(
        website.workspace.slug,
        undefined,
        { includeProtectedGroups: true, includeVisiblePhotos: true },
      ) ?? []
      return { galleries, publishedAt: website.publishedAt, settings }
    } catch {
      return null
    }
  }

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
      { includeProtectedGroups: true, includeVisiblePhotos: true },
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
  const websites = await prisma.website.findMany({
    select: {
      customDomain: true,
      publishedAt: true,
      publishedBody: true,
      subdomain: true,
      workspace: { select: { slug: true } },
    },
    where: {
      customDomain: { in: candidates },
      customDomainVerifiedAt: { not: null },
      deletedAt: null,
      publishedBody: { not: null },
      status: "ACTIVE",
    },
  })
  const website = websites.find((candidate) => candidate.customDomain === normalizedDomain) ?? websites[0]
  if (website?.publishedBody) {
    try {
      const settings = {
        ...stripPrivateWebsiteSettings(JSON.parse(website.publishedBody) as Record<string, unknown>),
        subdomain: website.subdomain,
      }
      const galleries = await getPublicWorkspacePortfolioGalleries(
        website.workspace.slug,
        undefined,
        { includeProtectedGroups: true, includeVisiblePhotos: true },
      ) ?? []
      return {
        canonicalDomain: website.customDomain ?? normalizedDomain,
        galleries,
        publishedAt: website.publishedAt,
        settings,
      }
    } catch {
      return null
    }
  }

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
      { includeProtectedGroups: true, includeVisiblePhotos: true },
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
