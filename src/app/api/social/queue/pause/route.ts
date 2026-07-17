import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { normalizeSocialSchedule } from "@/lib/social-scheduler"

const bodySchema = z.object({ galleryId: z.string().min(1).max(200) })

function objectRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Portfolio is required." }, { status: 400 })
  const prisma = getPrismaClient()
  const gallery = await prisma.gallery.findUnique({
    where: { workspaceId_slug: { slug: parsed.data.galleryId, workspaceId: session.user.workspaceId } },
  })
  if (!gallery) return NextResponse.json({ error: "Portfolio not found." }, { status: 404 })
  const settings = objectRecord(gallery.settings)
  const schedule = normalizeSocialSchedule({ ...objectRecord(settings.socialSchedule), status: "paused", updatedAt: new Date().toISOString() })
  await prisma.$transaction([
    prisma.socialDelivery.updateMany({
      data: { lastError: "Publishing paused by subscriber.", status: "CANCELED" },
      where: { galleryId: gallery.id, status: { in: ["PENDING", "PROCESSING"] } },
    }),
    prisma.gallery.update({ data: { settings: { ...settings, socialSchedule: schedule } }, where: { id: gallery.id } }),
  ])
  return NextResponse.json({ ok: true, schedule })
}
