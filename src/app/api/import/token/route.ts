import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { issueImportToken } from "@/lib/import-token"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"
import { isSameOriginRequest } from "@/lib/request-origin"

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const writeBlock = await getSubscriptionWriteBlock(session.user.workspaceId)
  if (writeBlock) return writeBlock

  return NextResponse.json({
    expiresInDays: 90,
    token: await issueImportToken(session.user.workspaceId),
  })
}
