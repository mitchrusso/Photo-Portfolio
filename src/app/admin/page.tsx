import { AlertTriangle, BarChart3, Camera, CreditCard, Gauge, HardDrive, Images, LayoutDashboard, Users } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { isAdminSession } from "@/lib/admin-access"
import { getAdminSubscribers } from "@/lib/admin-subscribers"
import { formatAccountBytes } from "@/lib/subscriber-account"

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

function percentTone(value: number) {
  if (value >= 100) return "bg-red-600"
  if (value >= 90) return "bg-[#d8a84f]"
  return "bg-[#1a211b]"
}

function statusTone(status: string) {
  if (status === "ACTIVE") return "text-emerald-700"
  if (status === "TRIALING") return "text-[#9a6a16]"
  if (["PAST_DUE", "UNPAID"].includes(status)) return "text-red-700"
  if (status === "CANCELED") return "text-[#777064]"
  return "text-[#6b6257]"
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

export default async function SuperAdminPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (!isAdminSession(session)) {
    redirect("/account")
  }

  const { rows, summary } = await getAdminSubscribers()
  const conversionRate = summary.total > 0 ? Math.round((summary.stripeConnected / summary.total) * 100) : 0
  const attentionRows = rows
    .filter((row) =>
      row.storagePercent >= 90 ||
      row.bandwidthPercent >= 90 ||
      ["PAST_DUE", "UNPAID", "CANCELED"].includes(row.status) ||
      row.cancelAtPeriodEnd,
    )
    .slice(0, 6)
  const recentRows = [...rows]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

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
              Monitor subscriber growth, recurring revenue, billing setup, portfolio volume, storage, bandwidth, and accounts that need attention.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="inline-flex h-11 items-center gap-2 rounded-md border border-[#d7cec0] bg-white px-4 text-sm font-semibold" href="/admin/subscribers">
              <Users className="size-4" />
              Subscribers
            </Link>
            <Link className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white" href="/dashboard">
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            detail={`${summary.trialing} trialing, ${summary.active} active, ${summary.canceled} canceled.`}
            icon={Users}
            label="Subscribers"
            value={String(summary.total)}
          />
          <StatCard
            detail={`${money(summary.activeArrCents)} estimated ARR from active subscriptions.`}
            icon={BarChart3}
            label="Active MRR"
            value={money(summary.activeMrrCents)}
          />
          <StatCard
            detail={`${money(summary.trialPipelineArrCents)} annualized if all current trials convert.`}
            icon={CreditCard}
            label="Trial pipeline"
            value={money(summary.trialPipelineMrrCents)}
          />
          <StatCard
            detail={`${summary.stripeConnected} accounts have Stripe customers attached.`}
            icon={Gauge}
            label="Billing setup"
            value={`${conversionRate}%`}
          />
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[#b58835]">Platform usage</p>
                <h2 className="mt-2 text-xl font-semibold">Storage and bandwidth across all subscribers</h2>
              </div>
              <HardDrive className="size-5 text-[#b58835]" />
            </div>
            <div className="mt-6 space-y-6">
              <UsageBand label="Storage" limit={summary.storageLimitBytes} used={summary.storageUsedBytes} />
              <UsageBand label="Monthly bandwidth" limit={summary.bandwidthLimitBytes} used={summary.bandwidthUsedBytes} />
            </div>
          </section>

          <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[#b58835]">Portfolio volume</p>
                <h2 className="mt-2 text-xl font-semibold">Published assets under management</h2>
              </div>
              <Images className="size-5 text-[#b58835]" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-[#eee7dc] bg-[#fbfaf7] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8a8072]">Galleries</p>
                <p className="mt-2 text-2xl font-semibold">{summary.galleryCount}</p>
              </div>
              <div className="rounded-md border border-[#eee7dc] bg-[#fbfaf7] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8a8072]">Photos</p>
                <p className="mt-2 text-2xl font-semibold">{summary.photoCount}</p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {summary.planCounts.map((plan) => (
                <div className="flex items-center justify-between rounded-md border border-[#eee7dc] px-3 py-2 text-sm" key={plan.planSlug}>
                  <span className="font-semibold">{plan.planName}</span>
                  <span className="text-[#6b6257]">{plan.count}</span>
                </div>
              ))}
              {summary.planCounts.length === 0 ? (
                <p className="text-sm text-[#6b6257]">No plan data yet.</p>
              ) : null}
            </div>
          </section>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <section className="rounded-md border border-[#ded6c9] bg-white shadow-sm">
            <div className="border-b border-[#ded6c9] px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[#b58835]">Attention queue</p>
                  <h2 className="mt-1 text-xl font-semibold">Accounts to review</h2>
                </div>
                <AlertTriangle className="size-5 text-[#b58835]" />
              </div>
            </div>
            <div className="divide-y divide-[#eee7dc]">
              {attentionRows.map((row) => (
                <div className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto]" key={row.workspaceId}>
                  <div>
                    <p className="font-semibold">{row.workspaceName}</p>
                    <p className="mt-1 text-xs text-[#6b6257]">{row.ownerEmail}</p>
                  </div>
                  <div className="text-sm sm:text-right">
                    <p className={`font-semibold ${statusTone(row.status)}`}>{row.status.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-[#6b6257]">
                      Storage {row.storagePercent}% · Bandwidth {row.bandwidthPercent}%
                    </p>
                  </div>
                </div>
              ))}
              {attentionRows.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#6b6257]">No accounts need attention right now.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-md border border-[#ded6c9] bg-white shadow-sm">
            <div className="border-b border-[#ded6c9] px-5 py-4">
              <p className="text-sm uppercase tracking-[0.18em] text-[#b58835]">Recent subscribers</p>
              <h2 className="mt-1 text-xl font-semibold">Newest workspaces</h2>
            </div>
            <div className="divide-y divide-[#eee7dc]">
              {recentRows.map((row) => (
                <div className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto]" key={row.workspaceId}>
                  <div>
                    <p className="font-semibold">{row.workspaceName}</p>
                    <p className="mt-1 text-xs text-[#6b6257]">{row.planName} · {row.ownerEmail}</p>
                  </div>
                  <div className="text-sm sm:text-right">
                    <p className={`font-semibold ${statusTone(row.status)}`}>{row.status.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-[#6b6257]">{formatDate(row.createdAt)}</p>
                  </div>
                </div>
              ))}
              {recentRows.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#6b6257]">No subscriber records yet.</p>
              ) : null}
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
