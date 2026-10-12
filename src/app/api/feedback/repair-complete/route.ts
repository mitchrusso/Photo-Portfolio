import { NextResponse } from "next/server"
import { z } from "zod"

import { hasAuthorizedBearerSecret } from "@/lib/bearer-auth"
import { getPrismaClient } from "@/lib/db"
import { finalizeBugRepair } from "@/lib/feedback-workflow"
import { recordOperationalEvent } from "@/lib/operational-monitoring"

const completionSchema = z.object({
  outcome: z.enum(["failed", "fixed"]),
  reportId: z.string().trim().min(10).max(80),
  resolutionNote: z.string().trim().max(2_000).optional(),
})

export async function POST(request: Request) {
  if (!hasAuthorizedBearerSecret(request, [process.env.BUG_REPAIR_WEBHOOK_SECRET])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = completionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid repair result" }, { status: 400 })

  if (parsed.data.outcome === "failed") {
    const report = await getPrismaClient().subscriberFeedbackReport.update({
      data: { resolutionNote: parsed.data.resolutionNote ?? "Automated repair failed.", status: "REPAIR_FAILED" },
      where: { id: parsed.data.reportId },
    }).catch(() => null)
    if (!report) return NextResponse.json({ error: "Bug report not found" }, { status: 404 })
    await recordOperationalEvent({
      category: "SYSTEM",
      fingerprint: `feedback:repair:${report.id}`,
      message: `Automated repair failed for bug report ${report.id}.`,
      severity: "ERROR",
      source: "/api/feedback/repair-complete",
      workspaceId: report.workspaceId,
    })
    return NextResponse.json({ ok: true, state: "repair_failed" })
  }

  try {
    const result = await finalizeBugRepair({
      reportId: parsed.data.reportId,
      resolutionNote: parsed.data.resolutionNote,
    })
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Repair completion failed" }, { status: 500 })
  }
}
