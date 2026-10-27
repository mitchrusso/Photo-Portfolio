import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db"
import { getAuthorizedCrmSession } from "@/lib/partnership-crm/access"
import { hasRequiredGmailScopes } from "@/lib/partnership-crm/google"
import { supportGmailAddress, supportGmailIsConfigured } from "@/lib/support-gmail"

export async function GET() {
  const session = await getAuthorizedCrmSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const email = supportGmailAddress()
  const connection = await getPrismaClient().supportGoogleConnection.findUnique({ select: { email: true, scopes: true, updatedAt: true }, where: { email } })
  return NextResponse.json({
    configured: supportGmailIsConfigured(),
    connected: Boolean(connection && hasRequiredGmailScopes(connection.scopes)),
    email,
    updatedAt: connection?.updatedAt ?? null,
  })
}
