import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { ensureWorkspaceForSession } from "@/lib/dev-workspace"
import { getWorkspacePortfolioGalleries, replaceWorkspacePortfolioGalleries } from "@/lib/portfolio-persistence"
import { getWorkspaceEntitlement } from "@/lib/subscription-entitlements"
import { subscriptionWriteBlockResponse } from "@/lib/subscription-api"

const gallerySyncSchema = z.object({
  galleries: z.array(z.record(z.string(), z.unknown())).max(300),
})

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workspace = await ensureWorkspaceForSession(session.user.workspaceId)

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found. Please log out and sign in again." }, { status: 404 })
  }

  const galleries = await getWorkspacePortfolioGalleries(session.user.workspaceId)

  return NextResponse.json({ galleries })
}

export async function PUT(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workspace = await ensureWorkspaceForSession(session.user.workspaceId)

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found. Please log out and sign in again." }, { status: 404 })
  }

  const parsed = gallerySyncSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid gallery sync payload", issues: parsed.error.flatten() }, { status: 400 })
  }

  const entitlement = await getWorkspaceEntitlement(session.user.workspaceId)
  if (entitlement.mode !== "write") return subscriptionWriteBlockResponse(entitlement)
  const allowedGalleryCount = entitlement.galleryLimit === null
    ? null
    : Math.max(entitlement.galleryCount, entitlement.galleryLimit)
  if (allowedGalleryCount !== null && parsed.data.galleries.length > allowedGalleryCount) {
    return NextResponse.json({
      code: "GALLERY_LIMIT_REACHED",
      error: `This plan allows ${entitlement.galleryLimit} portfolios. Upgrade before adding another portfolio.`,
    }, { status: 403 })
  }

  const galleries = await replaceWorkspacePortfolioGalleries(
    session.user.workspaceId,
    parsed.data.galleries as Parameters<typeof replaceWorkspacePortfolioGalleries>[1],
  )

  return NextResponse.json({
    galleries,
    savedAt: new Date().toISOString(),
  })
}
