import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { getWorkspaceEntitlement } from "@/lib/subscription-entitlements"
import { subscriptionWriteBlockResponse } from "@/lib/subscription-api"

export async function POST(): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const entitlement = await getWorkspaceEntitlement(session.user.workspaceId)
  if (entitlement.mode !== "write") return subscriptionWriteBlockResponse(entitlement)

  return NextResponse.json(
    {
      error: "This legacy upload endpoint has been retired. Use the PhotoViewPro uploader, which securely meters the configured storage provider.",
    },
    { status: 410 },
  )
}
