import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { ensureWorkspaceForSession } from "@/lib/dev-workspace"
import { getPublicSiteUrl } from "@/lib/site-domain"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"
import { WEBSITE_DRAFT_SLUG, WEBSITE_PUBLISHED_SLUG } from "@/lib/website-publication"

export async function POST() {
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
  const draft = await prisma.contentPost.findUnique({
    select: { body: true },
    where: {
      workspaceId_slug: {
        slug: WEBSITE_DRAFT_SLUG,
        workspaceId: workspace.id,
      },
    },
  })

  if (!draft?.body) {
    return NextResponse.json({ error: "Save the website draft before publishing" }, { status: 400 })
  }

  const publishedAt = new Date()
  await prisma.contentPost.upsert({
    create: {
      body: draft.body,
      publishedAt,
      slug: WEBSITE_PUBLISHED_SLUG,
      status: "PUBLISHED",
      title: "PhotoView.io website",
      type: "PAGE",
      workspaceId: workspace.id,
    },
    update: {
      body: draft.body,
      publishedAt,
      status: "PUBLISHED",
    },
    where: {
      workspaceId_slug: {
        slug: WEBSITE_PUBLISHED_SLUG,
        workspaceId: workspace.id,
      },
    },
  })

  return NextResponse.json({
    publishedAt: publishedAt.toISOString(),
    url: process.env.NODE_ENV === "production"
      ? getPublicSiteUrl(session.user.workspaceSlug) || `/site/${encodeURIComponent(session.user.workspaceSlug)}`
      : `/site/${encodeURIComponent(session.user.workspaceSlug)}`,
  })
}
