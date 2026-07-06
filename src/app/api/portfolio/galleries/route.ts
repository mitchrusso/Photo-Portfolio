import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { getWorkspacePortfolioGalleries, replaceWorkspacePortfolioGalleries } from "@/lib/portfolio-persistence"

const gallerySyncSchema = z.object({
  galleries: z.array(z.record(z.string(), z.unknown())).max(300),
})

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const galleries = await getWorkspacePortfolioGalleries(session.user.workspaceId)

  return NextResponse.json({ galleries })
}

export async function PUT(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = gallerySyncSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid gallery sync payload", issues: parsed.error.flatten() }, { status: 400 })
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
