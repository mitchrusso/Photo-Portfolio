import { NextResponse } from "next/server"
import { z } from "zod"

import { getPrismaClient } from "@/lib/db"
import {
  dispatchApprovedFeatureImplementation,
  dispatchAutomatedBugRepair,
  finalizeBugRepair,
  finalizeFeatureImplementation,
} from "@/lib/feedback-workflow"
import { authorizeRepairRunnerRequest } from "@/lib/github-actions-oidc"
import { recordOperationalEvent } from "@/lib/operational-monitoring"

const completionSchema = z.object({
  leaseId: z.string().uuid().optional(),
  outcome: z.enum(["clarification", "failed", "fixed", "retry"]),
  reportId: z.string().trim().min(10).max(80),
  resolutionNote: z.string().trim().max(2_000).optional(),
})

export async function POST(request: Request) {
  if (!(await authorizeRepairRunnerRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = completionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid repair result" }, { status: 400 })

  const prisma = getPrismaClient()
  const report = await prisma.subscriberFeedbackReport.findUnique({ where: { id: parsed.data.reportId } })
  if (!report) return NextResponse.json({ error: "Support report not found" }, { status: 404 })

  if (parsed.data.outcome === "clarification") {
    if (parsed.data.leaseId && report.leaseId !== parsed.data.leaseId) {
      return NextResponse.json({ ok: true, state: "stale_lease_ignored" })
    }
    const explanation = parsed.data.resolutionNote || "More information is required before this request can be implemented."
    await prisma.subscriberFeedbackReport.update({
      data: {
        escalatedAt: new Date(),
        escalationReason: explanation,
        leaseExpiresAt: null,
        leaseId: null,
        lifecycleState: report.type === "improvement" ? "AWAITING_OWNER_CLARIFICATION" : "ESCALATED",
        resolutionNote: explanation,
        status: report.type === "improvement" ? "NEEDS_CLARIFICATION" : "REPAIR_FAILED",
      },
      where: { id: report.id },
    })
    return NextResponse.json({ ok: true, state: report.type === "improvement" ? "feature_needs_clarification" : "repair_needs_human_review" })
  }

  if (parsed.data.outcome === "failed" || parsed.data.outcome === "retry") {
    if (parsed.data.leaseId && report.leaseId !== parsed.data.leaseId) {
      return NextResponse.json({ ok: true, state: "stale_lease_ignored" })
    }
    if (parsed.data.outcome === "retry") {
      await prisma.subscriberFeedbackReport.update({
        data: {
          escalationReason: null,
          leaseExpiresAt: null,
          leaseId: null,
          lifecycleState: "QUEUED",
          nextAttemptAt: new Date(),
          resolutionNote: parsed.data.resolutionNote,
          status: report.type === "improvement" ? "IMPLEMENTATION_QUEUED" : "PENDING_REPAIR",
        },
        where: { id: report.id },
      })
      const dispatch = report.type === "improvement"
        ? await dispatchApprovedFeatureImplementation(report)
        : await dispatchAutomatedBugRepair(report)
      return NextResponse.json({ dispatch, ok: true, state: report.type === "improvement" ? "feature_requeued" : "repair_requeued" })
    }
    await prisma.subscriberFeedbackReport.update({
      data: {
        escalatedAt: new Date(),
        escalationReason: parsed.data.resolutionNote ?? "Automated repair failed.",
        leaseExpiresAt: null,
        leaseId: null,
        lifecycleState: "ESCALATED",
        resolutionNote: parsed.data.resolutionNote ?? "Automated repair failed.",
        status: report.type === "improvement" ? "IMPLEMENTATION_FAILED" : "REPAIR_FAILED",
      },
      where: { id: report.id },
    })
    await recordOperationalEvent({
      category: "SYSTEM",
      fingerprint: `feedback:repair:${report.id}`,
      message: report.type === "improvement"
        ? `Approved feature implementation failed for report ${report.id}.`
        : `Automated repair failed for bug report ${report.id}.`,
      severity: "ERROR",
      source: "/api/feedback/repair-complete",
      workspaceId: report.workspaceId,
    })
    return NextResponse.json({ ok: true, state: "repair_failed" })
  }

  try {
    const result = report.type === "improvement"
      ? await finalizeFeatureImplementation({
          leaseId: parsed.data.leaseId,
          reportId: parsed.data.reportId,
          resolutionNote: parsed.data.resolutionNote,
        })
      : await finalizeBugRepair({
          leaseId: parsed.data.leaseId,
          reportId: parsed.data.reportId,
          resolutionNote: parsed.data.resolutionNote,
        })
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Repair completion failed" }, { status: 500 })
  }
}
