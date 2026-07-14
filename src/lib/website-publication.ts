import { z } from "zod"

import { getPrismaClient } from "@/lib/db"
import { getWorkspacePortfolioGalleries } from "@/lib/portfolio-persistence"

export const WEBSITE_DRAFT_SLUG = "photoviewpro-website-draft"
export const WEBSITE_PUBLISHED_SLUG = "photoviewpro-website-published"

export const websiteSettingsPayloadSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
})

export async function getPublishedWebsite(workspaceSlug: string) {
  const prisma = getPrismaClient()
  const published = await prisma.contentPost.findFirst({
    select: {
      body: true,
      publishedAt: true,
      workspaceId: true,
    },
    where: {
      slug: WEBSITE_PUBLISHED_SLUG,
      status: "PUBLISHED",
      workspace: {
        slug: workspaceSlug,
      },
    },
  })

  if (!published?.body) return null

  try {
    const settings = JSON.parse(published.body) as Record<string, unknown>
    const galleries = (await getWorkspacePortfolioGalleries(published.workspaceId)).filter(
      (gallery) => gallery.privacy !== "Client portal",
    )

    return {
      galleries,
      publishedAt: published.publishedAt,
      settings,
    }
  } catch {
    return null
  }
}
