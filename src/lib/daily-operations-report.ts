import { getPrismaClient } from "@/lib/db"
import { claimEmailDelivery, finishEmailDelivery } from "@/lib/email-delivery-idempotency"
import { sendTransactionalEmail } from "@/lib/email-delivery-health"
import { getOperationalHealthSummary } from "@/lib/operational-monitoring"
import {
  DAILY_REPORT_TIME_ZONE,
  getEasternReportDate,
  isDailyOperationsReportTime,
} from "@/lib/daily-report-schedule"

export { getEasternReportDate, isDailyOperationsReportTime } from "@/lib/daily-report-schedule"

const REPORT_RECIPIENT = "mitchrusso@gmail.com"
const DAY_MS = 24 * 60 * 60 * 1000

type ServiceHealth = {
  detail: string
  key: string
  label: string
  status: "DEGRADED" | "HEALTHY" | "OUTAGE"
}

type PlanSummaryRow = {
  attention: number
  live: number
  plan: string
  total: number
  trial: number
  unsubscribed: number
}

type MediaSummaryRow = {
  storageBytes: number
  storedItems: number
  type: "Photos" | "Videos"
  uploads24Hours: number
}

type FailureReportRow = {
  category: string
  lastOccurredAt: string
  message: string
  occurrenceCount: number
  severity: string
  source: string
  status: string
  workspace: string | null
}

export type DailyOperationsReport = {
  endingAt: string
  failures: FailureReportRow[]
  health: {
    criticalCount: number
    email: {
      attempts24Hours: number
      delivered24Hours: number
      deliveryProblems24Hours: number
      failed24Hours: number
    }
    openCount: number
    services: ServiceHealth[]
    status: "DEGRADED" | "HEALTHY" | "OUTAGE"
    warningCount: number
  }
  media: {
    storageBytes: number
    storedItems: number
    types: MediaSummaryRow[]
    uploads24Hours: number
  }
  newTrials: number
  plans: {
    attention: number
    live: number
    rows: PlanSummaryRow[]
    total: number
    trial: number
    unsubscribed: number
  }
  reportDate: string
  trialsEnding: number
  windowStartedAt: string
}

function safeNumber(value: bigint | number) {
  return typeof value === "bigint" ? Number(value) : value
}

function subscriptionSummaryStatus(subscription: {
  cancelAtPeriodEnd: boolean
  status: string
}): "attention" | "live" | "trial" | "unsubscribed" {
  if (subscription.status === "TRIALING") return "trial"
  if (subscription.cancelAtPeriodEnd || subscription.status === "CANCELED") return "unsubscribed"
  if (["INCOMPLETE", "PAST_DUE", "UNPAID"].includes(subscription.status)) return "attention"
  return "live"
}

function mediaType(kind: string): MediaSummaryRow["type"] {
  return kind === "VIDEO" ? "Videos" : "Photos"
}

function summedMediaBytes(row: {
  _sum: { bytes: bigint | null; displayBytes: bigint | null; thumbnailBytes: bigint | null }
}) {
  const zero = BigInt(0)
  return safeNumber((row._sum.bytes ?? zero) + (row._sum.displayBytes ?? zero) + (row._sum.thumbnailBytes ?? zero))
}

export async function buildDailyOperationsReport(now = new Date()): Promise<DailyOperationsReport> {
  const prisma = getPrismaClient()
  const since = new Date(now.getTime() - DAY_MS)
  const trialHorizon = new Date(now.getTime() + 7 * DAY_MS)

  const [
    subscriptions,
    allMedia,
    recentUploads,
    operationalEvents,
    newTrialSignups,
    health,
  ] = await Promise.all([
    prisma.subscription.findMany({
      include: {
        plan: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.photo.groupBy({
      _count: { _all: true },
      _sum: { bytes: true, displayBytes: true, thumbnailBytes: true },
      by: ["kind"],
    }),
    prisma.photo.groupBy({
      _count: { _all: true },
      by: ["kind"],
      where: { createdAt: { gte: since, lt: now } },
    }),
    prisma.operationalEvent.findMany({
      include: { workspace: { select: { name: true } } },
      orderBy: { lastOccurredAt: "desc" },
      where: {
        severity: { in: ["CRITICAL", "ERROR", "WARNING"] },
        OR: [
          { lastOccurredAt: { gte: since, lt: now } },
          { status: "OPEN" },
        ],
      },
    }),
    prisma.trialSignup.findMany({
      include: { workspace: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      where: { createdAt: { gte: since, lt: now } },
    }),
    getOperationalHealthSummary(),
  ])

  const planMap = new Map<string, PlanSummaryRow>()
  for (const subscription of subscriptions) {
    const row = planMap.get(subscription.plan.name) ?? {
      attention: 0,
      live: 0,
      plan: subscription.plan.name,
      total: 0,
      trial: 0,
      unsubscribed: 0,
    }
    row[subscriptionSummaryStatus(subscription)] += 1
    row.total += 1
    planMap.set(subscription.plan.name, row)
  }
  const planRows = [...planMap.values()].sort((left, right) => left.plan.localeCompare(right.plan))
  const planTotals = planRows.reduce((totals, row) => ({
    attention: totals.attention + row.attention,
    live: totals.live + row.live,
    total: totals.total + row.total,
    trial: totals.trial + row.trial,
    unsubscribed: totals.unsubscribed + row.unsubscribed,
  }), { attention: 0, live: 0, total: 0, trial: 0, unsubscribed: 0 })

  const recentByType = new Map<MediaSummaryRow["type"], number>()
  for (const row of recentUploads) {
    const type = mediaType(row.kind)
    recentByType.set(type, (recentByType.get(type) ?? 0) + row._count._all)
  }
  const mediaRows: MediaSummaryRow[] = (["Photos", "Videos"] as const).map((type) => {
    const matchingRows = allMedia.filter((row) => mediaType(row.kind) === type)
    return {
      storageBytes: matchingRows.reduce((total, row) => total + summedMediaBytes(row), 0),
      storedItems: matchingRows.reduce((total, row) => total + row._count._all, 0),
      type,
      uploads24Hours: recentByType.get(type) ?? 0,
    }
  })

  return {
    endingAt: now.toISOString(),
    failures: operationalEvents.map((event) => ({
      category: event.category,
      lastOccurredAt: event.lastOccurredAt.toISOString(),
      message: event.message,
      occurrenceCount: event.occurrenceCount,
      severity: event.severity,
      source: event.source,
      status: event.status,
      workspace: event.workspace?.name ?? null,
    })),
    health: {
      criticalCount: health.criticalCount,
      email: {
        attempts24Hours: health.emailHealth.attempts24Hours,
        delivered24Hours: health.emailHealth.delivered24Hours,
        deliveryProblems24Hours: health.emailHealth.deliveryProblems24Hours,
        failed24Hours: health.emailHealth.failed24Hours,
      },
      openCount: health.openCount,
      services: health.services,
      status: health.status,
      warningCount: health.warningCount,
    },
    media: {
      storageBytes: mediaRows.reduce((total, row) => total + row.storageBytes, 0),
      storedItems: mediaRows.reduce((total, row) => total + row.storedItems, 0),
      types: mediaRows,
      uploads24Hours: mediaRows.reduce((total, row) => total + row.uploads24Hours, 0),
    },
    newTrials: newTrialSignups.length,
    plans: { ...planTotals, rows: planRows },
    reportDate: getEasternReportDate(now),
    trialsEnding: subscriptions.filter((subscription) => (
      subscription.status === "TRIALING"
      && subscription.trialEndsAt
      && subscription.trialEndsAt >= now
      && subscription.trialEndsAt <= trialHorizon
    )).length,
    windowStartedAt: since.toISOString(),
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function formatDateTime(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: DAILY_REPORT_TIME_ZONE,
  }).format(new Date(value))
}

function statusColor(status: string) {
  if (["HEALTHY", "ACTIVE", "LIFETIME"].includes(status)) return "#166534"
  if (status.includes("TRIAL") || status.includes("WARNING") || status.includes("CANCELING")) return "#9a6700"
  return "#b42318"
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / (1024 ** unitIndex)
  return `${value.toLocaleString("en-US", { maximumFractionDigits: unitIndex === 0 ? 0 : 2 })} ${units[unitIndex]}`
}

function table(headers: string[], rows: string[][]) {
  const header = headers.map((item) => `<th style="padding:9px 8px;text-align:left;border-bottom:1px solid #d8d1c6;font-size:12px;color:#6c675e;white-space:nowrap;">${escapeHtml(item)}</th>`).join("")
  const body = rows.length > 0
    ? rows.map((row) => `<tr>${row.map((item) => `<td style="padding:10px 8px;border-bottom:1px solid #eee8df;vertical-align:top;font-size:12px;line-height:1.4;">${item}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${headers.length}" style="padding:14px 8px;color:#6c675e;">None</td></tr>`
  return `<div style="overflow-x:auto;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;min-width:680px;">${header}${body}</table></div>`
}

function emailLayout(content: string, preview: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f7f4ef;color:#1f211e;font-family:Arial,Helvetica,sans-serif;"><div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;background:#f7f4ef;"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:980px;background:#fff;border:1px solid #dfd6c8;border-radius:12px;"><tr><td style="padding:26px 28px 8px;color:#b98225;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">PhotoView.io · Daily Operations</td></tr><tr><td style="padding:0 28px 30px;">${content}</td></tr></table></td></tr></table></body></html>`
}

export function renderDailyOperationsEmail(report: DailyOperationsReport) {
  const heading = `PhotoView daily report — ${report.reportDate}`

  const planTable = table(
    ["Plan", "Live", "In trial", "Unsubscribed", "Attention", "Total"],
    [
      ...report.plans.rows.map((plan) => [
        `<strong>${escapeHtml(plan.plan)}</strong>`,
        plan.live.toLocaleString("en-US"),
        plan.trial.toLocaleString("en-US"),
        plan.unsubscribed.toLocaleString("en-US"),
        plan.attention.toLocaleString("en-US"),
        plan.total.toLocaleString("en-US"),
      ]),
      [
        "<strong>All plans</strong>",
        `<strong>${report.plans.live.toLocaleString("en-US")}</strong>`,
        `<strong>${report.plans.trial.toLocaleString("en-US")}</strong>`,
        `<strong>${report.plans.unsubscribed.toLocaleString("en-US")}</strong>`,
        `<strong>${report.plans.attention.toLocaleString("en-US")}</strong>`,
        `<strong>${report.plans.total.toLocaleString("en-US")}</strong>`,
      ],
    ],
  )

  const mediaTable = table(
    ["Media", "Uploaded in 24 hours", "Stored items", "Storage used"],
    [
      ...report.media.types.map((media) => [
        `<strong>${escapeHtml(media.type)}</strong>`,
        media.uploads24Hours.toLocaleString("en-US"),
        media.storedItems.toLocaleString("en-US"),
        escapeHtml(formatBytes(media.storageBytes)),
      ]),
      [
        "<strong>All media</strong>",
        `<strong>${report.media.uploads24Hours.toLocaleString("en-US")}</strong>`,
        `<strong>${report.media.storedItems.toLocaleString("en-US")}</strong>`,
        `<strong>${escapeHtml(formatBytes(report.media.storageBytes))}</strong>`,
      ],
    ],
  )

  const serviceTable = table(
    ["Service", "Status", "Detail"],
    report.health.services.map((service) => [
      escapeHtml(service.label),
      `<strong style="color:${statusColor(service.status)}">${escapeHtml(service.status)}</strong>`,
      escapeHtml(service.detail),
    ]),
  )

  const failureTable = table(
    ["Severity", "Workspace", "Problem", "Source", "Last seen"],
    report.failures.map((failure) => [
      `<strong style="color:${statusColor(failure.severity)}">${escapeHtml(failure.severity)}</strong><br>${escapeHtml(failure.status)}`,
      escapeHtml(failure.workspace ?? "Platform-wide"),
      `${escapeHtml(failure.message)}${failure.occurrenceCount > 1 ? `<br>${failure.occurrenceCount} occurrences` : ""}`,
      escapeHtml(failure.source),
      escapeHtml(formatDateTime(failure.lastOccurredAt)),
    ]),
  )

  const content = `
    <h1 style="margin:16px 0 6px;font-size:28px;line-height:1.2;">${escapeHtml(heading)}</h1>
    <p style="margin:0 0 22px;color:#6c675e;">Activity from ${escapeHtml(formatDateTime(report.windowStartedAt))} through ${escapeHtml(formatDateTime(report.endingAt))} ET.</p>
    <div style="padding:16px;background:#f7f4ef;border-radius:10px;margin-bottom:24px;"><strong style="color:${statusColor(report.health.status)}">System ${escapeHtml(report.health.status)}</strong><br><span style="font-size:14px;line-height:1.7;">${report.plans.live} live · ${report.plans.trial} in trial · ${report.plans.unsubscribed} unsubscribed · ${report.plans.attention} need attention<br>${report.media.uploads24Hours} uploads in 24 hours · ${report.media.storedItems} stored photos/videos · ${escapeHtml(formatBytes(report.media.storageBytes))} used<br>${report.newTrials} new trials · ${report.trialsEnding} trials ending within 7 days · ${report.failures.length} failure records</span></div>
    <h2 style="margin:26px 0 10px;font-size:20px;">Subscribers by plan</h2>${planTable}
    <p style="font-size:13px;color:#6c675e;">Unsubscribed includes canceled accounts and accounts scheduled to cancel. Attention includes incomplete, past-due, and unpaid accounts.</p>
    <h2 style="margin:26px 0 10px;font-size:20px;">Photo and video activity</h2>${mediaTable}
    <h2 style="margin:26px 0 10px;font-size:20px;">System health</h2>${serviceTable}
    <p style="font-size:13px;color:#6c675e;">Email: ${report.health.email.attempts24Hours} attempts, ${report.health.email.delivered24Hours} delivered, ${report.health.email.failed24Hours} failed, ${report.health.email.deliveryProblems24Hours} delivery problems. Open incidents: ${report.health.openCount}; critical: ${report.health.criticalCount}; warnings/errors: ${report.health.warningCount}.</p>
    <h2 style="margin:26px 0 10px;font-size:20px;">Failures and open incidents</h2>${failureTable}
  `

  const failuresText = report.failures.map((failure) =>
    `- ${failure.severity}/${failure.status} | ${failure.workspace ?? "Platform-wide"} | ${failure.message} | ${failure.source} | ${formatDateTime(failure.lastOccurredAt)}`,
  ).join("\n") || "- None"

  return {
    html: emailLayout(content, `${report.health.status}: ${report.media.uploads24Hours} uploads and ${report.failures.length} failure records.`),
    preview: `${report.health.status}: ${report.media.uploads24Hours} uploads and ${report.failures.length} failure records.`,
    subject: `[PhotoView.io] Daily report — ${report.reportDate} — ${report.health.status}`,
    text: `${heading}\n\nSystem: ${report.health.status}\nLive subscribers: ${report.plans.live}\nIn trial: ${report.plans.trial}\nUnsubscribed: ${report.plans.unsubscribed}\nNeed attention: ${report.plans.attention}\nUploads (24h): ${report.media.uploads24Hours}\nStored photos/videos: ${report.media.storedItems}\nMedia storage used: ${formatBytes(report.media.storageBytes)}\nNew trials: ${report.newTrials}\nTrials ending within 7 days: ${report.trialsEnding}\nFailure records: ${report.failures.length}\n\nPLAN SUMMARY\n${report.plans.rows.map((plan) => `- ${plan.plan}: ${plan.live} live, ${plan.trial} trial, ${plan.unsubscribed} unsubscribed, ${plan.attention} attention, ${plan.total} total`).join("\n") || "- None"}\n\nMEDIA SUMMARY\n${report.media.types.map((media) => `- ${media.type}: ${media.uploads24Hours} uploaded in 24h, ${media.storedItems} stored, ${formatBytes(media.storageBytes)} used`).join("\n")}\n\nFAILURES AND OPEN INCIDENTS\n${failuresText}`,
  }
}

export async function sendDailyOperationsReport(now = new Date()) {
  if (!isDailyOperationsReportTime(now)) {
    return { reportDate: getEasternReportDate(now), state: "outside_window" as const }
  }

  const reportDate = getEasternReportDate(now)
  const deliveryKey = `daily-operations-report:${reportDate}`
  const claim = await claimEmailDelivery({
    automationKey: "daily_operations_report",
    deliveryKey,
    email: REPORT_RECIPIENT,
    event: "daily_operations_report",
    metadata: { reportDate, timeZone: DAILY_REPORT_TIME_ZONE },
  }, { now })

  if (!claim.acquired) return { reportDate, state: claim.state }

  const report = await buildDailyOperationsReport(now)
  const payload = renderDailyOperationsEmail(report)
  const providerStatus = await sendTransactionalEmail({ ...payload, to: REPORT_RECIPIENT }, {
    idempotencyKey: deliveryKey,
    messageType: "daily_operations_report",
  })
  await finishEmailDelivery({ deliveryKey, providerStatus })
  if (providerStatus !== "sent") {
    throw new Error(`Daily operations report email was not sent (${providerStatus}).`)
  }

  return {
    failures: report.failures.length,
    newTrials: report.newTrials,
    reportDate,
    state: "sent" as const,
    subscribers: report.plans.total,
    trialsEnding: report.trialsEnding,
    uploads: report.media.uploads24Hours,
  }
}
