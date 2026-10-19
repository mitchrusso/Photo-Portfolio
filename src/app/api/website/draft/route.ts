import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { ensureWorkspaceForSession } from "@/lib/dev-workspace"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"
import { WEBSITE_DRAFT_SLUG, websiteSettingsPayloadSchema } from "@/lib/website-publication"
import { stripPrivateWebsiteSettings } from "@/lib/website-settings-security"
import { getOwnedWebsite } from "@/lib/multi-website"

function requestedWebsiteId(request: Request) {
  return new URL(request.url).searchParams.get("websiteId")
}

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workspace = await ensureWorkspaceForSession(session.user.workspaceId)
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  }

  const website = await getOwnedWebsite(workspace.id, requestedWebsiteId(request))
  if (!website) return NextResponse.json({ error: "Website not found" }, { status: 404 })
  const publishedAt = website.publishedAt?.toISOString() ?? null

  if (!website.draftBody) {
    return NextResponse.json({ publishedAt, settings: null, websiteId: website.id, websiteName: website.name })
  }

  try {
    const settings = stripPrivateWebsiteSettings(JSON.parse(website.draftBody) as Record<string, unknown>)
    return NextResponse.json({
      publishedAt,
      savedAt: website.updatedAt.toISOString(),
      settings: {
        ...settings,
        subdomain: website.subdomain ?? "",
      },
      websiteId: website.id,
      websiteName: website.name,
    })
  } catch {
    return NextResponse.json({ publishedAt, settings: null })
  }
}

export async function PUT(request: Request) {
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

  const parsed = websiteSettingsPayloadSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid website draft", issues: parsed.error.flatten() }, { status: 400 })
  }

  const prisma = getPrismaClient()
  const website = await getOwnedWebsite(workspace.id, requestedWebsiteId(request))
  if (!website) return NextResponse.json({ error: "Website not found" }, { status: 404 })

  const serializedSettings = JSON.stringify(stripPrivateWebsiteSettings({
    ...parsed.data.settings,
    subdomain: website.subdomain ?? "",
  }))
  if (serializedSettings.length > 1_000_000) {
    return NextResponse.json({ error: "Website draft is too large" }, { status: 413 })
  }

  const draft = await prisma.website.update({
    data: { draftBody: serializedSettings },
    where: { id: website.id },
  })
  if (website.isPrimary) {
    await prisma.contentPost.upsert({
      create: { body: serializedSettings, slug: WEBSITE_DRAFT_SLUG, status: "DRAFT", title: "PhotoView.io website draft", type: "PAGE", workspaceId: workspace.id },
      update: { body: serializedSettings },
      where: { workspaceId_slug: { slug: WEBSITE_DRAFT_SLUG, workspaceId: workspace.id } },
    })
  }

  return NextResponse.json({ savedAt: draft.updatedAt.toISOString(), websiteId: website.id })
}

export async function DELETE(request: Request) {
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
  const website = await getOwnedWebsite(workspace.id, requestedWebsiteId(request))
  if (!website) return NextResponse.json({ error: "Website not found" }, { status: 404 })
  await prisma.website.update({ data: { draftBody: null }, where: { id: website.id } })
  if (website.isPrimary) {
    await prisma.contentPost.deleteMany({ where: { slug: WEBSITE_DRAFT_SLUG, workspaceId: workspace.id } })
  }

  return NextResponse.json({ reset: true, websiteId: website.id })
}
