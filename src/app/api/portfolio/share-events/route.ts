import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"

const shareEventSchema = z.object({
  galleryId: z.string().min(1).optional(),
  network: z.string().min(1).max(40),
  shareUrl: z.string().url(),
})

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = shareEventSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid share event payload" }, { status: 400 })
  }

  const prisma = getPrismaClient()
  const gallery = parsed.data.galleryId && parsed.data.galleryId !== "all"
    ? await prisma.gallery.findFirst({
        select: { id: true },
        where: {
          slug: parsed.data.galleryId,
          workspaceId: session.user.workspaceId,
        },
      })
    : null

  await prisma.socialShareEvent.create({
    data: {
      galleryId: gallery?.id ?? null,
      network: parsed.data.network,
      shareUrl: parsed.data.shareUrl,
      workspaceId: session.user.workspaceId,
    },
  })

  return NextResponse.json({ ok: true })
}
