import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db"
import { getAuthorizedCrmSession } from "@/lib/partnership-crm/access"
import { crmGmailAddress, googleIsConfigured } from "@/lib/partnership-crm/google"

export async function GET() {
  const session = await getAuthorizedCrmSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const connection = await getPrismaClient().crmGoogleConnection.findUnique({ select: { email: true, updatedAt: true }, where: { userId: session.user.id } })
  const messagingEmail = crmGmailAddress()
  const connected = connection?.email.trim().toLowerCase() === messagingEmail
  return NextResponse.json({ configured: googleIsConfigured(), connected, email: connection?.email ?? null, messagingEmail, updatedAt: connection?.updatedAt ?? null, wrongAccountConnected: Boolean(connection && !connected) })
}
