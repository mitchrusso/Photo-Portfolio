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
  const input = await request.json().catch(() => null) as { approvedFeatureReportId?: unknown } | null
  const approvedFeatureReportId = typeof input?.approvedFeatureReportId === "string"
    ? input.approvedFeatureReportId.trim()
    : ""
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const report = await prisma.subscriberFeedbackReport.findFirst({
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        id: true,
        message: true,
        pageUrl: true,
        resolutionNote: true,
        type: true,
        workspaceLabel: true,
      },
      where: approvedFeatureReportId
        ? {
            id: approvedFeatureReportId,
            OR: [
              { status: "IMPLEMENTATION_QUEUED" },
              { leaseExpiresAt: { lte: now }, status: "IN_REPAIR" },
            ],
            type: "improvement",
          }
        : {
            OR: [
              { status: "PENDING_REPAIR", type: "bug" },
              { leaseExpiresAt: { lte: now }, status: "IN_REPAIR", type: "bug" },
              { status: "IMPLEMENTATION_QUEUED", type: "improvement" },
              { leaseExpiresAt: { lte: now }, status: "IN_REPAIR", type: "improvement" },
            ],
          },
    })
    if (!report) return new NextResponse(null, { status: 204 })

    const leaseId = randomUUID()
    const claim = await prisma.subscriberFeedbackReport.updateMany({
      data: {
        leaseExpiresAt: new Date(now.getTime() + 45 * 60 * 1000),
        leaseId,
        lifecycleState: report.type === "improvement" ? "IMPLEMENTATION_IN_PROGRESS" : "REPAIR_IN_PROGRESS",
        status: "IN_REPAIR",
      },
      where: {
        id: report.id,
        ...(report.type === "improvement"
          ? {
              OR: [
                { status: "IMPLEMENTATION_QUEUED" },
                { leaseExpiresAt: { lte: now }, status: "IN_REPAIR" },
              ],
              type: "improvement",
            }
          : {
              OR: [
                { status: "PENDING_REPAIR" },
                { leaseExpiresAt: { lte: now }, status: "IN_REPAIR" },
              ],
              type: "bug",
            }),
      },
    })
    if (claim.count === 1) {
      return NextResponse.json({
        report: {
          createdAt: report.createdAt.toISOString(),
          id: report.id,
          leaseId,
          message: report.message,
          ownerNote: report.resolutionNote,
          pageUrl: report.pageUrl,
          type: report.type,
          workspaceLabel: report.workspaceLabel,
        },
      })
    }
  }

  return NextResponse.json({ error: "Repair queue is busy" }, { status: 409 })
}
