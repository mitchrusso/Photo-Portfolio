import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db"
import { getAuthorizedCrmSession, hasSameOrigin } from "@/lib/partnership-crm/access"

export async function POST(request: NextRequest) {
  const session = await getAuthorizedCrmSession()
  if (!session || !hasSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await getPrismaClient().crmGoogleConnection.deleteMany({ where: { userId: session.user.id } })
  return NextResponse.json({ disconnected: true })
}
