import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createImportToken } from "@/lib/import-token"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"

export async function POST() {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const writeBlock = await getSubscriptionWriteBlock(session.user.workspaceId)
  if (writeBlock) return writeBlock

  return NextResponse.json({
    expiresInDays: 90,
    token: createImportToken(session.user.workspaceId),
  })
}
