import { getPrismaClient } from "@/lib/db"
import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"
import { deliverSupportAlerts } from "@/lib/support-alerts"
import { getSupportBrand } from "@/lib/support-brands"
import { deliverSupportEmailOutbox } from "@/lib/support-email-outbox"
import { processSupportCaseQueue, SUPPORT_BACKFILL_START, syncSupportMailbox } from "@/lib/support-engine"

const WORKER_NAME = "photoview-support-engine"
const STALE_WORKER_MS = 15 * 60 * 1000
const DELIVERY_SLA_MS = 60 * 60 * 1000

type WatchdogIssue = {
  fingerprint: string
  message: string
  severity: "CRITICAL" | "ERROR" | "WARNING"
}

async function ensureWatchdogAlert(issue: WatchdogIssue, now: Date) {
  const prisma = getPrismaClient()
  const event = await recordOperationalEvent({
    category: "SYSTEM",
    fingerprint: issue.fingerprint,
    message: issue.message,
    severity: issue.severity,
    source: "support-watchdog",
  })
  if (!event) return
  const brand = getSupportBrand()
  const day = now.toISOString().slice(0, 10)
  await prisma.supportAlert.upsert({
    create: {
      adminUrl: `${brand.adminUrl}?watchdog=${encodeURIComponent(issue.fingerprint)}`,
      brandKey: brand.key,
      deliveries: { create: [{ brandKey: brand.key, channel: "EMAIL" }, { brandKey: brand.key, channel: "SMS" }] },
      eventKey: `support-watchdog:${issue.fingerprint}:${day}`,
      kind: "WATCHDOG",
      summary: issue.message,
    },
    update: { summary: issue.message },
    where: { eventKey: `support-watchdog:${issue.fingerprint}:${day}` },
  })
}

export async function getSupportEngineHealth(now = new Date()) {
  const prisma = getPrismaClient()
  const staleBefore = new Date(now.getTime() - STALE_WORKER_MS)
  const deliveryBefore = new Date(now.getTime() - DELIVERY_SLA_MS)
  const [heartbeat, overdueCases, expiredLeases, overdueResponses, failedAlerts, unresolvedEscalations] = await Promise.all([
    prisma.supportWorkerHeartbeat.findUnique({ where: { name: WORKER_NAME } }),
    prisma.subscriberFeedbackReport.count({
      where: { createdAt: { lte: staleBefore }, lifecycleState: { in: ["QUEUED", "RETRYING"] } },
    }),
    prisma.subscriberFeedbackReport.count({
      where: { leaseExpiresAt: { lte: now }, lifecycleState: "PROCESSING" },
    }),
    prisma.supportEmailOutbox.count({
      where: {
        OR: [
          { createdAt: { gte: SUPPORT_BACKFILL_START, lte: staleBefore }, status: { in: ["PENDING", "RETRY", "PROCESSING"] } },
          { createdAt: { gte: SUPPORT_BACKFILL_START }, sentAt: { lte: deliveryBefore }, status: "SENT" },
        ],
      },
    }),
    prisma.supportAlertDelivery.count({ where: { status: "FAILED" } }),
    prisma.subscriberFeedbackReport.count({
      where: { escalatedAt: { lte: deliveryBefore }, lifecycleState: "ESCALATED", resolvedAt: null },
    }),
  ])
  const workerFresh = Boolean(
    heartbeat?.completedAt
    && heartbeat.completedAt > staleBefore
    && !heartbeat.lastError,
  )
  const ok = workerFresh && overdueCases === 0 && expiredLeases === 0 && overdueResponses === 0 && failedAlerts === 0
  return {
    checkedAt: now.toISOString(),
    counts: { expiredLeases, failedAlerts, overdueCases, overdueResponses, unresolvedEscalations },
    lastCompletedAt: heartbeat?.completedAt?.toISOString() ?? null,
    ok,
    workerFresh,
  }
}

export async function runSupportWatchdog(now = new Date()) {
  const health = await getSupportEngineHealth(now)
  const issues: WatchdogIssue[] = []
  if (!health.workerFresh) issues.push({ fingerprint: "support:worker-stale", message: "PhotoView support processing has not completed within 15 minutes.", severity: "CRITICAL" })
  if (health.counts.overdueCases > 0) issues.push({ fingerprint: "support:cases-overdue", message: `${health.counts.overdueCases} support case${health.counts.overdueCases === 1 ? " is" : "s are"} overdue for processing.`, severity: "CRITICAL" })
  if (health.counts.expiredLeases > 0) issues.push({ fingerprint: "support:leases-expired", message: `${health.counts.expiredLeases} support processing lease${health.counts.expiredLeases === 1 ? " has" : "s have"} expired.`, severity: "ERROR" })
  if (health.counts.overdueResponses > 0) issues.push({ fingerprint: "support:responses-overdue", message: `${health.counts.overdueResponses} support response${health.counts.overdueResponses === 1 ? " is" : "s are"} overdue for verified delivery.`, severity: "CRITICAL" })
  if (health.counts.failedAlerts > 0) issues.push({ fingerprint: "support:alerts-failed", message: `${health.counts.failedAlerts} owner alert channel${health.counts.failedAlerts === 1 ? " has" : "s have"} reached terminal failure.`, severity: "CRITICAL" })
  if (health.counts.unresolvedEscalations > 0) issues.push({ fingerprint: "support:escalations-open", message: `${health.counts.unresolvedEscalations} escalated support case${health.counts.unresolvedEscalations === 1 ? " remains" : "s remain"} unresolved after one hour.`, severity: "WARNING" })

  const known = [
    "support:worker-stale",
    "support:cases-overdue",
    "support:leases-expired",
    "support:responses-overdue",
    "support:alerts-failed",
    "support:escalations-open",
  ]
  for (const fingerprint of known) {
    const issue = issues.find((candidate) => candidate.fingerprint === fingerprint)
    if (issue) await ensureWatchdogAlert(issue, now)
    else await resolveOperationalEventByFingerprint(fingerprint)
  }
  return { health, issues }
}

export async function runSupportEngineCycle(now = new Date()) {
  const prisma = getPrismaClient()
  await prisma.supportWorkerHeartbeat.upsert({
    create: { name: WORKER_NAME, startedAt: now },
    update: { lastError: null, startedAt: now },
    where: { name: WORKER_NAME },
  })
  try {
    const mailbox = await syncSupportMailbox({ limit: 5_000 })
    const cases = await processSupportCaseQueue({ limit: 20, now })
    const responses = await deliverSupportEmailOutbox({ limit: 30, now })
    const alerts = await deliverSupportAlerts({ limit: 30, now })
    const completedAt = new Date()
    await prisma.supportWorkerHeartbeat.update({
      data: { completedAt, lastError: null },
      where: { name: WORKER_NAME },
    })
    await resolveOperationalEventByFingerprint("support:cycle-failed")
    const watchdog = await runSupportWatchdog(completedAt)
    return { alerts, cases, mailbox, responses, watchdog }
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Support engine cycle failed."
    await prisma.supportWorkerHeartbeat.update({ data: { lastError: message }, where: { name: WORKER_NAME } })
    await ensureWatchdogAlert({ fingerprint: "support:cycle-failed", message: "PhotoView support processing failed and needs attention.", severity: "CRITICAL" }, new Date())
    throw error
  }
}
