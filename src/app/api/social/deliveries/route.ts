import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const gallerySlug = new URL(request.url).searchParams.get("galleryId")
  const deliveries = await getPrismaClient().socialDelivery.findMany({
    orderBy: { scheduledFor: "asc" },
    select: {
      attemptCount: true,
      caption: true,
      id: true,
      lastError: true,
      network: true,
      providerPostId: true,
      publishedAt: true,
      scheduledFor: true,
      status: true,
      connection: { select: { providerAccountName: true } },
      photo: { select: { title: true } },
    },
    take: 100,
    where: {
      workspaceId: session.user.workspaceId,
      ...(gallerySlug ? { gallery: { slug: gallerySlug } } : {}),
    },
  })
  return NextResponse.json({ deliveries })
}
