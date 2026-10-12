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

type SubscriberReportRow = {
  email: string
  failures: number
  latestUploadAt: string | null
  name: string
  plan: string
  status: string
  storageLimitBytes: number
  storageUsedBytes: number
  totalPhotos: number
  trialEndsAt: string | null
  uploads24Hours: number
  workspace: string
}

type TrialReportRow = {
  email: string
  name: string
  plan: string
  trialEndsAt: string
  workspace: string | null
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
  newTrials: TrialReportRow[]
  reportDate: string
  subscribers: SubscriberReportRow[]
  trialsEnding: TrialReportRow[]
  windowStartedAt: string
}

function safeNumber(value: bigint | number) {
  return typeof value === "bigint" ? Number(value) : value
}

function ownerName(user: { firstName: string | null; lastName: string | null; name: string | null }) {
  const splitName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  return splitName || user.name?.trim() || "Unnamed subscriber"
}

function formatSubscriptionStatus(subscription: {
  cancelAtPeriodEnd: boolean
  lifetimeAccess: boolean
  status: string
}) {
  if (subscription.lifetimeAccess) return "LIFETIME"
  if (subscription.cancelAtPeriodEnd) return `${subscription.status} · CANCELING`
  return subscription.status
}

export async function buildDailyOperationsReport(now = new Date()): Promise<DailyOperationsReport> {
  const prisma = getPrismaClient()
  const since = new Date(now.getTime() - DAY_MS)
  const trialHorizon = new Date(now.getTime() + 7 * DAY_MS)

  const [
    subscriptions,
    allUploads,
    recentUploads,
    operationalEvents,
    newTrialSignups,
    health,
  ] = await Promise.all([
    prisma.subscription.findMany({
      include: {
        plan: { select: { name: true } },
        workspace: {
          include: {
            members: {
              include: {
                user: {
                  select: { email: true, firstName: true, lastName: true, name: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.photo.groupBy({
      _count: { _all: true },
      _max: { createdAt: true },
      by: ["workspaceId"],
    }),
    prisma.photo.groupBy({
      _count: { _all: true },
      _sum: { bytes: true },
      by: ["workspaceId"],
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

  const allUploadByWorkspace = new Map(allUploads.map((row) => [row.workspaceId, row]))
  const recentUploadByWorkspace = new Map(recentUploads.map((row) => [row.workspaceId, row]))
  const failuresByWorkspace = new Map<string, number>()
  for (const event of operationalEvents) {
    if (!event.workspaceId) continue
    failuresByWorkspace.set(event.workspaceId, (failuresByWorkspace.get(event.workspaceId) ?? 0) + event.occurrenceCount)
  }

  const subscribers = subscriptions.map((subscription) => {
    const ownerMember = subscription.workspace.members.find((member) => member.role === "OWNER")
      ?? subscription.workspace.members[0]
    const allUpload = allUploadByWorkspace.get(subscription.workspaceId)
    const recentUpload = recentUploadByWorkspace.get(subscription.workspaceId)
    const storageLimit = subscription.workspace.storageLimitBytes + subscription.storagePurchasedBytes

    return {
      email: ownerMember?.user.email ?? "No owner email",
      failures: failuresByWorkspace.get(subscription.workspaceId) ?? 0,
      latestUploadAt: allUpload?._max.createdAt?.toISOString() ?? null,
      name: ownerMember ? ownerName(ownerMember.user) : "No workspace owner",
      plan: subscription.plan.name,
      status: formatSubscriptionStatus(subscription),
      storageLimitBytes: safeNumber(storageLimit),
      storageUsedBytes: safeNumber(subscription.workspace.storageUsedBytes),
      totalPhotos: allUpload?._count._all ?? 0,
      trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
      uploads24Hours: recentUpload?._count._all ?? 0,
      workspace: subscription.workspace.name,
    }
  })

  const trialRows = subscriptions
    .filter((subscription) => subscription.status === "TRIALING" && subscription.trialEndsAt)
    .map((subscription) => {
      const ownerMember = subscription.workspace.members.find((member) => member.role === "OWNER")
        ?? subscription.workspace.members[0]
      return {
        email: ownerMember?.user.email ?? "No owner email",
        name: ownerMember ? ownerName(ownerMember.user) : "No workspace owner",
        plan: subscription.plan.name,
        trialEndsAt: subscription.trialEndsAt!.toISOString(),
        workspace: subscription.workspace.name,
      }
    })
    .filter((trial) => {
      const endsAt = new Date(trial.trialEndsAt)
      return endsAt >= now && endsAt <= trialHorizon
    })
    .sort((left, right) => left.trialEndsAt.localeCompare(right.trialEndsAt))

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
    newTrials: newTrialSignups.map((signup) => ({
      email: signup.email,
      name: `${signup.firstName} ${signup.lastName}`.trim(),
      plan: signup.planSlug,
      trialEndsAt: signup.trialEndsAt.toISOString(),
      workspace: signup.workspace?.name ?? signup.studioName,
    })),
    reportDate: getEasternReportDate(now),
    subscribers,
    trialsEnding: trialRows,
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

function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

function statusColor(status: string) {
  if (["HEALTHY", "ACTIVE", "LIFETIME"].includes(status)) return "#166534"
  if (status.includes("TRIAL") || status.includes("WARNING") || status.includes("CANCELING")) return "#9a6700"
  return "#b42318"
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
  const uploads = report.subscribers.reduce((sum, subscriber) => sum + subscriber.uploads24Hours, 0)
  const statusCounts = report.subscribers.reduce<Record<string, number>>((counts, subscriber) => {
    counts[subscriber.status] = (counts[subscriber.status] ?? 0) + 1
    return counts
  }, {})
  const statusSummary = Object.entries(statusCounts).map(([status, count]) => `${status}: ${count}`).join(" · ") || "No subscribers"
  const heading = `PhotoView daily report — ${report.reportDate}`

  const subscribersTable = table(
    ["Subscriber", "Workspace / plan", "Status", "Uploads (24h)", "Photos", "Storage", "Failures", "Latest upload"],
    report.subscribers.map((subscriber) => [
      `<strong>${escapeHtml(subscriber.name)}</strong><br>${escapeHtml(subscriber.email)}`,
      `${escapeHtml(subscriber.workspace)}<br>${escapeHtml(subscriber.plan)}`,
      `<strong style="color:${statusColor(subscriber.status)}">${escapeHtml(subscriber.status)}</strong>${subscriber.trialEndsAt ? `<br>Ends ${escapeHtml(formatDateTime(subscriber.trialEndsAt))}` : ""}`,
      String(subscriber.uploads24Hours),
      String(subscriber.totalPhotos),
      `${escapeHtml(formatBytes(subscriber.storageUsedBytes))} / ${escapeHtml(formatBytes(subscriber.storageLimitBytes))}`,
      subscriber.failures ? `<strong style="color:#b42318">${subscriber.failures}</strong>` : "0",
      escapeHtml(formatDateTime(subscriber.latestUploadAt)),
    ]),
  )

  const trialTable = (trials: TrialReportRow[]) => table(
    ["Subscriber", "Workspace", "Plan", "Trial ends"],
    trials.map((trial) => [
      `<strong>${escapeHtml(trial.name)}</strong><br>${escapeHtml(trial.email)}`,
      escapeHtml(trial.workspace ?? "Not provisioned"),
      escapeHtml(trial.plan),
      escapeHtml(formatDateTime(trial.trialEndsAt)),
    ]),
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
    <div style="padding:16px;background:#f7f4ef;border-radius:10px;margin-bottom:24px;"><strong style="color:${statusColor(report.health.status)}">System ${escapeHtml(report.health.status)}</strong><br><span style="font-size:14px;line-height:1.7;">${report.subscribers.length} subscribers · ${uploads} uploads · ${report.newTrials.length} new trials · ${report.trialsEnding.length} trials ending within 7 days · ${report.failures.length} failure records<br>${escapeHtml(statusSummary)}</span></div>
    <h2 style="margin:24px 0 10px;font-size:20px;">Subscribers</h2>${subscribersTable}
    <h2 style="margin:26px 0 10px;font-size:20px;">New trials in the last 24 hours</h2>${trialTable(report.newTrials)}
    <h2 style="margin:26px 0 10px;font-size:20px;">Trials ending within 7 days</h2>${trialTable(report.trialsEnding)}
    <h2 style="margin:26px 0 10px;font-size:20px;">System health</h2>${serviceTable}
    <p style="font-size:13px;color:#6c675e;">Email: ${report.health.email.attempts24Hours} attempts, ${report.health.email.delivered24Hours} delivered, ${report.health.email.failed24Hours} failed, ${report.health.email.deliveryProblems24Hours} delivery problems. Open incidents: ${report.health.openCount}; critical: ${report.health.criticalCount}; warnings/errors: ${report.health.warningCount}.</p>
    <h2 style="margin:26px 0 10px;font-size:20px;">Failures and open incidents</h2>${failureTable}
  `

  const subscriberText = report.subscribers.map((subscriber) =>
    `- ${subscriber.name} <${subscriber.email}> | ${subscriber.workspace} | ${subscriber.plan} | ${subscriber.status} | uploads 24h: ${subscriber.uploads24Hours} | photos: ${subscriber.totalPhotos} | failures: ${subscriber.failures}`,
  ).join("\n") || "- None"
  const failuresText = report.failures.map((failure) =>
    `- ${failure.severity}/${failure.status} | ${failure.workspace ?? "Platform-wide"} | ${failure.message} | ${failure.source} | ${formatDateTime(failure.lastOccurredAt)}`,
  ).join("\n") || "- None"

  return {
    html: emailLayout(content, `${report.health.status}: ${uploads} uploads and ${report.failures.length} failure records.`),
    preview: `${report.health.status}: ${uploads} uploads and ${report.failures.length} failure records.`,
    subject: `[PhotoView.io] Daily report — ${report.reportDate} — ${report.health.status}`,
    text: `${heading}\n\nSystem: ${report.health.status}\nSubscribers: ${report.subscribers.length}\nUploads (24h): ${uploads}\nNew trials: ${report.newTrials.length}\nTrials ending within 7 days: ${report.trialsEnding.length}\nFailure records: ${report.failures.length}\n\nSUBSCRIBERS\n${subscriberText}\n\nFAILURES AND OPEN INCIDENTS\n${failuresText}`,
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
    newTrials: report.newTrials.length,
    reportDate,
    state: "sent" as const,
    subscribers: report.subscribers.length,
    trialsEnding: report.trialsEnding.length,
    uploads: report.subscribers.reduce((sum, subscriber) => sum + subscriber.uploads24Hours, 0),
  }
}
