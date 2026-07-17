import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { activateSocialSchedule } from "@/lib/social-publishing"

const bodySchema = z.object({
  galleryId: z.string().min(1).max(200),
  schedule: z.unknown(),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "A valid portfolio and schedule are required." }, { status: 400 })

  try {
    const result = await activateSocialSchedule({
      gallerySlug: parsed.data.galleryId,
      request,
      schedule: parsed.data.schedule as Parameters<typeof activateSocialSchedule>[0]["schedule"],
      workspaceId: session.user.workspaceId,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The social schedule could not be activated." },
      { status: 400 },
    )
  }
}
