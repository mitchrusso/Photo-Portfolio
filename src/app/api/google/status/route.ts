import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db"
import { getAuthorizedCrmSession } from "@/lib/partnership-crm/access"
import { crmGmailAddress, googleIsConfigured, hasRequiredGmailScopes } from "@/lib/partnership-crm/google"

export async function GET() {
  const session = await getAuthorizedCrmSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const connection = await getPrismaClient().crmGoogleConnection.findUnique({ select: { email: true, scopes: true, updatedAt: true }, where: { userId: session.user.id } })
  const messagingEmail = crmGmailAddress()
  const mailboxMatches = connection?.email.trim().toLowerCase() === messagingEmail
  const scopesCurrent = hasRequiredGmailScopes(connection?.scopes)
  const connected = Boolean(mailboxMatches && scopesCurrent)
  return NextResponse.json({ configured: googleIsConfigured(), connected, email: connection?.email ?? null, messagingEmail, needsReconnect: Boolean(mailboxMatches && !scopesCurrent), updatedAt: connection?.updatedAt ?? null, wrongAccountConnected: Boolean(connection && !mailboxMatches) })
}
