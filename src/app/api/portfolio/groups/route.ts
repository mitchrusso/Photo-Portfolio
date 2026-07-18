import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { ensureWorkspaceForSession } from "@/lib/dev-workspace"
import { createWorkspacePortfolioGroup, getWorkspacePortfolioGroups } from "@/lib/portfolio-groups"
import { getWorkspaceEntitlement } from "@/lib/subscription-entitlements"
import { subscriptionWriteBlockResponse } from "@/lib/subscription-api"

const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(80),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const groups = await getWorkspacePortfolioGroups(session.user.workspaceId)
  return NextResponse.json({ groups })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await ensureWorkspaceForSession(session.user.workspaceId)
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

  const entitlement = await getWorkspaceEntitlement(session.user.workspaceId)
  if (entitlement.mode !== "write") return subscriptionWriteBlockResponse(entitlement)

  const parsed = createGroupSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Enter a gallery name of 80 characters or fewer." }, { status: 400 })

  const group = await createWorkspacePortfolioGroup(session.user.workspaceId, parsed.data.name)
  return NextResponse.json({ group }, { status: 201 })
}
