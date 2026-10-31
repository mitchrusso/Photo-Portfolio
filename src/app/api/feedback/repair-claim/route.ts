import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"

import { getPrismaClient } from "@/lib/db"
import { authorizeRepairRunnerRequest } from "@/lib/github-actions-oidc"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  if (!(await authorizeRepairRunnerRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const prisma = getPrismaClient()
  const now = new Date()
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const report = await prisma.subscriberFeedbackReport.findFirst({
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        id: true,
        message: true,
        pageUrl: true,
        workspaceLabel: true,
      },
      where: {
        OR: [
          { status: "PENDING_REPAIR" },
          { leaseExpiresAt: { lte: now }, status: "IN_REPAIR" },
        ],
        type: "bug",
      },
    })
    if (!report) return new NextResponse(null, { status: 204 })

    const leaseId = randomUUID()
    const claim = await prisma.subscriberFeedbackReport.updateMany({
      data: {
        leaseExpiresAt: new Date(now.getTime() + 45 * 60 * 1000),
        leaseId,
        lifecycleState: "REPAIR_IN_PROGRESS",
        status: "IN_REPAIR",
      },
      where: {
        id: report.id,
        OR: [
          { status: "PENDING_REPAIR" },
          { leaseExpiresAt: { lte: now }, status: "IN_REPAIR" },
        ],
        type: "bug",
      },
    })
    if (claim.count === 1) {
      return NextResponse.json({
        report: {
          createdAt: report.createdAt.toISOString(),
          id: report.id,
          leaseId,
          message: report.message,
          pageUrl: report.pageUrl,
          workspaceLabel: report.workspaceLabel,
        },
      })
    }
  }

  return NextResponse.json({ error: "Repair queue is busy" }, { status: 409 })
}
