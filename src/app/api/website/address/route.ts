import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { ensureWorkspaceForSession } from "@/lib/dev-workspace"
import { normalizePublicSiteSubdomain } from "@/lib/site-domain"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"
import { WEBSITE_DRAFT_SLUG, WEBSITE_PUBLISHED_SLUG } from "@/lib/website-publication"

const websiteAddressSchema = z.object({
  subdomain: z.string().trim().min(1).max(63),
})

function updateStoredSubdomain(body: string | null, subdomain: string) {
  if (!body) return body

  try {
    const settings = JSON.parse(body) as Record<string, unknown>
    return JSON.stringify({ ...settings, subdomain })
  } catch {
    return body
  }
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const writeBlock = await getSubscriptionWriteBlock(session.user.workspaceId)
  if (writeBlock) return writeBlock

  const workspace = await ensureWorkspaceForSession(session.user.workspaceId)
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

  const parsed = websiteAddressSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a PhotoView.io address." }, { status: 400 })
  }

  const subdomain = normalizePublicSiteSubdomain(parsed.data.subdomain)
  if (!subdomain) {
    return NextResponse.json({
      error: "Use 1–63 lowercase letters, numbers, or hyphens. The address cannot begin or end with a hyphen or use a reserved PhotoView.io name.",
    }, { status: 400 })
  }

  const prisma = getPrismaClient()
  const conflict = await prisma.workspace.findFirst({
    select: { id: true },
    where: {
      id: { not: workspace.id },
      OR: [
        { slug: subdomain },
        { websiteSubdomain: subdomain },
      ],
    },
  })
  if (conflict) {
    return NextResponse.json({ error: "That PhotoView.io address is already in use. Try another." }, { status: 409 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.workspace.update({
      data: { websiteSubdomain: subdomain },
      where: { id: workspace.id },
    })

    const websitePosts = await tx.contentPost.findMany({
      select: { body: true, id: true },
      where: {
        slug: { in: [WEBSITE_DRAFT_SLUG, WEBSITE_PUBLISHED_SLUG] },
        workspaceId: workspace.id,
      },
    })
    await Promise.all(websitePosts.map((post) => tx.contentPost.update({
      data: { body: updateStoredSubdomain(post.body, subdomain) },
      where: { id: post.id },
    })))
  })

  return NextResponse.json({
    subdomain,
    url: `https://${subdomain}.photoview.io`,
  })
}
