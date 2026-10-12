import { NextResponse } from "next/server"

import { getPrismaClient } from "@/lib/db"
import { authorizeRepairRunnerRequest } from "@/lib/github-actions-oidc"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  if (!(await authorizeRepairRunnerRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const prisma = getPrismaClient()
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
      where: { status: "PENDING_REPAIR", type: "bug" },
    })
    if (!report) return new NextResponse(null, { status: 204 })

    const claim = await prisma.subscriberFeedbackReport.updateMany({
      data: { status: "IN_REPAIR" },
      where: { id: report.id, status: "PENDING_REPAIR", type: "bug" },
    })
    if (claim.count === 1) {
      return NextResponse.json({
        report: {
          createdAt: report.createdAt.toISOString(),
          id: report.id,
          message: report.message,
          pageUrl: report.pageUrl,
          workspaceLabel: report.workspaceLabel,
        },
      })
    }
  }

  return NextResponse.json({ error: "Repair queue is busy" }, { status: 409 })
}
