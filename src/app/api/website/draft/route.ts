import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { ensureWorkspaceForSession } from "@/lib/dev-workspace"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"
import { WEBSITE_DRAFT_SLUG, websiteSettingsPayloadSchema } from "@/lib/website-publication"

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workspace = await ensureWorkspaceForSession(session.user.workspaceId)
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  }

  const prisma = getPrismaClient()
  const websiteWorkspace = await prisma.workspace.findUnique({
    select: { slug: true, websiteSubdomain: true },
    where: { id: workspace.id },
  })
  if (!websiteWorkspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  }
  const draft = await prisma.contentPost.findUnique({
    select: { body: true, updatedAt: true },
    where: {
      workspaceId_slug: {
        slug: WEBSITE_DRAFT_SLUG,
        workspaceId: workspace.id,
      },
    },
  })

  if (!draft?.body) {
    return NextResponse.json({ settings: null })
  }

  try {
    const settings = JSON.parse(draft.body) as Record<string, unknown>
    return NextResponse.json({
      savedAt: draft.updatedAt.toISOString(),
      settings: {
        ...settings,
        subdomain: websiteWorkspace.websiteSubdomain ?? websiteWorkspace.slug,
      },
    })
  } catch {
    return NextResponse.json({ settings: null })
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
  const websiteWorkspace = await prisma.workspace.findUnique({
    select: { slug: true, websiteSubdomain: true },
    where: { id: workspace.id },
  })
  if (!websiteWorkspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  }

  const serializedSettings = JSON.stringify({
    ...parsed.data.settings,
    subdomain: websiteWorkspace.websiteSubdomain ?? websiteWorkspace.slug,
  })
  if (serializedSettings.length > 1_000_000) {
    return NextResponse.json({ error: "Website draft is too large" }, { status: 413 })
  }

  const draft = await prisma.contentPost.upsert({
    create: {
      body: serializedSettings,
      slug: WEBSITE_DRAFT_SLUG,
      status: "DRAFT",
      title: "PhotoView.io website draft",
      type: "PAGE",
      workspaceId: workspace.id,
    },
    update: {
      body: serializedSettings,
    },
    where: {
      workspaceId_slug: {
        slug: WEBSITE_DRAFT_SLUG,
        workspaceId: workspace.id,
      },
    },
  })

  return NextResponse.json({ savedAt: draft.updatedAt.toISOString() })
}

export async function DELETE() {
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
  await prisma.contentPost.deleteMany({
    where: {
      slug: WEBSITE_DRAFT_SLUG,
      workspaceId: workspace.id,
    },
  })

  return NextResponse.json({ reset: true })
}
