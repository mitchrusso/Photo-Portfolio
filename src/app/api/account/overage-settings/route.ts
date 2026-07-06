import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"

const overageSettingsSchema = z.object({
  autoRolloverEnabled: z.boolean(),
  overagePolicy: z.enum(["ASK_FIRST", "AUTO_UPGRADE_NEXT_TIER", "AUTO_BUY_BLOCKS"]),
})

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const parsed = overageSettingsSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid overage settings", issues: parsed.error.flatten() }, { status: 400 })
  }

  const prisma = getPrismaClient()
  const subscription = await prisma.subscription.update({
    data: parsed.data,
    select: {
      autoRolloverEnabled: true,
      overagePolicy: true,
    },
    where: {
      workspaceId: session.user.workspaceId,
    },
  })

  return NextResponse.json({ subscription })
}
