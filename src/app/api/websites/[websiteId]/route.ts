import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { ensureWorkspaceForSession } from "@/lib/dev-workspace"
import { normalizeWebsiteName } from "@/lib/multi-website-rules"
import { serializeWebsiteSummary, websiteSummarySelect } from "@/lib/multi-website"
import { isSameOriginRequest } from "@/lib/request-origin"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"
import { removeCustomDomainFromVercel } from "@/lib/vercel-domains"
import { disableWebsiteImmediately, WebsiteActivationError } from "@/lib/website-activation"

const updateWebsiteSchema = z.object({
  name: z.string().trim().min(1).max(80),
})

async function getAccess() {
  const session = await auth()
  if (!session?.user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  const workspace = await ensureWorkspaceForSession(session.user.workspaceId)
  if (!workspace) return { response: NextResponse.json({ error: "Workspace not found" }, { status: 404 }) }
  return { session, workspace }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ websiteId: string }> }) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  const access = await getAccess()
  if ("response" in access) return access.response
  const writeBlock = await getSubscriptionWriteBlock(access.session.user.workspaceId)
  if (writeBlock) return writeBlock

  const parsed = updateWebsiteSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Enter a website name between 1 and 80 characters." }, { status: 400 })
  const { websiteId } = await params
  const existing = await getPrismaClient().website.findFirst({
    select: { id: true },
    where: { deletedAt: null, id: websiteId, workspaceId: access.workspace.id },
  })
  if (!existing) return NextResponse.json({ error: "Website not found." }, { status: 404 })

  const website = await getPrismaClient().website.update({
    data: { name: normalizeWebsiteName(parsed.data.name) },
    select: websiteSummarySelect,
    where: { id: websiteId },
  })
  return NextResponse.json({ website: serializeWebsiteSummary(website) })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ websiteId: string }> }) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  const access = await getAccess()
  if ("response" in access) return access.response
  const writeBlock = await getSubscriptionWriteBlock(access.session.user.workspaceId)
  if (writeBlock) return writeBlock
  const { websiteId } = await params

  try {
    const result = await disableWebsiteImmediately({ websiteId, workspaceId: access.workspace.id })
    if (result.customDomain) await removeCustomDomainFromVercel(result.customDomain).catch(() => undefined)
    return NextResponse.json({
      deletedAt: result.deletedAt.toISOString(),
      message: "Website access was disabled immediately. Its add-on will not renew on the next bill.",
    })
  } catch (error) {
    if (error instanceof WebsiteActivationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "The website was disabled, but billing reconciliation needs attention." }, { status: 502 })
  }
}
