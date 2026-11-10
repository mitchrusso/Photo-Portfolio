import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db"
import { getAuthorizedCrmSession } from "@/lib/partnership-crm/access"
import { hasRequiredGmailScopes } from "@/lib/partnership-crm/google"
import { supportGmailAddress, supportGmailIsConfigured } from "@/lib/support-gmail"

export async function GET() {
  const session = await getAuthorizedCrmSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const email = supportGmailAddress()
  const prisma = getPrismaClient()
  const [connection, heartbeat] = await Promise.all([
    prisma.supportGoogleConnection.findUnique({ select: { email: true, scopes: true, updatedAt: true }, where: { email } }),
    prisma.supportWorkerHeartbeat.findUnique({ select: { completedAt: true, lastError: true, startedAt: true }, where: { name: "photoview-support-engine" } }),
  ])
  const authorizationRejected = /Google rejected the support mailbox authorization/i.test(heartbeat?.lastError ?? "")
  return NextResponse.json({
    configured: supportGmailIsConfigured(),
    connected: Boolean(connection && hasRequiredGmailScopes(connection.scopes) && !authorizationRejected),
    email,
    lastCompletedAt: heartbeat?.completedAt ?? null,
    lastError: heartbeat?.lastError ?? null,
    needsReconnect: authorizationRejected,
    updatedAt: connection?.updatedAt ?? null,
  })
}
