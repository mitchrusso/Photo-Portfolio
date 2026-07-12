import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createImportToken } from "@/lib/import-token"

export async function POST() {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json({
    expiresInDays: 90,
    token: createImportToken(session.user.workspaceId),
  })
}
