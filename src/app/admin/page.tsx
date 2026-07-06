import {
  AlertTriangle,
  BarChart3,
  Camera,
  CreditCard,
  DollarSign,
  Gauge,
  HardDrive,
  Images,
  LayoutDashboard,
  Monitor,
  MousePointerClick,
  ShieldCheck,
  Smartphone,
  Timer,
  Users,
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { isAdminSession } from "@/lib/admin-access"
import { getAdminSubscribers, type AdminSubscriberRow } from "@/lib/admin-subscribers"
import { formatAccountBytes } from "@/lib/subscriber-account"

type AdminTab = "subscribers" | "stats" | "plans" | "financials" | "security"

type SuperAdminPageProps = {
  searchParams?: Promise<{
    tab?: string
  }>
}

const tabs: Array<{ id: AdminTab; label: string; note: string }> = [
  { id: "subscribers", label: "All Subscribers", note: "Accounts, owners, status, usage" },
  { id: "stats", label: "Site Stats", note: "Storage, bandwidth, device analytics" },
  { id: "plans", label: "Plans", note: "Who is on Starter, Growth, Studio, Archive" },
  { id: "financials", label: "Financials", note: "Trial pipeline, MRR, billing risk" },
  { id: "security", label: "Security", note: "Admin access and safeguards" },
]

const planOrder = ["starter", "growth", "studio", "archive"]

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

function StatCard({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string
  icon: typeof Users
  label: string
  value: string
}) {
  return (
    <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
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
              <th className="px-5 py-3">Bandwidth</th>
              <th className="px-5 py-3">Portfolio</th>
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
                <td className="px-5 py-4">{row.bandwidthPercent}%</td>
                <td className="px-5 py-4">{row.galleryCount} galleries · {row.photoCount} photos</td>
                <td className="px-5 py-4">
                  <p>{row.stripeConnected ? "Stripe connected" : "Stripe missing"}</p>
                  <p className="mt-1 text-xs text-[#6b6257]">Trial ends {formatDate(row.trialEndsAt)}</p>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-[#6b6257]" colSpan={7}>No subscriber records yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function StatsTab({
  rows,
  summary,
}: {
  rows: AdminSubscriberRow[]
  summary: Awaited<ReturnType<typeof getAdminSubscribers>>["summary"]
}) {
  const topStorage = [...rows].sort((a, b) => b.storageUsedBytes - a.storageUsedBytes).slice(0, 5)
  const topBandwidth = [...rows].sort((a, b) => b.bandwidthUsedBytes - a.bandwidthUsedBytes).slice(0, 5)

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard detail="Total portfolio media currently tracked in subscriber workspaces." icon={Images} label="Photos" value={String(summary.photoCount)} />
        <StatCard detail="Subscriber-created portfolios and galleries." icon={Camera} label="Galleries" value={String(summary.galleryCount)} />
        <StatCard detail="Reserved and used storage across all plans." icon={HardDrive} label="Storage used" value={formatAccountBytes(summary.storageUsedBytes)} />
        <StatCard detail="Monthly bandwidth usage currently tracked on subscriptions." icon={Gauge} label="Bandwidth used" value={formatAccountBytes(summary.bandwidthUsedBytes)} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Usage overview</h2>
          <div className="mt-6 space-y-6">
            <UsageBand label="Storage" limit={summary.storageLimitBytes} used={summary.storageUsedBytes} />
            <UsageBand label="Monthly bandwidth" limit={summary.bandwidthLimitBytes} used={summary.bandwidthUsedBytes} />
          </div>
        </section>
        <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Device analytics</h2>
          <p className="mt-2 text-sm leading-6 text-[#6b6257]">
            The app does not yet record visitor events by mobile vs desktop. Once added, this panel should show visits, pages viewed, average time, portfolio opens, and download/share events by device.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <EmptyAnalyticsCard icon={Smartphone} label="Mobile visits" />
            <EmptyAnalyticsCard icon={Monitor} label="Desktop visits" />
          </div>
        </section>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <RankedUsage title="Top storage users" rows={topStorage} mode="storage" />
        <RankedUsage title="Top bandwidth users" rows={topBandwidth} mode="bandwidth" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <EmptyAnalyticsCard icon={MousePointerClick} label="Pages accessed" />
        <EmptyAnalyticsCard icon={Timer} label="Time spent" />
        <EmptyAnalyticsCard icon={BarChart3} label="Portfolio conversion" />
      </section>
    </div>
  )
}

function RankedUsage({
  mode,
  rows,
  title,
}: {
  mode: "storage" | "bandwidth"
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
          const used = mode === "storage" ? row.storageUsedBytes : row.bandwidthUsedBytes
          const limit = mode === "storage" ? row.storageLimitBytes : row.bandwidthLimitBytes
          const value = mode === "storage" ? row.storagePercent : row.bandwidthPercent
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
  )
}

function FinancialsTab({
  rows,
  summary,
}: {
  rows: AdminSubscriberRow[]
  summary: Awaited<ReturnType<typeof getAdminSubscribers>>["summary"]
}) {
  const trialRows = rows.filter((row) => row.status === "TRIALING")
  const activeRows = rows.filter((row) => row.status === "ACTIVE")
  const billingRiskRows = rows.filter((row) => ["PAST_DUE", "UNPAID", "INCOMPLETE"].includes(row.status) || !row.stripeConnected || row.cancelAtPeriodEnd)

  return (
    <div className="space-y-5">
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
    </div>
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
          <p>SuperAdmin access is now backed by the user&apos;s database `systemRole`, with a temporary owner email fallback during bootstrap.</p>
        </div>
      </section>
      <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Next security upgrades</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {[
            "Remove the temporary bootstrap email fallback once SuperAdmin assignment tools are in place.",
            "Add two-factor authentication for admins before showing this page.",
            "Create an audit log for admin views, subscription changes, refunds, and storage actions.",
            "Add route-level admin middleware so /admin and /admin/* are blocked before page render.",
            "Add IP/device alerts for unusual admin login behavior.",
            "Separate customer dashboard sessions from SuperAdmin sessions.",
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
  const activeTab = tabs.some((tab) => tab.id === requestedTab) ? requestedTab as AdminTab : "subscribers"

  if (!session?.user) {
    redirect("/login")
  }

  if (!isAdminSession(session)) {
    redirect("/account")
  }

  const { rows, summary } = await getAdminSubscribers()
  const attentionRows = rows.filter((row) =>
    row.storagePercent >= 90 ||
    row.bandwidthPercent >= 90 ||
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
              <span className="font-semibold">PhotoViewPro</span>
            </Link>
            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-[#b58835]">SuperAdmin</p>
            <h1 className="mt-2 text-4xl font-semibold">Business command center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b6257]">
              Monitor subscribers, usage, plans, revenue, billing risk, and the security posture of the platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="inline-flex h-11 items-center gap-2 rounded-md border border-[#d7cec0] bg-white px-4 text-sm font-semibold" href="/admin/subscribers">
              <Users className="size-4" />
              Subscriber ops
            </Link>
            <Link className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white" href="/dashboard">
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard detail={`${summary.trialing} trialing, ${summary.active} active, ${summary.canceled} canceled.`} icon={Users} label="Subscribers" value={String(summary.total)} />
          <StatCard detail={`${money(summary.activeArrCents)} estimated ARR from active subscriptions.`} icon={BarChart3} label="Active MRR" value={money(summary.activeMrrCents)} />
          <StatCard detail={`${money(summary.trialPipelineArrCents)} annualized if current trials convert.`} icon={CreditCard} label="Trial pipeline" value={money(summary.trialPipelineMrrCents)} />
          <StatCard detail={`${attentionRows.length} subscribers need billing, storage, bandwidth, or cancellation review.`} icon={AlertTriangle} label="Needs attention" value={String(attentionRows.length)} />
        </section>

        <nav className="mt-6 overflow-x-auto border-b border-[#ded6c9]" aria-label="SuperAdmin sections">
          <div className="flex min-w-max gap-2">
            {tabs.map((tab) => {
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
          {activeTab === "stats" ? <StatsTab rows={rows} summary={summary} /> : null}
          {activeTab === "plans" ? <PlansTab rows={rows} /> : null}
          {activeTab === "financials" ? <FinancialsTab rows={rows} summary={summary} /> : null}
          {activeTab === "security" ? <SecurityTab /> : null}
        </section>
      </div>
    </main>
  )
}
