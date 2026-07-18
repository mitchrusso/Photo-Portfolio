import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { renameWorkspacePortfolioGroup } from "@/lib/portfolio-groups"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"

type PortfolioGroupRouteProps = {
  params: Promise<{ groupId: string }>
}

const renameGroupSchema = z.object({
  name: z.string().trim().min(1).max(80),
})

export async function PATCH(request: Request, { params }: PortfolioGroupRouteProps) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const writeBlock = await getSubscriptionWriteBlock(session.user.workspaceId)
  if (writeBlock) return writeBlock

  const parsed = renameGroupSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Enter a gallery name of 80 characters or fewer." }, { status: 400 })

  try {
    const result = await renameWorkspacePortfolioGroup(
      session.user.workspaceId,
      (await params).groupId,
      parsed.data.name,
    )
    if (!result) return NextResponse.json({ error: "Gallery not found" }, { status: 404 })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not rename gallery"
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
