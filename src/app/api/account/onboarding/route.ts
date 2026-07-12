import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"

const onboardingEventSchema = z.object({
  action: z.literal("preview"),
  galleryId: z.string().min(1).max(160).optional(),
})

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = onboardingEventSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid onboarding event" }, { status: 400 })
  }

  const prisma = getPrismaClient()
  const existing = await prisma.analyticsEvent.findFirst({
    select: { id: true },
    where: {
      eventType: "ONBOARDING_PREVIEW",
      metadata: {
        path: ["workspaceId"],
        equals: session.user.workspaceId,
      },
    },
  })

  if (!existing) {
    await prisma.analyticsEvent.create({
      data: {
        deviceType: "DASHBOARD",
        eventType: "ONBOARDING_PREVIEW",
        galleryId: parsed.data.galleryId ?? null,
        metadata: {
          action: parsed.data.action,
          workspaceId: session.user.workspaceId,
        },
        path: "/dashboard",
        title: "Subscriber portfolio preview",
      },
    })
  }

  return NextResponse.json({ ok: true })
}
