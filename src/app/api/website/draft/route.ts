import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { ensureWorkspaceForSession } from "@/lib/dev-workspace"

const WEBSITE_DRAFT_SLUG = "photoviewpro-website-draft"

const websiteDraftSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
})

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
    return NextResponse.json({
      savedAt: draft.updatedAt.toISOString(),
      settings: JSON.parse(draft.body) as Record<string, unknown>,
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

  const workspace = await ensureWorkspaceForSession(session.user.workspaceId)
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  }

  const parsed = websiteDraftSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid website draft", issues: parsed.error.flatten() }, { status: 400 })
  }

  const serializedSettings = JSON.stringify(parsed.data.settings)
  if (serializedSettings.length > 1_000_000) {
    return NextResponse.json({ error: "Website draft is too large" }, { status: 413 })
  }

  const prisma = getPrismaClient()
  const draft = await prisma.contentPost.upsert({
    create: {
      body: serializedSettings,
      slug: WEBSITE_DRAFT_SLUG,
      status: "DRAFT",
      title: "PhotoViewPro website draft",
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
