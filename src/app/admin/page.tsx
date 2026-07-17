import {
  AlertTriangle,
  Activity,
  BarChart3,
  Camera,
  CreditCard,
  Gift,
  DollarSign,
  Gauge,
  HardDrive,
  LockKeyhole,
  LogOut,
  Mail,
  Monitor,
  MousePointerClick,
  Save,
  Send,
  ShieldCheck,
  Smartphone,
  Timer,
  UserPlus,
  Users,
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { auth } from "@/auth"
import { getAdminAuditLogs, logAdminAuditEvent } from "@/lib/admin-audit"
import { getAdminAnalyticsSummary } from "@/lib/admin-analytics"
import { adminCapabilities, hasAdminCapability, isAdminSession, isSuperAdminSession, type AdminCapability } from "@/lib/admin-access"
import { hasValidSuperAdminMfa } from "@/lib/admin-mfa"
import { getAdminSubscribers, type AdminSubscriberRow } from "@/lib/admin-subscribers"
import { accountFilePolicy } from "@/lib/account-policy"
import { getPrismaClient } from "@/lib/db"
import { cleanCouponCode } from "@/lib/coupons"
import { formatPlanStorage, subscriberPlans } from "@/lib/plans"
import { getStripeConfigSummary, type StripeConfigSummary } from "@/lib/stripe-config"
import { formatAccountBytes } from "@/lib/subscriber-account"
import { sendAdminSubscriberEmail, sendSequenceEmail, type CustomerEducationKey, type TrialEducationKey } from "@/lib/lifecycle-email"
import {
  getOperationalHealthSummary,
  resolveOperationalEventById,
} from "@/lib/operational-monitoring"

type AdminTab = AdminCapability

type SuperAdminPageProps = {
  searchParams?: Promise<{
    recipient?: string
    sent?: string
    subscriberMessage?: string
    tab?: string
  }>
}

const tabs: Array<{ id: AdminTab; label: string; note: string }> = [
  { id: "subscribers", label: "All Subscribers", note: "Accounts, owners, status, usage" },
  { id: "stats", label: "Site Stats", note: "Storage and device analytics" },
  { id: "health", label: "System Health", note: "Services, incidents, and failed jobs" },
  { id: "plans", label: "Plans", note: "Who is on Starter, Growth, Studio, Premier" },
  { id: "financials", label: "Financials", note: "Trial pipeline, MRR, billing risk" },
  { id: "trials", label: "Trial Ops", note: "Email activity and conversion health" },
  { id: "coupons", label: "Coupons", note: "Free access and lead-gen offers" },
  { id: "audit", label: "Audit", note: "Admin activity and rights changes" },
  { id: "rights", label: "Rights", note: "Add admins and assign controls" },
  { id: "security", label: "Security", note: "Admin access and safeguards" },
]

const assignablePermissions = tabs.filter((tab) => tab.id !== "rights")

type AdminUserRow = {
  adminPermissions: string[]
  createdAt: string
  email: string
  id: string
  name: string
  systemRole: string
}

type AdminAuditRow = Awaited<ReturnType<typeof getAdminAuditLogs>>[number]
type AdminAnalyticsSummary = Awaited<ReturnType<typeof getAdminAnalyticsSummary>>
type CouponRow = Awaited<ReturnType<typeof getCouponRows>>[number]
type CancellationSurveyRow = Awaited<ReturnType<typeof getCancellationSurveyRows>>[number]
type TrialOpsSummary = Awaited<ReturnType<typeof getTrialOpsSummary>>
type OperationalHealthSummary = Awaited<ReturnType<typeof getOperationalHealthSummary>>

const planOrder = ["starter", "growth", "studio", "premier", "archive"]
const trialEmailKeys: Array<{ key: TrialEducationKey; label: string }> = [
  { key: "trial_day_1_cover", label: "Day 1: Start with the cover image" },
  { key: "trial_day_2_upload", label: "Day 2: Upload a smaller, stronger set" },
  { key: "trial_day_3_mobile", label: "Day 3: Mobile is not a smaller desktop" },
  { key: "trial_day_4_hide", label: "Day 4: Edit what visitors see" },
  { key: "trial_day_5_sharing", label: "Day 5: Share one clear story" },
  { key: "trial_day_6_homepage", label: "Day 6: Tune the homepage first impression" },
  { key: "trial_day_7_watermark", label: "Day 7: Set a tasteful watermark" },
  { key: "trial_day_8_embed", label: "Day 8: Add a portfolio to your own site" },
  { key: "trial_day_9_lightroom", label: "Day 9: Publish from Lightroom" },
  { key: "trial_day_10_storage", label: "Day 10: Check your usage" },
  { key: "trial_day_11_social", label: "Day 11: Make sharing faster" },
  { key: "trial_day_12_polish", label: "Day 12: Polish before you promote" },
  { key: "trial_day_13_expiring", label: "Day 13: Your trial ends soon" },
]
const customerEmailKeys: Array<{ key: CustomerEducationKey; label: string }> = [
  { key: "customer_day_2_sharing", label: "Customer day 2: Make sharing easier" },
  { key: "customer_day_5_storage", label: "Customer day 5: Storage should support presentation" },
  { key: "customer_day_10_editing", label: "Customer day 10: Edit the public story" },
]
const sequenceEmailKeys = [...trialEmailKeys, ...customerEmailKeys]

function parseAdminPermissions(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string" && adminCapabilities.includes(item as AdminCapability))
}

async function getAdminUsers(): Promise<AdminUserRow[]> {
  const prisma = getPrismaClient()
  const users = await prisma.user.findMany({
    orderBy: [
      {
        systemRole: "desc",
      },
      {
        createdAt: "asc",
      },
    ],
    select: {
      adminPermissions: true,
      createdAt: true,
      email: true,
      firstName: true,
      id: true,
      lastName: true,
      name: true,
      systemRole: true,
    },
    where: {
      systemRole: {
        in: ["SUPERADMIN", "SUPPORT"],
      },
    },
  })

  return users.map((user) => ({
    adminPermissions: parseAdminPermissions(user.adminPermissions),
    createdAt: user.createdAt.toISOString(),
    email: user.email,
    id: user.id,
    name: user.name ?? (`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email),
    systemRole: user.systemRole,
  }))
}

async function getCouponRows() {
  const prisma = getPrismaClient()
  return prisma.couponCode.findMany({
    include: {
      _count: {
        select: {
          leadCaptures: true,
          trialSignups: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

async function getCancellationSurveyRows() {
  const prisma = getPrismaClient()
  return prisma.cancellationSurvey.findMany({
    include: {
      workspace: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 12,
  })
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://photoview.io").replace(/\/+$/, "")
}

function getTrialDay(row: AdminSubscriberRow) {
  const startedAt = row.trialStartedAt ?? row.createdAt
  const elapsed = Date.now() - new Date(startedAt).getTime()
  return Math.max(1, Math.min(14, Math.floor(elapsed / (24 * 60 * 60 * 1000)) + 1))
}

async function getTrialOpsSummary(rows: AdminSubscriberRow[]) {
  const prisma = getPrismaClient()
  const workspaceIds = rows.map((row) => row.workspaceId)
  const workspaceNameById = new Map(rows.map((row) => [row.workspaceId, row.workspaceName]))
  if (workspaceIds.length === 0) {
    return {
      dashboardOpenCounts: new Map<string, number>(),
      deliveries: [],
      deliveryCounts: new Map<string, { failed: number; lastSentAt: string | null; sent: number; skipped: number }>(),
      recentActivity: [],
      shareCounts: new Map<string, number>(),
      trialRows: [],
    }
  }

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const [deliveries, dashboardEvents, shareGroups, recentShares, recentGalleries, recentPhotos] = await Promise.all([
    prisma.emailAutomationDelivery.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
      where: {
        workspaceId: {
          in: workspaceIds,
        },
      },
    }),
    prisma.analyticsEvent.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
        metadata: true,
      },
      take: 1000,
      where: {
        createdAt: {
          gte: since,
        },
        eventType: "DASHBOARD_OPEN",
      },
    }),
    prisma.socialShareEvent.groupBy({
      by: ["workspaceId"],
      _count: {
        workspaceId: true,
      },
      where: {
        workspaceId: {
          in: workspaceIds,
        },
      },
    }),
    prisma.socialShareEvent.findMany({
      include: {
        workspace: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 25,
      where: {
        workspaceId: {
          in: workspaceIds,
        },
      },
    }),
    prisma.gallery.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
        name: true,
        workspace: {
          select: {
            name: true,
          },
        },
        workspaceId: true,
      },
      take: 25,
      where: {
        workspaceId: {
          in: workspaceIds,
        },
      },
    }),
    prisma.photo.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
        gallery: {
          select: {
            name: true,
          },
        },
        title: true,
        workspaceId: true,
      },
      take: 25,
      where: {
        workspaceId: {
          in: workspaceIds,
        },
      },
    }),
  ])

  const deliveryCounts = deliveries.reduce((counts, delivery) => {
    if (!delivery.workspaceId) return counts
    const current = counts.get(delivery.workspaceId) ?? { failed: 0, lastSentAt: null, sent: 0, skipped: 0 }
    if (delivery.status === "SENT") current.sent += 1
    else if (delivery.status === "FAILED") current.failed += 1
    else current.skipped += 1
    if (delivery.sentAt && (!current.lastSentAt || delivery.sentAt.toISOString() > current.lastSentAt)) {
      current.lastSentAt = delivery.sentAt.toISOString()
    }
    counts.set(delivery.workspaceId, current)
    return counts
  }, new Map<string, { failed: number; lastSentAt: string | null; sent: number; skipped: number }>())

  const dashboardOpenCounts = dashboardEvents.reduce((counts, event) => {
    const metadata = event.metadata
    const workspaceId = metadata && typeof metadata === "object" && !Array.isArray(metadata) && "workspaceId" in metadata
      ? String(metadata.workspaceId)
      : null
    if (!workspaceId || !workspaceIds.includes(workspaceId)) return counts
    counts.set(workspaceId, (counts.get(workspaceId) ?? 0) + 1)
    return counts
  }, new Map<string, number>())

  const shareCounts = shareGroups.reduce((counts, group) => {
    counts.set(group.workspaceId, group._count.workspaceId)
    return counts
  }, new Map<string, number>())
  const recentActivity = [
    ...deliveries.slice(0, 20).map((delivery) => ({
      at: delivery.createdAt.toISOString(),
      detail: `${delivery.automationKey} · ${delivery.providerStatus ?? delivery.status}`,
      label: delivery.email,
      type: "Email",
    })),
    ...dashboardEvents.slice(0, 20).map((event) => ({
      at: event.createdAt.toISOString(),
      detail: "Opened subscriber dashboard",
      label: "Dashboard",
      type: "Dashboard",
    })),
    ...recentShares.map((share) => ({
      at: share.createdAt.toISOString(),
      detail: `${share.network} · ${share.shareUrl}`,
      label: share.workspace.name,
      type: "Share",
    })),
    ...recentGalleries.map((gallery) => ({
      at: gallery.createdAt.toISOString(),
      detail: `Created portfolio: ${gallery.name}`,
      label: gallery.workspace.name,
      type: "Portfolio",
    })),
    ...recentPhotos.map((photo) => ({
      at: photo.createdAt.toISOString(),
      detail: `Uploaded ${photo.title} to ${photo.gallery.name}`,
      label: workspaceNameById.get(photo.workspaceId) ?? "Unknown workspace",
      type: "Upload",
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 40)

  return {
    dashboardOpenCounts,
    deliveries,
    deliveryCounts,
    recentActivity,
    shareCounts,
    trialRows: rows.filter((row) => row.status === "TRIALING"),
  }
}

async function sendTestSequenceEmail(formData: FormData) {
  "use server"

  const session = await auth()
  if (!hasAdminCapability(session, "trials")) redirect("/account")
  if (!(await hasValidSuperAdminMfa(session))) redirect("/admin/verify?next=%2Fadmin%3Ftab%3Dtrials")

  const email = String(formData.get("email") ?? "").trim()
  const key = String(formData.get("emailKey") ?? "") as TrialEducationKey | CustomerEducationKey
  const selected = sequenceEmailKeys.find((item) => item.key === key)

  if (!email || !selected) redirect("/admin?tab=trials&sent=0")

  const status = await sendSequenceEmail(email, {
    accountUrl: `${getAppUrl()}/account`,
    firstName: "there",
    key,
  })

  await logAdminAuditEvent({
    action: "ADMIN_TEST_EMAIL_SENT",
    metadata: {
      email,
      emailKey: key,
      providerStatus: status,
    },
    session,
    targetId: email,
    targetType: "Email",
  })

  revalidatePath("/admin")
  redirect(`/admin?tab=trials&sent=${status === "sent" ? "1" : "0"}`)
}

async function sendSubscriberMessage(formData: FormData) {
  "use server"

  const session = await auth()
  if (!hasAdminCapability(session, "subscribers")) redirect("/account")
  if (!(await hasValidSuperAdminMfa(session))) redirect("/admin/verify?next=%2Fadmin")

  const workspaceId = String(formData.get("workspaceId") ?? "").trim()
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 160)
  const message = String(formData.get("message") ?? "").trim().slice(0, 4_000)
  const replyTo = session?.user?.email?.trim()

  if (!workspaceId || !subject || message.length < 10 || !replyTo) {
    redirect("/admin?subscriberMessage=invalid#attention")
  }

  const workspace = await getPrismaClient().workspace.findUnique({
    select: {
      members: {
        orderBy: { createdAt: "asc" },
        select: { user: { select: { email: true } } },
        take: 1,
        where: { role: "OWNER" },
      },
      supportEmail: true,
    },
    where: { id: workspaceId },
  })
  const recipient = workspace?.members[0]?.user.email?.trim() || workspace?.supportEmail?.trim()

  if (!recipient) redirect("/admin?subscriberMessage=missing-recipient#attention")

  const status = await sendAdminSubscriberEmail(recipient, { message, replyTo, subject })
  await logAdminAuditEvent({
    action: status === "sent" ? "ADMIN_SUBSCRIBER_EMAIL_SENT" : "ADMIN_SUBSCRIBER_EMAIL_FAILED",
    metadata: { providerStatus: status, subject },
    session,
    targetId: workspaceId,
    targetType: "Workspace",
  })

  revalidatePath("/admin")
  redirect(`/admin?subscriberMessage=${status}&recipient=${encodeURIComponent(recipient)}#attention`)
}

async function resolveOperationalIncident(formData: FormData) {
  "use server"

  const session = await auth()
  if (!hasAdminCapability(session, "health")) redirect("/account")
  if (!(await hasValidSuperAdminMfa(session))) redirect("/admin/verify?next=%2Fadmin%3Ftab%3Dhealth")
  const incidentId = String(formData.get("incidentId") ?? "").trim()
  if (!incidentId) redirect("/admin?tab=health")

  await resolveOperationalEventById(incidentId)
  await logAdminAuditEvent({
    action: "OPERATIONAL_INCIDENT_RESOLVED",
    session,
    targetId: incidentId,
    targetType: "OperationalEvent",
  })
  revalidatePath("/admin")
  redirect("/admin?tab=health")
}

async function saveCouponCode(formData: FormData) {
  "use server"

  const session = await auth()
  if (!hasAdminCapability(session, "coupons")) redirect("/account")
  if (!(await hasValidSuperAdminMfa(session))) redirect("/admin/verify?next=%2Fadmin%3Ftab%3Dcoupons")

  const code = cleanCouponCode(String(formData.get("code") ?? ""))
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const planSlug = String(formData.get("planSlug") ?? "starter")
  const freeDays = Math.max(1, Math.min(3650, Number(formData.get("freeDays") ?? 14)))
  const expiresAtValue = String(formData.get("expiresAt") ?? "").trim()
  const maxRedemptionsValue = String(formData.get("maxRedemptions") ?? "").trim()
  const leadMagnetTitle = String(formData.get("leadMagnetTitle") ?? "").trim()
  const leadMagnetNote = String(formData.get("leadMagnetNote") ?? "").trim()

  if (!code || !name) redirect("/admin?tab=coupons&error=missing")

  const prisma = getPrismaClient()
  const coupon = await prisma.couponCode.upsert({
    create: {
      code,
      description: description || null,
      expiresAt: expiresAtValue ? new Date(`${expiresAtValue}T23:59:59.000Z`) : null,
      freeDays,
      leadMagnetNote: leadMagnetNote || null,
      leadMagnetTitle: leadMagnetTitle || null,
      maxRedemptions: maxRedemptionsValue ? Math.max(1, Number(maxRedemptionsValue)) : null,
      name,
      planSlug,
    },
    update: {
      description: description || null,
      expiresAt: expiresAtValue ? new Date(`${expiresAtValue}T23:59:59.000Z`) : null,
      freeDays,
      leadMagnetNote: leadMagnetNote || null,
      leadMagnetTitle: leadMagnetTitle || null,
      maxRedemptions: maxRedemptionsValue ? Math.max(1, Number(maxRedemptionsValue)) : null,
      name,
      planSlug,
    },
    where: {
      code,
    },
  })

  await logAdminAuditEvent({
    action: "COUPON_UPDATED",
    metadata: {
      code,
      freeDays,
      planSlug,
    },
    session,
    targetId: coupon.id,
    targetType: "CouponCode",
  })

  revalidatePath("/admin")
  redirect("/admin?tab=coupons&saved=1")
}

async function saveAdminRights(formData: FormData) {
  "use server"

  const session = await auth()
  if (!isSuperAdminSession(session)) redirect("/account")
  if (!(await hasValidSuperAdminMfa(session))) redirect("/admin/verify?next=%2Fadmin%3Ftab%3Drights")

  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const name = String(formData.get("name") ?? "").trim()
  const requestedRole = String(formData.get("systemRole") ?? "SUPPORT")
  const systemRole = requestedRole === "SUPERADMIN" ? "SUPERADMIN" : requestedRole === "USER" ? "USER" : "SUPPORT"
  const permissions = formData
    .getAll("permissions")
    .map(String)
    .filter((permission): permission is AdminCapability => adminCapabilities.includes(permission as AdminCapability))
    .filter((permission) => permission !== "rights")
  const adminPermissions = systemRole === "SUPERADMIN" ? [...adminCapabilities] : systemRole === "SUPPORT" ? permissions : []

  if (!email) redirect("/admin?tab=rights&error=email-required")

  const prisma = getPrismaClient()
  await prisma.user.upsert({
    create: {
      adminPermissions,
      email,
      name: name || null,
      systemRole,
    },
    update: {
      adminPermissions,
      ...(name ? { name } : {}),
      systemRole,
    },
    where: {
      email,
    },
  })

  await logAdminAuditEvent({
    action: "ADMIN_RIGHTS_UPDATED",
    metadata: {
      permissions: adminPermissions,
      role: systemRole,
      targetEmail: email,
    },
    session,
    targetId: email,
    targetType: "User",
  })

  revalidatePath("/admin")
  redirect("/admin?tab=rights&saved=1")
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(cents / 100)
}

function percent(used: number, limit: number) {
  if (limit <= 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

function formatDate(value: string | null) {
  if (!value) return "Not set"
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value))
}

function statusTone(status: string) {
  if (status === "ACTIVE") return "text-emerald-700"
  if (status === "TRIALING") return "text-[#9a6a16]"
  if (["PAST_DUE", "UNPAID"].includes(status)) return "text-red-700"
  if (status === "CANCELED") return "text-[#777064]"
  return "text-[#6b6257]"
}

function percentTone(value: number) {
  if (value >= 100) return "bg-red-600"
  if (value >= 90) return "bg-[#d8a84f]"
  return "bg-[#1a211b]"
}

function normalizeStatus(status: string) {
  return status.replaceAll("_", " ")
}

function getAttentionReasons(row: AdminSubscriberRow) {
  const reasons: string[] = []

  if (row.storagePercent >= 90) reasons.push(`Storage is ${row.storagePercent}% used`)
  if (row.status === "PAST_DUE") reasons.push("Payment is past due")
  if (row.status === "UNPAID") reasons.push("Subscription is unpaid")
  if (row.status === "CANCELED") reasons.push("Subscription is canceled")
  if (row.cancelAtPeriodEnd) reasons.push("Cancellation scheduled")

  return reasons
}

function getAttentionEmailDraft(row: AdminSubscriberRow) {
  const firstName = row.ownerName.split(" ")[0] || "there"
  const reasons = getAttentionReasons(row)
  const hasBillingIssue = ["PAST_DUE", "UNPAID"].includes(row.status)
  const hasStorageIssue = row.storagePercent >= 90
  const hasCancellationIssue = row.status === "CANCELED" || row.cancelAtPeriodEnd
  const subject = hasBillingIssue
    ? "Action needed: review your PhotoView.io billing"
    : hasStorageIssue
      ? row.storagePercent >= 100
        ? "Action needed: your PhotoView.io storage is full"
        : "Your PhotoView.io storage is nearly full"
      : hasCancellationIssue
        ? "Your PhotoView.io cancellation"
        : "PhotoView.io account follow-up"
  const nextSteps = [
    hasBillingIssue
      ? "Please open PhotoView.io, go to My Account, and select Manage billing to review or update your payment method."
      : null,
    hasStorageIssue
      ? "You can free storage by permanently deleting files you no longer need, or open My Account to review upgrade options."
      : null,
    row.cancelAtPeriodEnd
      ? "Your cancellation is scheduled. If that was intentional, no action is required; your access continues through the current period."
      : null,
    row.status === "CANCELED"
      ? "Your subscription currently shows as canceled. If you did not expect this, please reply and we will help."
      : null,
  ].filter((step): step is string => Boolean(step))

  return {
    message: [
      `Hi ${firstName},`,
      "",
      "I'm following up because your PhotoView.io account currently needs attention:",
      ...reasons.map((reason) => `- ${reason}`),
      "",
      ...nextSteps.flatMap((step, index) => index === nextSteps.length - 1 ? [step] : [step, ""]),
      "",
      "If you have questions or would like help, reply to this email.",
      "",
      "PhotoView.io Support",
    ].join("\n"),
    subject,
  }
}

function formatDuration(milliseconds: number) {
  if (milliseconds <= 0) return "0s"
  const seconds = Math.round(milliseconds / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return remainingSeconds ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
}

function StatCard({
  actionHref,
  actionLabel,
  detail,
  icon: Icon,
  label,
  value,
}: {
  actionHref?: string
  actionLabel?: string
  detail: string
  icon: typeof Users
  label: string
  value: string
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8a8072]">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-[#1d1d1b]">{value}</p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-md bg-[#f2eee7] text-[#1a211b]">
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#6b6257]">{detail}</p>
      {actionLabel ? <p className="mt-4 text-sm font-semibold text-[#8a5c12]">{actionLabel}</p> : null}
    </>
  )

  if (actionHref) {
    return (
      <Link className="block rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#b58835] hover:shadow-md" href={actionHref}>
        {content}
      </Link>
    )
  }

  return (
    <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
      {content}
    </section>
  )
}

function UsageBand({
  label,
  limit,
  used,
}: {
  label: string
  limit: number
  used: number
}) {
  const value = percent(used, limit)

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-[#6b6257]">
          {formatAccountBytes(used)} / {formatAccountBytes(limit)} ({value}%)
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[#ece5d9]">
        <div className={`h-full rounded-full ${percentTone(value)}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  )
}

function EmptyAnalyticsCard({ label, icon: Icon }: { label: string; icon: typeof Users }) {
  return (
    <section className="rounded-md border border-dashed border-[#d8cdbd] bg-[#fbfaf7] p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-md bg-white text-[#b58835]">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-[#6b6257]">Not instrumented yet</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#6b6257]">
        We need to add first-party analytics events before this can show real visits, time spent, pages accessed, and device split.
      </p>
    </section>
  )
}

function SubscribersTab({ rows }: { rows: AdminSubscriberRow[] }) {
  return (
    <section className="rounded-md border border-[#ded6c9] bg-white shadow-sm">
      <div className="border-b border-[#ded6c9] px-5 py-4">
        <h2 className="text-xl font-semibold">All subscribers</h2>
        <p className="mt-1 text-sm text-[#6b6257]">Every subscriber workspace, owner, plan, billing state, and usage position.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#eee7dc] text-sm">
          <thead className="bg-[#fbfaf7] text-left text-xs uppercase tracking-[0.14em] text-[#8a8072]">
            <tr>
              <th className="px-5 py-3">Subscriber</th>
              <th className="px-5 py-3">Plan</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Storage</th>
              <th className="px-5 py-3">Portfolio</th>
              <th className="px-5 py-3">Onboarding</th>
              <th className="px-5 py-3">Trial/Billing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eee7dc]">
            {rows.map((row) => (
              <tr key={row.workspaceId}>
                <td className="px-5 py-4">
                  <p className="font-semibold">{row.workspaceName}</p>
                  <p className="mt-1 text-xs text-[#6b6257]">{row.ownerName} · {row.ownerEmail}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-semibold">{row.planName}</p>
                  <p className="mt-1 text-xs text-[#6b6257]">{row.billingCycle}</p>
                </td>
                <td className="px-5 py-4">
                  <p className={`font-semibold ${statusTone(row.status)}`}>{normalizeStatus(row.status)}</p>
                  {row.cancelAtPeriodEnd ? <p className="mt-1 text-xs text-red-700">Canceling at period end</p> : null}
                </td>
                <td className="px-5 py-4">{row.storagePercent}%</td>
                <td className="px-5 py-4">{row.galleryCount} galleries · {row.photoCount} photos</td>
                <td className="px-5 py-4">
                  <p className="font-semibold">{row.onboardingPercent}%</p>
                  <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-[#ece5d9]">
                    <div className="h-full rounded-full bg-[#b58835]" style={{ width: `${row.onboardingPercent}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-[#6b6257]">{row.onboardingCompletedSteps} of 6 steps</p>
                </td>
                <td className="px-5 py-4">
                  <p>{row.stripeConnected ? "Stripe connected" : "Stripe missing"}</p>
                  <p className="mt-1 text-xs text-[#6b6257]">Trial ends {formatDate(row.trialEndsAt)}</p>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-[#6b6257]" colSpan={8}>No subscriber records yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function NeedsAttentionPanel({
  messageStatus,
  recipient,
  rows,
}: {
  messageStatus?: string
  recipient?: string
  rows: AdminSubscriberRow[]
}) {
  if (rows.length === 0) return null

  return (
    <section className="mt-6 rounded-md border border-[#ded6c9] bg-white shadow-sm" id="attention">
      <div className="flex flex-col gap-3 border-b border-[#ded6c9] px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Needs attention</h2>
          <p className="mt-1 text-sm text-[#6b6257]">
            Accounts that need billing, storage, or cancellation review. Payment failures, cancellation confirmations, and storage warnings at 75%, 90%, and 100% are emailed automatically. Use the prepared message only when a personal follow-up is helpful.
          </p>
        </div>
        <Link className="inline-flex h-10 items-center justify-center rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white" href="/admin?tab=subscribers">
          View all subscribers
        </Link>
      </div>
      <div className="divide-y divide-[#eee7dc]">
        {messageStatus ? (
          <div
            className={`px-5 py-3 text-sm font-medium ${messageStatus === "sent" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
            role="status"
          >
            {messageStatus === "sent"
              ? `Email sent to ${recipient ?? "the subscriber"}.`
              : messageStatus === "not_configured"
                ? "Email delivery is not configured. Nothing was sent."
                : messageStatus === "invalid"
                  ? "Add a subject and a message of at least 10 characters. Nothing was sent."
                  : messageStatus === "missing-recipient"
                    ? "This subscriber does not have a deliverable email address. Nothing was sent."
                    : "The email could not be delivered. Nothing was sent."}
          </div>
        ) : null}
        {rows.map((row) => {
          const reasons = getAttentionReasons(row)
          const emailDraft = getAttentionEmailDraft(row)

          return (
            <div className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_auto]" key={row.workspaceId}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{row.workspaceName}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(row.status)} bg-[#fbfaf7]`}>
                    {normalizeStatus(row.status)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#6b6257]">
                  {row.ownerName} · {row.ownerEmail} · {row.planName}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {reasons.map((reason) => (
                    <span className="rounded-full border border-[#f0c979] bg-[#fff8e8] px-3 py-1 text-xs font-semibold text-[#735223]" key={reason}>
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <details className="w-full rounded-md border border-[#d7cec0] bg-white lg:w-[28rem]">
                  <summary className="flex h-10 cursor-pointer list-none items-center justify-center px-4 text-sm font-semibold">
                    Email subscriber
                  </summary>
                  <form action={sendSubscriberMessage} className="grid gap-3 border-t border-[#eee7dc] p-4 text-left">
                    <input name="workspaceId" type="hidden" value={row.workspaceId} />
                    <p className="text-xs text-[#6b6257]">To: <span className="font-semibold text-[#1d1d1b]">{row.ownerEmail}</span></p>
                    <label className="grid gap-1.5 text-xs font-semibold">
                      Subject
                      <input
                        className="h-10 rounded-md border border-[#d7cec0] px-3 text-sm font-normal outline-none focus:border-[#b58835]"
                        defaultValue={emailDraft.subject}
                        maxLength={160}
                        name="subject"
                        required
                      />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold">
                      Message
                      <textarea
                        className="min-h-32 rounded-md border border-[#d7cec0] p-3 text-sm font-normal leading-6 outline-none focus:border-[#b58835]"
                        defaultValue={emailDraft.message}
                        maxLength={4_000}
                        minLength={10}
                        name="message"
                        required
                      />
                    </label>
                    <p className="text-xs leading-5 text-[#6b6257]">Sent by PhotoView.io. Replies go to the SuperAdmin email shown at the top of this page.</p>
                    <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white" type="submit">
                      <Send className="size-4" />
                      Send email
                    </button>
                  </form>
                </details>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function StatsTab({
  analytics,
  rows,
  summary,
}: {
  analytics: AdminAnalyticsSummary
  rows: AdminSubscriberRow[]
  summary: Awaited<ReturnType<typeof getAdminSubscribers>>["summary"]
}) {
  const topStorage = [...rows].sort((a, b) => b.storageUsedBytes - a.storageUsedBytes).slice(0, 5)

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard detail="Distinct browser sessions recorded over the last 30 days." icon={Users} label="Visits" value={String(analytics.visitCount)} />
        <StatCard detail="Tracked public page views over the last 30 days." icon={MousePointerClick} label="Page views" value={String(analytics.pageViewCount)} />
        <StatCard detail="Average tracked time before the visitor leaves or changes pages." icon={Timer} label="Avg time" value={formatDuration(analytics.averageDurationMs)} />
        <StatCard detail="Reserved and used storage across all plans." icon={HardDrive} label="Storage used" value={formatAccountBytes(summary.storageUsedBytes)} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Usage overview</h2>
          <div className="mt-6 space-y-6">
            <UsageBand label="Storage" limit={summary.storageLimitBytes} used={summary.storageUsedBytes} />
          </div>
        </section>
        <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Device analytics</h2>
          <p className="mt-2 text-sm leading-6 text-[#6b6257]">
            Mobile, desktop, and tablet page views across public-facing pages for the last 30 days.
          </p>
          <div className="mt-5 space-y-3">
            {analytics.deviceRows.map((row) => {
              const Icon = row.deviceType === "MOBILE" ? Smartphone : Monitor
              const value = analytics.pageViewCount > 0 ? Math.round((row.count / analytics.pageViewCount) * 100) : 0

              return (
                <div className="rounded-md border border-[#eee7dc] bg-[#fbfaf7] p-4" key={row.deviceType}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="flex items-center gap-2 font-semibold">
                      <Icon className="size-4 text-[#b58835]" />
                      {row.deviceType}
                    </span>
                    <span className="text-[#6b6257]">{row.count} views · {value}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#ece5d9]">
                    <div className="h-full rounded-full bg-[#1a211b]" style={{ width: `${value}%` }} />
                  </div>
                </div>
              )
            })}
            {analytics.deviceRows.length === 0 ? <p className="text-sm text-[#6b6257]">No device data yet. It will appear after public visitors load tracked pages.</p> : null}
          </div>
        </section>
      </section>

      <section className="max-w-3xl">
        <RankedUsage title="Top storage users" rows={topStorage} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <section className="rounded-md border border-[#ded6c9] bg-white shadow-sm">
          <div className="border-b border-[#ded6c9] px-5 py-4">
            <h2 className="text-xl font-semibold">Top pages</h2>
            <p className="mt-1 text-sm text-[#6b6257]">Most viewed public paths over the last 30 days.</p>
          </div>
          <div className="divide-y divide-[#eee7dc]">
            {analytics.topPaths.map((row) => (
              <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm" key={row.path}>
                <span className="font-semibold">{row.path}</span>
                <span className="text-[#6b6257]">{row.count} views</span>
              </div>
            ))}
            {analytics.topPaths.length === 0 ? <p className="px-5 py-8 text-sm text-[#6b6257]">No page view data yet.</p> : null}
          </div>
        </section>
        <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Portfolio conversion</h2>
          <p className="mt-2 text-sm leading-6 text-[#6b6257]">
            Signup, pricing, checkout, share, download, and coupon events over the last 30 days.
          </p>
          <div className="mt-5 grid gap-3">
            <div className="rounded-md border border-[#eee7dc] bg-[#fbfaf7] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8a8072]">Exit samples</p>
              <p className="mt-2 text-2xl font-semibold">{analytics.exitCount}</p>
            </div>
            {analytics.conversionRows.map((row) => (
              <div className="flex items-center justify-between gap-4 rounded-md border border-[#eee7dc] bg-[#fbfaf7] p-4 text-sm" key={row.eventType}>
                <span className="font-semibold">{row.eventType.replaceAll("_", " ")}</span>
                <span className="text-[#6b6257]">{row.count}</span>
              </div>
            ))}
            {analytics.conversionRows.length === 0 ? <EmptyAnalyticsCard icon={BarChart3} label="Conversion events" /> : null}
          </div>
        </section>
      </section>
    </div>
  )
}

function RankedUsage({
  rows,
  title,
}: {
  rows: AdminSubscriberRow[]
  title: string
}) {
  return (
    <section className="rounded-md border border-[#ded6c9] bg-white shadow-sm">
      <div className="border-b border-[#ded6c9] px-5 py-4">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="divide-y divide-[#eee7dc]">
        {rows.map((row) => {
          const used = row.storageUsedBytes
          const limit = row.storageLimitBytes
          const value = row.storagePercent
          return (
            <div className="px-5 py-4" key={row.workspaceId}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-semibold">{row.workspaceName}</span>
                <span className="text-[#6b6257]">{formatAccountBytes(used)} / {formatAccountBytes(limit)}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#ece5d9]">
                <div className={`h-full rounded-full ${percentTone(value)}`} style={{ width: `${Math.min(value, 100)}%` }} />
              </div>
            </div>
          )
        })}
        {rows.length === 0 ? <p className="px-5 py-8 text-sm text-[#6b6257]">No usage records yet.</p> : null}
      </div>
    </section>
  )
}

function PlansTab({ rows }: { rows: AdminSubscriberRow[] }) {
  const planNames = Array.from(new Map(rows.map((row) => [row.planSlug, row.planName])).entries())
    .sort(([a], [b]) => {
      const aIndex = planOrder.indexOf(a)
      const bIndex = planOrder.indexOf(b)
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex)
    })

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Published plan allowances</h2>
        <p className="mt-1 text-sm text-[#6b6257]">These are the current storage allowances subscribers see on signup and account pages.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {subscriberPlans.map((plan) => (
            <div className="rounded-md border border-[#eee7dc] bg-[#fbfaf7] p-4" key={plan.slug}>
              <p className="font-semibold">{plan.name}</p>
              <p className="mt-2 text-sm text-[#6b6257]">{formatPlanStorage(plan.storageLimitBytes)} portfolio storage</p>
              <p className="mt-3 text-xs text-[#8a8072]">Website builder and portfolio delivery included</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Cancellation and file-retention policy</h2>
        <p className="mt-1 text-sm text-[#6b6257]">Operational policy for canceled accounts, failed payments, and subscriber file cleanup.</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {accountFilePolicy.map((item) => (
            <div className="rounded-md border border-[#eee7dc] bg-[#fbfaf7] p-4" key={item.title}>
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#6b6257]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-[#ded6c9] bg-white shadow-sm">
        <div className="border-b border-[#ded6c9] px-5 py-4">
          <h2 className="text-xl font-semibold">Subscriber plan map</h2>
          <p className="mt-1 text-sm text-[#6b6257]">A quick way to see every user and the plan they currently occupy.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#eee7dc] text-sm">
            <thead className="bg-[#fbfaf7] text-left text-xs uppercase tracking-[0.14em] text-[#8a8072]">
              <tr>
                <th className="px-5 py-3">Subscriber</th>
                {planNames.map(([slug, name]) => <th className="px-5 py-3" key={slug}>{name}</th>)}
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Billing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee7dc]">
              {rows.map((row) => (
                <tr key={row.workspaceId}>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{row.ownerName}</p>
                    <p className="mt-1 text-xs text-[#6b6257]">{row.ownerEmail}</p>
                  </td>
                  {planNames.map(([slug]) => (
                    <td className="px-5 py-4" key={slug}>
                      <span className={`inline-flex size-7 items-center justify-center rounded-full border ${
                        row.planSlug === slug ? "border-[#1a211b] bg-[#1a211b] text-white" : "border-[#ded6c9] text-[#c8bdad]"
                      }`}>
                        {row.planSlug === slug ? "✓" : ""}
                      </span>
                    </td>
                  ))}
                  <td className={`px-5 py-4 font-semibold ${statusTone(row.status)}`}>{normalizeStatus(row.status)}</td>
                  <td className="px-5 py-4">{row.billingCycle}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-[#6b6257]" colSpan={planNames.length + 3}>No subscriber records yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function FinancialsTab({
  cancellationSurveys,
  rows,
  summary,
  stripeConfig,
}: {
  cancellationSurveys: CancellationSurveyRow[]
  rows: AdminSubscriberRow[]
  summary: Awaited<ReturnType<typeof getAdminSubscribers>>["summary"]
  stripeConfig: StripeConfigSummary
}) {
  const trialRows = rows.filter((row) => row.status === "TRIALING")
  const activeRows = rows.filter((row) => row.status === "ACTIVE")
  const billingRiskRows = rows.filter((row) => ["PAST_DUE", "UNPAID", "INCOMPLETE"].includes(row.status) || !row.stripeConnected || row.cancelAtPeriodEnd)
  const stripeReady = stripeConfig.isLiveReady || stripeConfig.isTestReady
  const stripeStatusLabel = stripeConfig.isLiveReady ? "Live ready" : stripeConfig.isTestReady ? "Test ready" : "Needs setup"

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className={`flex size-10 items-center justify-center rounded-md ${stripeConfig.isLiveReady ? "bg-emerald-600" : stripeConfig.isTestReady ? "bg-sky-600" : "bg-[#b58835]"} text-white`}>
                <CreditCard className="size-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold">Stripe billing readiness</h2>
                <p className="mt-1 text-sm text-[#6b6257]">
                  Confirms production has matching key modes, a webhook secret, and every monthly and annual price id. Run the Stripe cutover verifier before going live.
                </p>
              </div>
            </div>
          </div>
          <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${stripeConfig.isLiveReady ? "bg-emerald-50 text-emerald-800" : stripeConfig.isTestReady ? "bg-sky-50 text-sky-800" : "bg-amber-50 text-amber-800"}`}>
            {stripeStatusLabel}
          </span>
        </div>

        {stripeConfig.isTestReady ? (
          <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
            <p className="font-semibold">Stripe sandbox is fully connected</p>
            <p className="mt-1">Test subscribers, cards, invoices, and webhooks are operational. Switch every Stripe key and price id to matching live values before accepting real payments.</p>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-md bg-[#fbfaf7] p-3">
            <span className="block text-xs uppercase tracking-[0.14em] text-[#8a8072]">Expected mode</span>
            <span className="mt-1 block text-sm font-semibold capitalize">{stripeConfig.expectedMode ?? "Not locked"}</span>
          </div>
          <div className="rounded-md bg-[#fbfaf7] p-3">
            <span className="block text-xs uppercase tracking-[0.14em] text-[#8a8072]">Secret key</span>
            <span className="mt-1 block text-sm font-semibold capitalize">{stripeConfig.secretKeyMode}</span>
          </div>
          <div className="rounded-md bg-[#fbfaf7] p-3">
            <span className="block text-xs uppercase tracking-[0.14em] text-[#8a8072]">Publishable key</span>
            <span className="mt-1 block text-sm font-semibold capitalize">{stripeConfig.publishableKeyMode}</span>
          </div>
          <div className="rounded-md bg-[#fbfaf7] p-3">
            <span className="block text-xs uppercase tracking-[0.14em] text-[#8a8072]">Webhook secret</span>
            <span className="mt-1 block text-sm font-semibold">{stripeConfig.webhookSecretPresent ? "Present" : "Missing"}</span>
          </div>
          <div className="rounded-md bg-[#fbfaf7] p-3">
            <span className="block text-xs uppercase tracking-[0.14em] text-[#8a8072]">Automatic tax</span>
            <span className="mt-1 block text-sm font-semibold">{stripeConfig.automaticTaxEnabled ? "Enabled" : "Disabled"}</span>
          </div>
        </div>

        {!stripeReady && stripeConfig.missingRequired.length > 0 ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <p className="font-semibold">Missing or empty production values</p>
            <p className="mt-1">{stripeConfig.missingRequired.join(", ")}</p>
          </div>
        ) : null}

        <div className="mt-5 overflow-x-auto rounded-md border border-[#ded6c9]">
          <table className="min-w-full divide-y divide-[#eee7dc] text-sm">
            <thead className="bg-[#fbfaf7] text-left text-xs uppercase tracking-[0.14em] text-[#8a8072]">
              <tr>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Cycle</th>
                <th className="px-4 py-3">Expected</th>
                <th className="px-4 py-3">Env var</th>
                <th className="px-4 py-3">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee7dc]">
              {stripeConfig.priceRows.map((row) => (
                <tr key={row.envName}>
                  <td className="px-4 py-3 font-semibold">{row.planName}</td>
                  <td className="px-4 py-3">{row.billingCycle}</td>
                  <td className="px-4 py-3">{money(row.expectedAmountCents)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.envName}</td>
                  <td className={`px-4 py-3 font-mono text-xs ${row.present ? "text-emerald-700" : "text-red-700"}`}>{row.maskedValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard detail={`${summary.active} active subscribers are counted in recurring revenue.`} icon={DollarSign} label="Active MRR" value={money(summary.activeMrrCents)} />
        <StatCard detail={`${money(summary.activeArrCents)} estimated active annual run rate.`} icon={BarChart3} label="Active ARR" value={money(summary.activeArrCents)} />
        <StatCard detail={`${trialRows.length} active trial accounts in the pipeline.`} icon={CreditCard} label="Trial pipeline MRR" value={money(summary.trialPipelineMrrCents)} />
        <StatCard detail={`${summary.stripeConnected} of ${summary.total} accounts have Stripe customers attached.`} icon={Gauge} label="Billing connected" value={`${summary.total ? Math.round((summary.stripeConnected / summary.total) * 100) : 0}%`} />
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <MoneyList title="Trial pipeline" rows={trialRows} empty="No active trials." />
        <MoneyList title="Active subscribers" rows={activeRows} empty="No active paid subscribers yet." />
        <MoneyList title="Billing risk" rows={billingRiskRows} empty="No billing issues found." />
      </section>

      <CancellationSurveyList rows={cancellationSurveys} />
    </div>
  )
}

function CouponsTab({ coupons }: { coupons: CouponRow[] }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[#1a211b] text-white">
            <Gift className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">Create a coupon</h2>
            <p className="text-sm text-[#6b6257]">Grant free access by plan and duration, with optional lead-gen positioning.</p>
          </div>
        </div>

        <form action={saveCouponCode} className="mt-6 space-y-4">
          <label className="grid gap-2 text-sm font-semibold">
            Coupon code
            <input className="h-11 rounded-md border border-[#d7cec0] bg-white px-3 uppercase outline-none focus:border-[#b58835]" name="code" placeholder="FOUNDERS100" required />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Internal name
            <input className="h-11 rounded-md border border-[#d7cec0] bg-white px-3 outline-none focus:border-[#b58835]" name="name" placeholder="Founders free Starter" required />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Description
            <textarea className="min-h-20 rounded-md border border-[#d7cec0] bg-white p-3 outline-none focus:border-[#b58835]" name="description" placeholder="Who this is for and when to use it." />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Plan level
              <select className="h-11 rounded-md border border-[#d7cec0] bg-white px-3 outline-none focus:border-[#b58835]" name="planSlug">
                {subscriberPlans.map((plan) => (
                  <option key={plan.slug} value={plan.slug}>{plan.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Free duration
              <input className="h-11 rounded-md border border-[#d7cec0] bg-white px-3 outline-none focus:border-[#b58835]" defaultValue={30} min={1} name="freeDays" type="number" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Expiration date
              <input className="h-11 rounded-md border border-[#d7cec0] bg-white px-3 outline-none focus:border-[#b58835]" name="expiresAt" type="date" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Max redemptions
              <input className="h-11 rounded-md border border-[#d7cec0] bg-white px-3 outline-none focus:border-[#b58835]" min={1} name="maxRedemptions" placeholder="Unlimited" type="number" />
            </label>
          </div>
          <div className="rounded-md border border-[#eee7dc] bg-[#fbfaf7] p-4">
            <p className="text-sm font-semibold">Lead generation idea</p>
            <p className="mt-2 text-sm leading-6 text-[#6b6257]">
              Use coupons as lead magnets: “Get a free cinematic portfolio for 30 days” or “Publish one mobile-ready travel gallery free.” Capture first name and email, then follow up with onboarding emails.
            </p>
            <div className="mt-4 grid gap-4">
              <input className="h-11 rounded-md border border-[#d7cec0] bg-white px-3 text-sm outline-none focus:border-[#b58835]" name="leadMagnetTitle" placeholder="Lead magnet headline" />
              <textarea className="min-h-20 rounded-md border border-[#d7cec0] bg-white p-3 text-sm outline-none focus:border-[#b58835]" name="leadMagnetNote" placeholder="What the prospect gets and why they should redeem it." />
            </div>
          </div>
          <button className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white" type="submit">
            <Save className="size-4" />
            Save coupon
          </button>
        </form>
      </section>

      <section className="rounded-md border border-[#ded6c9] bg-white shadow-sm">
        <div className="border-b border-[#ded6c9] px-5 py-4">
          <h2 className="text-xl font-semibold">Active coupon library</h2>
          <p className="mt-1 text-sm text-[#6b6257]">Codes can be entered on registration. A matching code grants free access and skips Stripe checkout.</p>
        </div>
        <div className="divide-y divide-[#eee7dc]">
          {coupons.map((coupon) => (
            <div className="px-5 py-4" key={coupon.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold">{coupon.name}</p>
                  <p className="mt-1 font-mono text-sm text-[#9a6a16]">{coupon.code}</p>
                  <p className="mt-2 text-sm leading-6 text-[#6b6257]">{coupon.description ?? "No description."}</p>
                </div>
                <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${coupon.isActive ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                  {coupon.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                <div className="rounded-md bg-[#fbfaf7] p-3"><span className="block text-xs text-[#8a8072]">Plan</span>{coupon.planSlug}</div>
                <div className="rounded-md bg-[#fbfaf7] p-3"><span className="block text-xs text-[#8a8072]">Free days</span>{coupon.freeDays}</div>
                <div className="rounded-md bg-[#fbfaf7] p-3"><span className="block text-xs text-[#8a8072]">Redeemed</span>{coupon.redemptionCount}{coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ""}</div>
                <div className="rounded-md bg-[#fbfaf7] p-3"><span className="block text-xs text-[#8a8072]">Expires</span>{formatDate(coupon.expiresAt?.toISOString() ?? null)}</div>
              </div>
              <p className="mt-3 text-xs text-[#6b6257]">
                Leads: {coupon._count.leadCaptures} · Trial signups: {coupon._count.trialSignups}
              </p>
            </div>
          ))}
          {coupons.length === 0 ? <p className="px-5 py-8 text-sm text-[#6b6257]">No coupons yet.</p> : null}
        </div>
      </section>
    </section>
  )
}

function MoneyList({ empty, rows, title }: { empty: string; rows: AdminSubscriberRow[]; title: string }) {
  return (
    <section className="rounded-md border border-[#ded6c9] bg-white shadow-sm">
      <div className="border-b border-[#ded6c9] px-5 py-4">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="divide-y divide-[#eee7dc]">
        {rows.slice(0, 8).map((row) => (
          <div className="px-5 py-4" key={row.workspaceId}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{row.workspaceName}</p>
                <p className="mt-1 text-xs text-[#6b6257]">{row.planName} · {row.billingCycle}</p>
              </div>
              <p className={`text-sm font-semibold ${statusTone(row.status)}`}>{normalizeStatus(row.status)}</p>
            </div>
            <p className="mt-2 text-xs text-[#6b6257]">Period ends {formatDate(row.currentPeriodEnd)} · Trial ends {formatDate(row.trialEndsAt)}</p>
          </div>
        ))}
        {rows.length === 0 ? <p className="px-5 py-8 text-sm text-[#6b6257]">{empty}</p> : null}
      </div>
    </section>
  )
}

function CancellationSurveyList({ rows }: { rows: CancellationSurveyRow[] }) {
  return (
    <section className="rounded-md border border-[#ded6c9] bg-white shadow-sm">
      <div className="border-b border-[#ded6c9] px-5 py-4">
        <h2 className="text-xl font-semibold">Cancellation feedback</h2>
        <p className="mt-1 text-sm text-[#6b6257]">
          Recent reasons subscribers gave after canceling or scheduling cancellation.
        </p>
      </div>
      <div className="divide-y divide-[#eee7dc]">
        {rows.map((row) => (
          <div className="px-5 py-4" key={row.id}>
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold">{row.reason}</p>
                <p className="mt-1 text-xs text-[#6b6257]">
                  {row.workspace?.name ?? "Unknown workspace"} · {row.email}
                </p>
              </div>
              <span className="text-xs text-[#8a8072]">{formatDate(row.createdAt.toISOString())}</span>
            </div>
            {row.notes ? <p className="mt-3 text-sm leading-6 text-[#6b6257]">{row.notes}</p> : null}
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#6b6257]">
            No cancellation survey responses yet.
          </p>
        ) : null}
      </div>
    </section>
  )
}

function RightsTab({ adminUsers }: { adminUsers: AdminUserRow[] }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[#1a211b] text-white">
            <UserPlus className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">Add or update an admin</h2>
            <p className="text-sm text-[#6b6257]">Use this to give another person access without giving away your full SuperAdmin controls.</p>
          </div>
        </div>

        <form action={saveAdminRights} className="mt-6 space-y-5">
          <label className="block text-sm font-semibold" htmlFor="admin-email">
            Email address
          </label>
          <input
            className="h-11 w-full rounded-md border border-[#d7cec0] bg-white px-3 text-sm outline-none focus:border-[#b58835]"
            id="admin-email"
            name="email"
            placeholder="admin@example.com"
            type="email"
          />

          <label className="block text-sm font-semibold" htmlFor="admin-name">
            Name
          </label>
          <input
            className="h-11 w-full rounded-md border border-[#d7cec0] bg-white px-3 text-sm outline-none focus:border-[#b58835]"
            id="admin-name"
            name="name"
            placeholder="Optional"
            type="text"
          />

          <div>
            <p className="text-sm font-semibold">System role</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { description: "Full owner-level access, including rights management.", label: "SuperAdmin", value: "SUPERADMIN" },
                { description: "Limited admin access based on the controls below.", label: "Support", value: "SUPPORT" },
                { description: "Remove platform admin rights from this user.", label: "User", value: "USER" },
              ].map((role) => (
                <label className="rounded-md border border-[#ded6c9] bg-[#fbfaf7] p-3 text-sm" key={role.value}>
                  <span className="flex items-center gap-2 font-semibold">
                    <input defaultChecked={role.value === "SUPPORT"} name="systemRole" type="radio" value={role.value} />
                    {role.label}
                  </span>
                  <span className="mt-2 block leading-5 text-[#6b6257]">{role.description}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Allowed controls for Support admins</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {assignablePermissions.map((permission) => (
                <label className="flex gap-3 rounded-md border border-[#ded6c9] bg-[#fbfaf7] p-3 text-sm" key={permission.id}>
                  <input className="mt-1" name="permissions" type="checkbox" value={permission.id} />
                  <span>
                    <span className="block font-semibold">{permission.label}</span>
                    <span className="mt-1 block leading-5 text-[#6b6257]">{permission.note}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-[#6b6257]">
              SuperAdmins ignore these checkboxes and always receive every control. The Rights panel itself is SuperAdmin-only.
            </p>
          </div>

          <button className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white" type="submit">
            <Save className="size-4" />
            Save admin rights
          </button>
        </form>
      </section>

      <section className="rounded-md border border-[#ded6c9] bg-white shadow-sm">
        <div className="border-b border-[#ded6c9] px-5 py-4">
          <h2 className="text-xl font-semibold">Current platform admins</h2>
          <p className="mt-1 text-sm text-[#6b6257]">These users can enter the SuperAdmin area. Support users only see the controls you grant.</p>
        </div>
        <div className="divide-y divide-[#eee7dc]">
          {adminUsers.map((user) => (
            <div className="px-5 py-4" key={user.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="mt-1 text-sm text-[#6b6257]">{user.email}</p>
                  <p className="mt-1 text-xs text-[#8a8072]">Admin since {formatDate(user.createdAt)}</p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ded6c9] bg-[#fbfaf7] px-3 py-1 text-xs font-semibold">
                  <LockKeyhole className="size-3" />
                  {user.systemRole}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(user.systemRole === "SUPERADMIN" ? adminCapabilities : user.adminPermissions).map((permission) => {
                  const tab = tabs.find((item) => item.id === permission)
                  return (
                    <span className="rounded-full bg-[#f2eee7] px-3 py-1 text-xs font-medium text-[#5f5548]" key={permission}>
                      {tab?.label ?? permission}
                    </span>
                  )
                })}
                {user.systemRole !== "SUPERADMIN" && user.adminPermissions.length === 0 ? (
                  <span className="text-sm text-[#6b6257]">No controls assigned.</span>
                ) : null}
              </div>
            </div>
          ))}
          {adminUsers.length === 0 ? <p className="px-5 py-8 text-sm text-[#6b6257]">No platform admins yet.</p> : null}
        </div>
      </section>
    </section>
  )
}

function trialHealthForRow({
  dashboardOpens,
  emailSent,
  row,
  shareCount,
}: {
  dashboardOpens: number
  emailSent: number
  row: AdminSubscriberRow
  shareCount: number
}) {
  const issues: string[] = []

  if (dashboardOpens === 0) issues.push("No dashboard open tracked")
  if (row.galleryCount === 0) issues.push("No portfolio created")
  if (row.photoCount === 0) issues.push("No photos uploaded")
  if (shareCount === 0) issues.push("No share event recorded")
  if (emailSent === 0) issues.push("No education email sent yet")

  return {
    issues,
    score: Math.max(0, 100 - issues.length * 20),
  }
}

function TrialOpsTab({
  sent,
  summary,
}: {
  sent?: string
  summary: TrialOpsSummary
}) {
  const trialRows = summary.trialRows
  const averageHealth = trialRows.length
    ? Math.round(
        trialRows.reduce((total, row) => {
          const delivery = summary.deliveryCounts.get(row.workspaceId)
          return total + trialHealthForRow({
            dashboardOpens: summary.dashboardOpenCounts.get(row.workspaceId) ?? 0,
            emailSent: delivery?.sent ?? 0,
            row,
            shareCount: summary.shareCounts.get(row.workspaceId) ?? 0,
          }).score
        }, 0) / trialRows.length,
      )
    : 0
  const emailsSent = Array.from(summary.deliveryCounts.values()).reduce((total, item) => total + item.sent, 0)
  const emailsFailed = Array.from(summary.deliveryCounts.values()).reduce((total, item) => total + item.failed, 0)

  return (
    <section className="space-y-5">
      {sent ? (
        <div className={`rounded-md border px-4 py-3 text-sm font-semibold ${
          sent === "1" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"
        }`}>
          {sent === "1" ? "Test email sent." : "Test email could not be sent. Check Resend/email configuration."}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard detail="Subscribers currently in a 14-day trial." icon={Timer} label="Trialing" value={String(trialRows.length)} />
        <StatCard detail="Average based on dashboard opens, portfolio creation, photos, sharing, and email delivery." icon={Gauge} label="Trial health" value={`${averageHealth}%`} />
        <StatCard detail="Education and lifecycle emails recorded in the delivery table." icon={Mail} label="Emails sent" value={String(emailsSent)} />
        <StatCard detail="Failed email sends that should be reviewed." icon={AlertTriangle} label="Email failures" value={String(emailsFailed)} />
      </div>

      <section className="rounded-md border border-[#ded6c9] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#ded6c9] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Trial conversion tracking</h2>
            <p className="mt-1 text-sm text-[#6b6257]">
              Shows trial day, payment method status, email progress, dashboard opens, portfolio activity, uploads, and sharing signals.
            </p>
          </div>
          <form action={sendTestSequenceEmail} className="grid gap-2 rounded-md border border-[#eee7dc] bg-[#fbfaf7] p-3 md:grid-cols-[220px_260px_auto]">
            <input
              className="h-10 rounded-md border border-[#d7cec0] bg-white px-3 text-sm outline-none focus:border-[#b58835]"
              name="email"
              placeholder="Send test to email"
              type="email"
            />
            <select className="h-10 rounded-md border border-[#d7cec0] bg-white px-3 text-sm outline-none focus:border-[#b58835]" name="emailKey">
              {sequenceEmailKeys.map((item) => (
                <option key={item.key} value={item.key}>{item.label}</option>
              ))}
            </select>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white" type="submit">
              <Send className="size-4" />
              Send test
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#eee7dc] text-sm">
            <thead className="bg-[#fbfaf7] text-left text-xs uppercase tracking-[0.14em] text-[#8a8072]">
              <tr>
                <th className="px-5 py-3">Subscriber</th>
                <th className="px-5 py-3">Trial</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Emails</th>
                <th className="px-5 py-3">Signals</th>
                <th className="px-5 py-3">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee7dc]">
              {trialRows.map((row) => {
                const delivery = summary.deliveryCounts.get(row.workspaceId) ?? { failed: 0, lastSentAt: null, sent: 0, skipped: 0 }
                const dashboardOpens = summary.dashboardOpenCounts.get(row.workspaceId) ?? 0
                const shareCount = summary.shareCounts.get(row.workspaceId) ?? 0
                const health = trialHealthForRow({ dashboardOpens, emailSent: delivery.sent, row, shareCount })

                return (
                  <tr key={row.workspaceId}>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{row.workspaceName}</p>
                      <p className="mt-1 text-xs text-[#6b6257]">{row.ownerName} · {row.ownerEmail}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">Day {getTrialDay(row)}</p>
                      <p className="mt-1 text-xs text-[#6b6257]">Ends {formatDate(row.trialEndsAt)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className={row.stripeConnected ? "font-semibold text-emerald-700" : "font-semibold text-[#8a5c12]"}>
                        {row.stripeConnected ? "Card on file" : "No Stripe customer"}
                      </p>
                      <p className="mt-1 text-xs text-[#6b6257]">{row.planName} · {row.billingCycle}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p>{delivery.sent} sent · {delivery.failed} failed</p>
                      <p className="mt-1 text-xs text-[#6b6257]">Last sent {formatDate(delivery.lastSentAt)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p>{dashboardOpens} dashboard opens</p>
                      <p className="mt-1 text-xs text-[#6b6257]">{row.galleryCount} portfolios · {row.photoCount} photos · {shareCount} shares</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-lg font-semibold">{health.score}%</p>
                      <p className="mt-1 max-w-xs text-xs leading-5 text-[#6b6257]">
                        {health.issues.length ? health.issues.join(", ") : "Healthy trial behavior"}
                      </p>
                    </td>
                  </tr>
                )
              })}
              {trialRows.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-[#6b6257]" colSpan={6}>No active trials right now.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-md border border-[#ded6c9] bg-white shadow-sm">
        <div className="border-b border-[#ded6c9] px-5 py-4">
          <h2 className="text-xl font-semibold">Recent email activity</h2>
          <p className="mt-1 text-sm text-[#6b6257]">Latest automation deliveries, including trial education, customer onboarding, and lifecycle emails.</p>
        </div>
        <div className="divide-y divide-[#eee7dc]">
          {summary.deliveries.slice(0, 30).map((delivery) => (
            <div className="grid gap-2 px-5 py-3 text-sm md:grid-cols-[1.4fr_1fr_1fr_auto]" key={delivery.id}>
              <div>
                <p className="font-semibold">{delivery.email}</p>
                <p className="mt-1 text-xs text-[#6b6257]">{delivery.automationKey}</p>
              </div>
              <p>{delivery.event}</p>
              <p>{delivery.providerStatus ?? delivery.status}</p>
              <p className="text-[#6b6257]">{formatDate((delivery.sentAt ?? delivery.createdAt).toISOString())}</p>
            </div>
          ))}
          {summary.deliveries.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[#6b6257]">No email delivery records yet.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-md border border-[#ded6c9] bg-white shadow-sm">
        <div className="border-b border-[#ded6c9] px-5 py-4">
          <h2 className="text-xl font-semibold">Subscriber activity timeline</h2>
          <p className="mt-1 text-sm text-[#6b6257]">
            Recent dashboard opens, uploads, portfolio creation, share events, and email deliveries across subscribers.
          </p>
        </div>
        <div className="divide-y divide-[#eee7dc]">
          {summary.recentActivity.map((activity) => (
            <div className="grid gap-2 px-5 py-3 text-sm md:grid-cols-[120px_1fr_auto]" key={`${activity.type}-${activity.at}-${activity.detail}`}>
              <span className="w-fit rounded-full border border-[#ded6c9] bg-[#fbfaf7] px-3 py-1 text-xs font-semibold text-[#6b6257]">
                {activity.type}
              </span>
              <div>
                <p className="font-semibold">{activity.label}</p>
                <p className="mt-1 break-all text-xs text-[#6b6257]">{activity.detail}</p>
              </div>
              <p className="text-[#6b6257]">{formatDate(activity.at)}</p>
            </div>
          ))}
          {summary.recentActivity.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[#6b6257]">No subscriber activity recorded yet.</p>
          ) : null}
        </div>
      </section>
    </section>
  )
}

function AuditTab({ logs }: { logs: AdminAuditRow[] }) {
  return (
    <section className="rounded-md border border-[#ded6c9] bg-white shadow-sm">
      <div className="border-b border-[#ded6c9] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[#1a211b] text-white">
            <Activity className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">Admin audit log</h2>
            <p className="text-sm text-[#6b6257]">A running record of SuperAdmin and Support activity.</p>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-[#8a8072]">
              You do not need to review this daily. Use it to investigate who accessed Admin or changed rights, coupons, incidents, and subscriber communications. It does not expose subscriber photos.
            </p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#eee7dc] text-sm">
          <thead className="bg-[#fbfaf7] text-left text-xs uppercase tracking-[0.14em] text-[#8a8072]">
            <tr>
              <th className="px-5 py-3">When</th>
              <th className="px-5 py-3">Admin</th>
              <th className="px-5 py-3">Action</th>
              <th className="px-5 py-3">Target</th>
              <th className="px-5 py-3">Context</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eee7dc]">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-5 py-4 whitespace-nowrap">{formatDate(log.createdAt.toISOString())}</td>
                <td className="px-5 py-4">{log.email ?? "Unknown"}</td>
                <td className="px-5 py-4 font-semibold">{log.action.replaceAll("_", " ")}</td>
                <td className="px-5 py-4">{log.targetType ? `${log.targetType}: ${log.targetId ?? "Unknown"}` : "None"}</td>
                <td className="px-5 py-4 text-xs text-[#6b6257]">
                  {log.metadata ? JSON.stringify(log.metadata) : log.ipAddress ?? "No extra context"}
                </td>
              </tr>
            ))}
            {logs.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-[#6b6257]" colSpan={5}>No admin audit events yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function healthTone(status: string) {
  if (status === "HEALTHY" || status === "RESOLVED") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (status === "OUTAGE" || status === "CRITICAL") return "border-red-200 bg-red-50 text-red-800"
  return "border-amber-200 bg-amber-50 text-amber-800"
}

function operationalTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function SystemHealthTab({ health }: { health: OperationalHealthSummary }) {
  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          detail="Current platform status based on configuration, jobs, and open incidents."
          icon={Activity}
          label="Platform status"
          value={health.status === "HEALTHY" ? "Healthy" : health.status === "OUTAGE" ? "Outage" : "Degraded"}
        />
        <StatCard detail="Unresolved events that need review." icon={AlertTriangle} label="Open incidents" value={String(health.openCount)} />
        <StatCard detail="Critical events trigger throttled admin email alerts." icon={Mail} label="Critical incidents" value={String(health.criticalCount)} />
      </div>

      <section className="rounded-md border border-[#ded6c9] bg-white shadow-sm">
        <div className="border-b border-[#ded6c9] px-5 py-4">
          <h2 className="text-xl font-semibold">Service status</h2>
          <p className="mt-1 text-sm text-[#6b6257]">Live configuration and delivery checks for the systems subscribers depend on.</p>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-5">
          {health.services.map((service) => (
            <article className="rounded-md border border-[#e8e0d4] p-4" key={service.key}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{service.label}</h3>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${healthTone(service.status)}`}>
                  {service.status}
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#6b6257]">{service.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-[#ded6c9] bg-white shadow-sm">
        <div className="border-b border-[#ded6c9] px-5 py-4">
          <h2 className="text-xl font-semibold">Operational incidents</h2>
          <p className="mt-1 text-sm text-[#6b6257]">
            Repeated failures are grouped by fingerprint. Resolve an incident after correcting its cause; another occurrence will reopen it automatically.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#eee7dc] text-sm">
            <thead className="bg-[#fbfaf7] text-left text-xs uppercase tracking-[0.14em] text-[#8a8072]">
              <tr>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Incident</th>
                <th className="px-5 py-3">Workspace</th>
                <th className="px-5 py-3">Occurrences</th>
                <th className="px-5 py-3">Last seen</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee7dc]">
              {health.events.map((event) => (
                <tr className={event.status === "OPEN" ? "bg-white" : "bg-[#fbfaf7] text-[#777064]"} key={event.id}>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${healthTone(event.status === "RESOLVED" ? "RESOLVED" : event.severity)}`}>
                      {event.status === "RESOLVED" ? "Resolved" : event.severity}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{event.category}</p>
                    <p className="mt-1 text-xs text-[#6b6257]">{event.source}</p>
                  </td>
                  <td className="max-w-md px-5 py-4 leading-6">{event.message}</td>
                  <td className="px-5 py-4">{event.workspaceName ?? "Platform"}</td>
                  <td className="px-5 py-4">{event.occurrenceCount}</td>
                  <td className="whitespace-nowrap px-5 py-4">{operationalTime(event.lastOccurredAt)}</td>
                  <td className="px-5 py-4">
                    {event.status === "OPEN" ? (
                      <form action={resolveOperationalIncident}>
                        <input name="incidentId" type="hidden" value={event.id} />
                        <button className="h-9 rounded-md border border-[#d7cec0] bg-white px-3 text-xs font-semibold" type="submit">
                          Mark resolved
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs">{event.resolvedAt ? operationalTime(event.resolvedAt) : "Resolved"}</span>
                    )}
                  </td>
                </tr>
              ))}
              {health.events.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-[#6b6257]" colSpan={7}>No operational incidents have been recorded.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

function SecurityTab() {
  return (
    <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[#1a211b] text-white">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">Current protection</h2>
            <p className="text-sm text-[#6b6257]">The page is server-protected before data loads.</p>
          </div>
        </div>
        <div className="mt-5 space-y-3 text-sm leading-6 text-[#6b6257]">
          <p>Unauthenticated visitors are sent to login.</p>
          <p>Logged-in non-admin subscribers are redirected before subscriber data is queried.</p>
          <p>SuperAdmin and Support access is backed by each user&apos;s database system role.</p>
          <p>Support accounts receive only the capabilities explicitly assigned in the Rights panel.</p>
          <p>Administrative activity and rights changes are recorded in the audit log.</p>
        </div>
      </section>
      <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Next security upgrades</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {[
            "Add two-factor authentication for admins before showing this page.",
            "Add IP/device alerts for unusual admin login behavior.",
            "Separate customer dashboard sessions from SuperAdmin sessions.",
            "Add one-click session revocation for lost or untrusted devices.",
            "Require periodic reauthentication for financial and rights changes.",
          ].map((item) => (
            <div className="rounded-md border border-[#eee7dc] bg-[#fbfaf7] p-4 text-sm leading-6 text-[#6b6257]" key={item}>
              {item}
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}

export default async function SuperAdminPage({ searchParams }: SuperAdminPageProps) {
  const session = await auth()
  const params = await searchParams
  const requestedTab = params?.tab
  const sent = params?.sent

  if (!session?.user) {
    redirect("/login")
  }

  if (!isAdminSession(session)) {
    redirect("/account")
  }

  if (!(await hasValidSuperAdminMfa(session))) {
    const nextPath = requestedTab ? `/admin?tab=${encodeURIComponent(requestedTab)}` : "/admin"
    redirect(`/admin/verify?next=${encodeURIComponent(nextPath)}`)
  }

  const visibleTabs = tabs.filter((tab) => hasAdminCapability(session, tab.id))
  if (visibleTabs.length === 0) redirect("/account")

  const activeTab = visibleTabs.some((tab) => tab.id === requestedTab) ? requestedTab as AdminTab : visibleTabs[0].id
  if (requestedTab && requestedTab !== activeTab) redirect(`/admin?tab=${activeTab}`)

  const requestHeaders = await headers()
  await logAdminAuditEvent({
    action: "ADMIN_TAB_VIEWED",
    ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim(),
    metadata: {
      tab: activeTab,
    },
    session,
    targetId: activeTab,
    targetType: "AdminTab",
    userAgent: requestHeaders.get("user-agent"),
  })

  const { rows, summary } = await getAdminSubscribers()
  const analytics = hasAdminCapability(session, "stats")
    ? await getAdminAnalyticsSummary()
    : {
        averageDurationMs: 0,
        conversionRows: [],
        deviceRows: [],
        exitCount: 0,
        pageViewCount: 0,
        topPaths: [],
        visitCount: 0,
      }
  const adminUsers = hasAdminCapability(session, "rights") ? await getAdminUsers() : []
  const auditLogs = hasAdminCapability(session, "audit") ? await getAdminAuditLogs() : []
  const coupons = hasAdminCapability(session, "coupons") ? await getCouponRows() : []
  const stripeConfig = hasAdminCapability(session, "financials") ? getStripeConfigSummary() : null
  const operationalHealth = hasAdminCapability(session, "health") ? await getOperationalHealthSummary() : null
  const cancellationSurveys = hasAdminCapability(session, "financials") ? await getCancellationSurveyRows() : []
  const trialOps = hasAdminCapability(session, "trials")
    ? await getTrialOpsSummary(rows)
    : {
        dashboardOpenCounts: new Map<string, number>(),
        deliveries: [],
        deliveryCounts: new Map<string, { failed: number; lastSentAt: string | null; sent: number; skipped: number }>(),
        recentActivity: [],
        shareCounts: new Map<string, number>(),
        trialRows: [],
      }
  const attentionRows = rows.filter((row) =>
    row.storagePercent >= 90 ||
    ["PAST_DUE", "UNPAID", "CANCELED"].includes(row.status) ||
    row.cancelAtPeriodEnd,
  )

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-5 py-8 text-[#1d1d1b] md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-[#ded6c9] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link className="inline-flex items-center gap-3" href="/">
              <span className="flex size-10 items-center justify-center rounded-md bg-[#d8a84f] text-black">
                <Camera className="size-5" />
              </span>
              <span className="font-semibold">PhotoView.io</span>
            </Link>
            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-[#b58835]">SuperAdmin</p>
            <h1 className="mt-2 text-4xl font-semibold">Business command center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b6257]">
              Monitor subscribers, usage, plans, revenue, platform health, billing risk, and the security posture of the platform.
            </p>
            <p className="mt-3 text-sm text-[#6b6257]">
              <span className="font-semibold text-[#1d1d1b]">Signed in as</span> {session.user.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="inline-flex h-11 items-center gap-2 rounded-md border border-[#d7cec0] bg-white px-4 text-sm font-semibold" href="/admin/subscribers">
              <Users className="size-4" />
              Subscriber ops
            </Link>
            <Link className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white" href="/api/auth/signout">
              <LogOut className="size-4" />
              Log out
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard detail={`${summary.trialing} trialing, ${summary.active} active, ${summary.canceled} canceled.`} icon={Users} label="Subscribers" value={String(summary.total)} />
          <StatCard detail={`${money(summary.activeArrCents)} estimated ARR from active subscriptions.`} icon={BarChart3} label="Active MRR" value={money(summary.activeMrrCents)} />
          <StatCard detail={`${money(summary.trialPipelineArrCents)} annualized if current trials convert.`} icon={CreditCard} label="Trial pipeline" value={money(summary.trialPipelineMrrCents)} />
          <StatCard
            actionHref={attentionRows.length > 0 ? "#attention" : undefined}
            actionLabel={attentionRows.length > 0 ? "Review flagged accounts" : undefined}
            detail={`${attentionRows.length} subscribers need billing, storage, or cancellation review.`}
            icon={AlertTriangle}
            label="Needs attention"
            value={String(attentionRows.length)}
          />
        </section>

        <NeedsAttentionPanel messageStatus={params?.subscriberMessage} recipient={params?.recipient} rows={attentionRows} />

        <nav className="mt-6 border-b border-[#ded6c9]" aria-label="SuperAdmin sections">
          <div className="flex flex-wrap gap-2">
            {visibleTabs.map((tab) => {
              const isActive = tab.id === activeTab
              return (
                <Link
                  className={`rounded-t-md border px-4 py-3 text-left ${
                    isActive
                      ? "border-[#ded6c9] border-b-[#f7f5f0] bg-[#f7f5f0] text-[#1d1d1b]"
                      : "border-transparent text-[#6b6257] hover:border-[#ded6c9] hover:bg-white"
                  }`}
                  href={`/admin?tab=${tab.id}`}
                  key={tab.id}
                >
                  <span className="block text-sm font-semibold">{tab.label}</span>
                  <span className="mt-1 block text-xs">{tab.note}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        <section className="mt-6">
          {activeTab === "subscribers" ? <SubscribersTab rows={rows} /> : null}
          {activeTab === "stats" ? <StatsTab analytics={analytics} rows={rows} summary={summary} /> : null}
          {activeTab === "health" && operationalHealth ? <SystemHealthTab health={operationalHealth} /> : null}
          {activeTab === "plans" ? <PlansTab rows={rows} /> : null}
          {activeTab === "financials" && stripeConfig ? (
            <FinancialsTab cancellationSurveys={cancellationSurveys} rows={rows} stripeConfig={stripeConfig} summary={summary} />
          ) : null}
          {activeTab === "trials" ? <TrialOpsTab sent={sent} summary={trialOps} /> : null}
          {activeTab === "coupons" ? <CouponsTab coupons={coupons} /> : null}
          {activeTab === "audit" ? <AuditTab logs={auditLogs} /> : null}
          {activeTab === "rights" ? <RightsTab adminUsers={adminUsers} /> : null}
          {activeTab === "security" ? <SecurityTab /> : null}
        </section>
      </div>
    </main>
  )
}
