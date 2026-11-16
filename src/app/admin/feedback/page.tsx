import Link from "next/link"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { isSuperAdminSession } from "@/lib/admin-access"
import { logAdminAuditEvent } from "@/lib/admin-audit"
import { hasValidSuperAdminMfa } from "@/lib/admin-mfa"
import { getPrismaClient } from "@/lib/db"
import {
  declineFeatureRequest,
  dispatchApprovedFeatureImplementation,
  finalizeBugRepair,
} from "@/lib/feedback-workflow"

const allowedActions = new Set(["approve", "decline", "fixed", "reopen", "start_repair"])

function statusTone(status: string) {
  if (["FIXED", "APPROVED", "IMPLEMENTED"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (["REPAIR_FAILED", "IMPLEMENTATION_FAILED", "ALERT_DELIVERY_FAILED", "DECLINED"].includes(status)) return "border-red-200 bg-red-50 text-red-800"
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
      data: {
        approvedAt: report.approvedAt ?? new Date(),
        escalationReason: null,
        lifecycleState: "IMPLEMENTATION_QUEUED",
        resolutionNote: resolutionNote || report.resolutionNote,
        status: "IMPLEMENTATION_QUEUED",
      },
      where: { id: reportId },
    })
    const dispatch = await dispatchApprovedFeatureImplementation(report)
    if (dispatch !== "dispatched") {
      await prisma.subscriberFeedbackReport.update({
        data: {
          escalationReason: "The implementation worker could not be started. Click Accept feature to try again.",
          lifecycleState: "APPROVED",
          status: "APPROVED",
        },
        where: { id: reportId },
      })
    }
  } else if (action === "decline") {
    if (report.type === "improvement") {
      await declineFeatureRequest({ reportId, resolutionNote })
    } else {
      await prisma.subscriberFeedbackReport.update({
        data: { resolutionNote: resolutionNote || null, status: "DECLINED" },
        where: { id: reportId },
      })
    }
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
  searchParams?: Promise<{ report?: string; type?: string }>
}) {
  const session = await auth()
  const params = await searchParams
  if (!session?.user) redirect(`/login?next=${encodeURIComponent("/admin/feedback")}`)
  if (!isSuperAdminSession(session)) redirect("/account")
  if (!(await hasValidSuperAdminMfa(session))) redirect(`/admin/verify?next=${encodeURIComponent("/admin/feedback")}`)

  const typeFilter = params?.type === "features" ? "improvement" : params?.type === "bugs" ? "bug" : params?.type === "questions" ? "question" : null
  const reports = await getPrismaClient().subscriberFeedbackReport.findMany({
    include: {
      alerts: { include: { deliveries: true }, orderBy: { createdAt: "desc" }, take: 3 },
      attachments: { orderBy: { createdAt: "asc" } },
      messages: { orderBy: { receivedAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    where: typeFilter ? { type: typeFilter } : undefined,
  })
  const selectedId = params?.report
  const orderedReports = selectedId
    ? [...reports.filter((report) => report.id === selectedId), ...reports.filter((report) => report.id !== selectedId)]
    : reports

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-5 py-8 text-[#1d1d1b] md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-[#ded6c9] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#b58835]">PhotoView.io SuperAdmin</p>
            <h1 className="mt-2 text-4xl font-semibold">PhotoView Support Center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b6257]">
              One place for subscriber questions, bugs, feedback, feature suggestions, complete conversations, and delivery status.
            </p>
          </div>
          <Link className="inline-flex h-10 items-center rounded-md border border-[#d7cec0] bg-white px-4 text-sm font-semibold" href="/admin">
            Back to command center
          </Link>
        </header>

        <nav aria-label="Support request filters" className="mt-6 flex flex-wrap gap-2">
          {[
            ["All requests", "/admin/feedback"],
            ["Feature suggestions", "/admin/feedback?type=features"],
            ["Bugs", "/admin/feedback?type=bugs"],
            ["Questions", "/admin/feedback?type=questions"],
          ].map(([label, href]) => {
            const active = href === "/admin/feedback"
              ? !typeFilter
              : href.includes(`type=${params?.type}`)
            return <Link className={`rounded-full border px-4 py-2 text-sm font-semibold ${active ? "border-[#1f2a24] bg-[#1f2a24] text-white" : "border-[#d7cec0] bg-white"}`} href={href} key={href}>{label}</Link>
          })}
        </nav>

        <section className="mt-6 space-y-4">
          {orderedReports.map((report) => {
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
                    <p className="mt-1 text-sm text-[#4f483f]"><strong>Subject:</strong> {report.messages[0]?.subject ?? "(No subject)"}</p>
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
                {report.lifecycleState === "AWAITING_OWNER_CLARIFICATION" && report.escalationReason ? (
                  <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                    <p className="font-semibold">Questions before this can be implemented</p>
                    <p className="mt-2 whitespace-pre-wrap">{report.escalationReason}</p>
                    <p className="mt-2 text-xs">Add the answers in the note below, then click Accept feature again.</p>
                  </div>
                ) : report.escalationReason ? <p className="mt-3 text-sm text-red-700"><strong>Needs attention:</strong> {report.escalationReason}</p> : null}

                <form action={updateFeedbackReport} className="mt-4 flex flex-col gap-3">
                  <input name="reportId" type="hidden" value={report.id} />
                  <textarea className="min-h-20 rounded-md border border-[#d7cec0] p-3 text-sm" name="resolutionNote" placeholder={report.type === "bug" ? "What changed (included in the subscriber's fixed email)" : "Approval or decline note"} />
                  <div className="flex flex-wrap gap-2">
                    {report.type === "bug" && !["FIXED", "IN_REPAIR"].includes(report.status) ? <button className="h-9 rounded-md border border-[#d7cec0] bg-white px-3 text-xs font-semibold" name="action" type="submit" value="start_repair">Start repair</button> : null}
                    {report.type === "bug" && report.status !== "FIXED" ? <button className="h-9 rounded-md bg-[#1f2a24] px-3 text-xs font-semibold text-white" name="action" type="submit" value="fixed">Mark fixed and email subscriber</button> : null}
                    {report.type === "improvement" && ["AWAITING_APPROVAL", "APPROVED", "NEEDS_CLARIFICATION"].includes(report.status) ? <button className="h-9 rounded-md bg-[#1f2a24] px-3 text-xs font-semibold text-white" name="action" type="submit" value="approve">Accept feature</button> : null}
                    {report.type === "improvement" && !["DECLINED", "IMPLEMENTED"].includes(report.status) ? <button className="h-9 rounded-md border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-800" name="action" type="submit" value="decline">Reject feature and email subscriber</button> : null}
                    {report.type !== "improvement" && !["FIXED", "DECLINED"].includes(report.status) ? <button className="h-9 rounded-md border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-800" name="action" type="submit" value="decline">Decline</button> : null}
                    {["FIXED", "DECLINED", "REPAIR_FAILED", "IMPLEMENTED"].includes(report.status) ? <button className="h-9 rounded-md border border-[#d7cec0] bg-white px-3 text-xs font-semibold" name="action" type="submit" value="reopen">Reopen</button> : null}
                  </div>
                </form>
              </article>
            )
          })}
          {reports.length === 0 ? <p className="rounded-md border border-[#ded6c9] bg-white p-8 text-sm text-[#6b6257]">No support requests have been submitted yet.</p> : null}
        </section>
      </div>
    </main>
  )
}
