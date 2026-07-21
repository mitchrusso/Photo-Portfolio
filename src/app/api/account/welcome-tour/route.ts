import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"

export async function POST() {
  const session = await auth()

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await getPrismaClient().workspace.updateMany({
    data: { welcomeTourPending: false },
    where: { id: session.user.workspaceId },
  })

  return NextResponse.json({ ok: true })
}
