import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import {
  deleteWorkspacePortfolioGroup,
  renameWorkspacePortfolioGroup,
  updateWorkspacePortfolioGroupProtection,
} from "@/lib/portfolio-groups"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"

type PortfolioGroupRouteProps = {
  params: Promise<{ groupId: string }>
}

const renameGroupSchema = z.object({
  name: z.string().trim().min(1).max(80),
})
const protectionSchema = z.object({
  password: z.string().max(300).optional(),
  passwordProtected: z.boolean(),
  twoFactorEnabled: z.boolean(),
})

export async function PATCH(request: Request, { params }: PortfolioGroupRouteProps) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const writeBlock = await getSubscriptionWriteBlock(session.user.workspaceId)
  if (writeBlock) return writeBlock

  const body = await request.json().catch(() => null)
  const protection = protectionSchema.safeParse(body)
  if (protection.success) {
    if (
      protection.data.passwordProtected &&
      protection.data.password &&
      protection.data.password.trim().length < 8
    ) {
      return NextResponse.json({ error: "Use at least 8 characters for a new Gallery password." }, { status: 400 })
    }
    try {
      const group = await updateWorkspacePortfolioGroupProtection(
        session.user.workspaceId,
        (await params).groupId,
        protection.data,
      )
      if (!group) return NextResponse.json({ error: "Gallery not found" }, { status: 404 })
      return NextResponse.json({ group })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update Gallery protection"
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  const parsed = renameGroupSchema.safeParse(body)
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

export async function DELETE(_request: Request, { params }: PortfolioGroupRouteProps) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const writeBlock = await getSubscriptionWriteBlock(session.user.workspaceId)
  if (writeBlock) return writeBlock

  const result = await deleteWorkspacePortfolioGroup(session.user.workspaceId, (await params).groupId)
  if (!result) return NextResponse.json({ error: "Gallery not found" }, { status: 404 })
  if (result.portfolioCount > 0) {
    return NextResponse.json({
      error: `Move or delete the ${result.portfolioCount} portfolio${result.portfolioCount === 1 ? "" : "s"} inside this gallery first. No portfolios or photos were changed.`,
      portfolioCount: result.portfolioCount,
    }, { status: 409 })
  }
  return NextResponse.json({ deleted: result.deleted, ok: true })
}
