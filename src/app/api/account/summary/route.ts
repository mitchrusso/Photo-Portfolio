import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { getSubscriberAccountSummary } from "@/lib/subscriber-account"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const account = await getSubscriberAccountSummary(session.user.workspaceId)

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 })
  }

  return NextResponse.json(
    { account },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  )
}
