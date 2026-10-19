import { getPrismaClient } from "@/lib/db"
import { normalizeWebsiteName } from "@/lib/multi-website-rules"

export const websiteSummarySelect = {
  activatedAt: true,
  billingCommittedAt: true,
  billingType: true,
  createdAt: true,
  customDomain: true,
  customDomainVerifiedAt: true,
  id: true,
  isPrimary: true,
  name: true,
  publishedAt: true,
  requestedSubdomain: true,
  status: true,
  subdomain: true,
  updatedAt: true,
} as const

export async function ensurePrimaryWebsite(workspaceId: string) {
  const prisma = getPrismaClient()
  const existing = await prisma.website.findFirst({
    select: websiteSummarySelect,
    where: { deletedAt: null, isPrimary: true, workspaceId },
  })
  if (existing) return existing

  const workspace = await prisma.workspace.findUnique({
    select: {
      customDomain: true,
      customDomainLastCheckedAt: true,
      customDomainVerifiedAt: true,
      name: true,
      slug: true,
      websiteSubdomain: true,
    },
    where: { id: workspaceId },
  })
  if (!workspace) return null

  const [draft, published] = await Promise.all([
    prisma.contentPost.findUnique({
      select: { body: true },
      where: { workspaceId_slug: { slug: "photoviewpro-website-draft", workspaceId } },
    }),
    prisma.contentPost.findUnique({
      select: { body: true, publishedAt: true },
      where: { workspaceId_slug: { slug: "photoviewpro-website-published", workspaceId } },
    }),
  ])
  const isActive = Boolean(published?.body || workspace.websiteSubdomain || workspace.customDomain)

  try {
    return await prisma.website.create({
      data: {
        activatedAt: isActive ? published?.publishedAt ?? new Date() : null,
        billingType: "INCLUDED",
        customDomain: workspace.customDomain,
        customDomainLastCheckedAt: workspace.customDomainLastCheckedAt,
        customDomainVerifiedAt: workspace.customDomainVerifiedAt,
        draftBody: draft?.body,
        isPrimary: true,
        name: `${normalizeWebsiteName(workspace.name) || "My"} Website`,
        publishedAt: published?.publishedAt,
        publishedBody: published?.body,
        status: isActive ? "ACTIVE" : "DRAFT",
        subdomain: workspace.websiteSubdomain,
        workspaceId,
      },
      select: websiteSummarySelect,
    })
  } catch (error) {
    const racedPrimary = await prisma.website.findFirst({
      select: websiteSummarySelect,
      where: { deletedAt: null, isPrimary: true, workspaceId },
    })
    if (racedPrimary) return racedPrimary
    throw error
  }
}

export async function getOwnedWebsite(workspaceId: string, websiteId?: string | null) {
  const prisma = getPrismaClient()
  if (websiteId) {
    return prisma.website.findFirst({
      where: { deletedAt: null, id: websiteId, workspaceId },
    })
  }

  await ensurePrimaryWebsite(workspaceId)
  return prisma.website.findFirst({
    where: { deletedAt: null, isPrimary: true, workspaceId },
  })
}

export function websitePublicUrl(website: { customDomain: string | null; customDomainVerifiedAt: Date | null; status: string; subdomain: string | null }) {
  if (website.status !== "ACTIVE") return null
  if (website.customDomain && website.customDomainVerifiedAt) return `https://${website.customDomain}`
  return website.subdomain ? `https://${website.subdomain}.photoview.io` : null
}

export function serializeWebsiteSummary(website: {
  activatedAt: Date | null
  billingCommittedAt: Date | null
  billingType: string
  createdAt: Date
  customDomain: string | null
  customDomainVerifiedAt: Date | null
  id: string
  isPrimary: boolean
  name: string
  publishedAt: Date | null
  requestedSubdomain: string | null
  status: string
  subdomain: string | null
  updatedAt: Date
}) {
  return {
    ...website,
    activatedAt: website.activatedAt?.toISOString() ?? null,
    billingCommittedAt: website.billingCommittedAt?.toISOString() ?? null,
    createdAt: website.createdAt.toISOString(),
    customDomainVerifiedAt: website.customDomainVerifiedAt?.toISOString() ?? null,
    publishedAt: website.publishedAt?.toISOString() ?? null,
    updatedAt: website.updatedAt.toISOString(),
    url: websitePublicUrl(website),
  }
}
