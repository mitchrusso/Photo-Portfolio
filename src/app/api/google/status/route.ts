import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db"
import { getAuthorizedCrmSession } from "@/lib/partnership-crm/access"
import { googleIsConfigured } from "@/lib/partnership-crm/google"

export async function GET() {
  const session = await getAuthorizedCrmSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const connection = await getPrismaClient().crmGoogleConnection.findUnique({ select: { email: true, updatedAt: true }, where: { userId: session.user.id } })
  return NextResponse.json({ configured: googleIsConfigured(), connected: Boolean(connection), email: connection?.email ?? null, updatedAt: connection?.updatedAt ?? null })
}
