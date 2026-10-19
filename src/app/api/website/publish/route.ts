import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { customDomainUrl } from "@/lib/custom-domain"
import { getPrismaClient } from "@/lib/db"
import { ensureWorkspaceForSession } from "@/lib/dev-workspace"
import { getPublicSiteUrl } from "@/lib/site-domain"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"
import { WEBSITE_PUBLISHED_SLUG } from "@/lib/website-publication"
import { prepareWebsiteForPublication } from "@/lib/website-publication-readiness"
import { isSameOriginRequest } from "@/lib/request-origin"
import { activationEventTypes, recordActivationEvent } from "@/lib/activation-analytics"
import { getOwnedWebsite } from "@/lib/multi-website"

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  }

  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const writeBlock = await getSubscriptionWriteBlock(session.user.workspaceId)
  if (writeBlock) return writeBlock

  const workspace = await ensureWorkspaceForSession(session.user.workspaceId)
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  }

  const prisma = getPrismaClient()
  const websiteId = new URL(request.url).searchParams.get("websiteId")
  const website = await getOwnedWebsite(workspace.id, websiteId)
  if (!website) return NextResponse.json({ error: "Website not found" }, { status: 404 })
  if (!website.isPrimary && website.status !== "ACTIVE") {
    return NextResponse.json({ error: "Activate this website before publishing it." }, { status: 409 })
  }
  const workspaceRecord = website.isPrimary
    ? await prisma.workspace.findUnique({ select: { slug: true }, where: { id: workspace.id } })
    : null
  const publicSiteSlug = website.subdomain ?? workspaceRecord?.slug ?? null
  if (!publicSiteSlug) {
    return NextResponse.json({ error: "Choose and activate a PhotoView.io address before publishing." }, { status: 409 })
  }

  if (!website.draftBody) {
    return NextResponse.json({ error: "Save the website draft before publishing" }, { status: 400 })
  }

  const publication = prepareWebsiteForPublication(website.draftBody)
  if (publication.issues.length > 0) {
    return NextResponse.json(
      {
        error: "Finish the website setup before publishing.",
        issues: publication.issues,
      },
      { status: 400 },
    )
  }

  const publishedAt = new Date()
  await prisma.website.update({
    data: {
      activatedAt: website.activatedAt ?? publishedAt,
      publishedAt,
      publishedBody: publication.body,
      status: "ACTIVE",
      subdomain: publicSiteSlug,
    },
    where: { id: website.id },
  })
  if (website.isPrimary) {
    await prisma.contentPost.upsert({
      create: { body: publication.body, publishedAt, slug: WEBSITE_PUBLISHED_SLUG, status: "PUBLISHED", title: "PhotoView.io website", type: "PAGE", workspaceId: workspace.id },
      update: { body: publication.body, publishedAt, status: "PUBLISHED" },
      where: { workspaceId_slug: { slug: WEBSITE_PUBLISHED_SLUG, workspaceId: workspace.id } },
    })
    await prisma.workspace.update({ data: { websiteSubdomain: publicSiteSlug }, where: { id: workspace.id } })
  }

  await recordActivationEvent({
    eventType: activationEventTypes.sitePublished,
    metadata: { publicSiteSlug, websiteId: website.id },
    path: "/api/website/publish",
    workspaceId: workspace.id,
  })

  return NextResponse.json({
    adjustments: publication.adjustments,
    publishedAt: publishedAt.toISOString(),
    url: process.env.NODE_ENV === "production"
      ? (
          website.customDomainVerifiedAt && website.customDomain
            ? customDomainUrl(website.customDomain)
            : getPublicSiteUrl(publicSiteSlug)
        ) || `/site/${encodeURIComponent(publicSiteSlug)}`
      : `/site/${encodeURIComponent(publicSiteSlug)}`,
  })
}
