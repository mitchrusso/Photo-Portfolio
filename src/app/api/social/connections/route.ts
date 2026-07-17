import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { getMetaSocialConfig } from "@/lib/meta-social"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const connections = await getPrismaClient().socialConnection.findMany({
    orderBy: [{ network: "asc" }, { providerAccountName: "asc" }],
    select: {
      id: true,
      lastVerifiedAt: true,
      network: true,
      provider: true,
      providerAccountId: true,
      providerAccountName: true,
      status: true,
      tokenExpiresAt: true,
    },
    where: { status: "ACTIVE", workspaceId: session.user.workspaceId },
  })
  return NextResponse.json({ connections, providers: { meta: Boolean(getMetaSocialConfig()) } })
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = new URL(request.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Connection id is required." }, { status: 400 })
  const prisma = getPrismaClient()
  const [result] = await prisma.$transaction([
    prisma.socialConnection.updateMany({
      data: { status: "REVOKED" },
      where: { id, workspaceId: session.user.workspaceId },
    }),
    prisma.socialDelivery.updateMany({
      data: { lastError: "Social account disconnected by subscriber.", status: "CANCELED" },
      where: { connectionId: id, status: { in: ["PENDING", "PROCESSING"] }, workspaceId: session.user.workspaceId },
    }),
  ])
  return NextResponse.json({ disconnected: result.count === 1 })
}
