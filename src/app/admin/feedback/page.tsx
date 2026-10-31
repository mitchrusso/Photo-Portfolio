import Link from "next/link"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { isSuperAdminSession } from "@/lib/admin-access"
import { logAdminAuditEvent } from "@/lib/admin-audit"
import { hasValidSuperAdminMfa } from "@/lib/admin-mfa"
import { getPrismaClient } from "@/lib/db"
import { finalizeBugRepair } from "@/lib/feedback-workflow"

const allowedActions = new Set(["approve", "decline", "fixed", "reopen", "start_repair"])

function statusTone(status: string) {
  if (["FIXED", "APPROVED"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (["REPAIR_FAILED", "ALERT_DELIVERY_FAILED", "DECLINED"].includes(status)) return "border-red-200 bg-red-50 text-red-800"
  return "border-amber-200 bg-amber-50 text-amber-800"
}

function formatDate(value: Date | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(value)
}

async function updateFeedbackReport(formData: FormData) {
  "use server"
  const session = await auth()
  if (!isSuperAdminSession(session)) throw new Error("Forbidden")
  if (!(await hasValidSuperAdminMfa(session))) throw new Error("SuperAdmin verification required")

  const reportId = String(formData.get("reportId") ?? "").trim()
  const action = String(formData.get("action") ?? "").trim()
  const resolutionNote = String(formData.get("resolutionNote") ?? "").trim().slice(0, 2_000)
  if (!/^c[a-z0-9]{10,}$/i.test(reportId) || !allowedActions.has(action)) throw new Error("Invalid feedback action")

  const prisma = getPrismaClient()
  const report = await prisma.subscriberFeedbackReport.findUnique({ where: { id: reportId } })
  if (!report) throw new Error("Feedback report not found")

  if (action === "fixed") {
    await finalizeBugRepair({ reportId, resolutionNote })
  } else if (action === "approve") {
    if (report.type !== "improvement") throw new Error("Only feature requests can be approved")
    await prisma.subscriberFeedbackReport.update({
      data: { approvedAt: new Date(), status: "APPROVED" },
      where: { id: reportId },
    })
  } else if (action === "decline") {
    await prisma.subscriberFeedbackReport.update({
      data: { resolutionNote: resolutionNote || null, status: "DECLINED" },
      where: { id: reportId },
    })
  } else if (action === "start_repair") {
    if (report.type !== "bug") throw new Error("Only bugs enter the repair workflow")
    await prisma.subscriberFeedbackReport.update({ data: { status: "IN_REPAIR" }, where: { id: reportId } })
  } else {
    await prisma.subscriberFeedbackReport.update({
      data: {
        approvedAt: report.type === "improvement" ? null : report.approvedAt,
        fixedAt: null,
        resolutionNote: null,
        status: report.type === "bug" ? "PENDING_REPAIR" : report.type === "improvement" ? "AWAITING_APPROVAL" : "RECEIVED",
      },
      where: { id: reportId },
    })
  }

  await logAdminAuditEvent({
    action: `FEEDBACK_${action.toUpperCase()}`,
    metadata: { feedbackType: report.type, previousStatus: report.status },
    session,
    targetId: reportId,
    targetType: "SubscriberFeedbackReport",
  })
  revalidatePath("/admin/feedback")
}

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams?: Promise<{ report?: string }>
}) {
  const session = await auth()
  const params = await searchParams
  if (!session?.user) redirect(`/login?next=${encodeURIComponent("/admin/feedback")}`)
  if (!isSuperAdminSession(session)) redirect("/account")
  if (!(await hasValidSuperAdminMfa(session))) redirect(`/admin/verify?next=${encodeURIComponent("/admin/feedback")}`)

  const reports = await getPrismaClient().subscriberFeedbackReport.findMany({
    include: {
      alerts: { include: { deliveries: true }, orderBy: { createdAt: "desc" }, take: 3 },
      attachments: { orderBy: { createdAt: "asc" } },
      messages: { orderBy: { receivedAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  })
  const selectedId = params?.report

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-5 py-8 text-[#1d1d1b] md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-[#ded6c9] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#b58835]">PhotoView.io SuperAdmin</p>
            <h1 className="mt-2 text-4xl font-semibold">Bug and feature queue</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b6257]">
              Bugs remain open until a verified repair sends the subscriber confirmation. Feature requests wait here for your approval.
            </p>
          </div>
          <Link className="inline-flex h-10 items-center rounded-md border border-[#d7cec0] bg-white px-4 text-sm font-semibold" href="/admin">
            Back to command center
          </Link>
        </header>

        <section className="mt-6 space-y-4">
          {reports.map((report) => {
            const selected = selectedId === report.id
            return (
              <article className={`rounded-md border bg-white p-5 shadow-sm ${selected ? "border-[#b58835] ring-2 ring-[#e8d6b4]" : "border-[#ded6c9]"}`} id={report.id} key={report.id}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#1f2a24] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">{report.type === "improvement" ? "Feature" : report.type}</span>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone(report.status)}`}>{report.status.replaceAll("_", " ")}</span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">{report.lifecycleState.replaceAll("_", " ")}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold">{report.reporterName} · {report.workspaceLabel ?? "Unknown workspace"}</h2>
                    <p className="mt-1 text-sm text-[#6b6257]">{report.reporterEmail} · {formatDate(report.createdAt)} · {report.id}</p>
                    {report.pageUrl ? <a className="mt-1 block break-all text-sm text-blue-700 underline" href={report.pageUrl}>{report.pageUrl}</a> : null}
                  </div>
                  <div className="text-right text-xs leading-5 text-[#80786d]">
                    <p>{report.attachmentCount} attachment{report.attachmentCount === 1 ? "" : "s"}</p>
                    <p>Acknowledged: {formatDate(report.acknowledgedAt)}</p>
                    <p>Delivered: {formatDate(report.deliveredAt)}</p>
                  </div>
                </div>
                <div className="mt-4 whitespace-pre-wrap rounded-md border border-[#eee7dc] bg-[#fbfaf7] p-4 text-sm leading-6">{report.message}</div>
                {report.messages.length > 1 ? (
                  <details className="mt-3 rounded-md border border-[#eee7dc] bg-white p-3 text-sm">
                    <summary className="cursor-pointer font-semibold">Conversation ({report.messages.length} messages)</summary>
                    <div className="mt-3 space-y-3">
                      {report.messages.map((message) => (
                        <div className="rounded border border-[#eee7dc] bg-[#fbfaf7] p-3" key={message.id}>
                          <p className="text-xs text-[#80786d]">{message.direction} · {formatDate(message.receivedAt)}</p>
                          <p className="mt-2 whitespace-pre-wrap">{message.body}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
                {report.alerts.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {report.alerts.flatMap((alert) => alert.deliveries.map((delivery) => (
                      <span className="rounded-full border border-[#ded6c9] bg-[#fbfaf7] px-2.5 py-1" key={delivery.id}>
                        Owner {delivery.channel.toLowerCase()}: {delivery.status.toLowerCase()}
                      </span>
                    )))}
                  </div>
                ) : null}
                {report.resolutionNote ? <p className="mt-3 text-sm text-[#6b6257]"><strong>Resolution:</strong> {report.resolutionNote}</p> : null}

                <form action={updateFeedbackReport} className="mt-4 flex flex-col gap-3">
                  <input name="reportId" type="hidden" value={report.id} />
                  <textarea className="min-h-20 rounded-md border border-[#d7cec0] p-3 text-sm" name="resolutionNote" placeholder={report.type === "bug" ? "What changed (included in the subscriber's fixed email)" : "Approval or decline note"} />
                  <div className="flex flex-wrap gap-2">
                    {report.type === "bug" && !["FIXED", "IN_REPAIR"].includes(report.status) ? <button className="h-9 rounded-md border border-[#d7cec0] bg-white px-3 text-xs font-semibold" name="action" type="submit" value="start_repair">Start repair</button> : null}
                    {report.type === "bug" && report.status !== "FIXED" ? <button className="h-9 rounded-md bg-[#1f2a24] px-3 text-xs font-semibold text-white" name="action" type="submit" value="fixed">Mark fixed and email subscriber</button> : null}
                    {report.type === "improvement" && report.status === "AWAITING_APPROVAL" ? <button className="h-9 rounded-md bg-[#1f2a24] px-3 text-xs font-semibold text-white" name="action" type="submit" value="approve">Approve feature</button> : null}
                    {!["FIXED", "DECLINED"].includes(report.status) ? <button className="h-9 rounded-md border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-800" name="action" type="submit" value="decline">Decline</button> : null}
                    {["FIXED", "DECLINED", "REPAIR_FAILED"].includes(report.status) ? <button className="h-9 rounded-md border border-[#d7cec0] bg-white px-3 text-xs font-semibold" name="action" type="submit" value="reopen">Reopen</button> : null}
                  </div>
                </form>
              </article>
            )
          })}
          {reports.length === 0 ? <p className="rounded-md border border-[#ded6c9] bg-white p-8 text-sm text-[#6b6257]">No bug or feature reports have been submitted yet.</p> : null}
        </section>
      </div>
    </main>
  )
}
