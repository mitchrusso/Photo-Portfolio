import { AlertTriangle, Camera, CreditCard, Gauge, HardDrive, LayoutDashboard, Users } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { isAdminSession } from "@/lib/admin-access"
import { getAdminSubscribers } from "@/lib/admin-subscribers"
import { formatAccountBytes } from "@/lib/subscriber-account"

function formatDate(value: string | null) {
  if (!value) return "Not set"
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value))
}

function statusTone(status: string) {
  if (status === "ACTIVE") return "bg-emerald-50 text-emerald-800 border-emerald-200"
  if (status === "TRIALING") return "bg-[#fff8e8] text-[#7a5715] border-[#e0bd69]"
  if (["PAST_DUE", "UNPAID"].includes(status)) return "bg-red-50 text-red-800 border-red-200"
  if (status === "CANCELED") return "bg-[#f2eee7] text-[#6b6257] border-[#d7cec0]"
  return "bg-white text-[#6b6257] border-[#d7cec0]"
}

function percentTone(percent: number) {
  if (percent >= 100) return "bg-red-600"
  if (percent >= 90) return "bg-[#d8a84f]"
  return "bg-[#1a211b]"
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: number | string
}) {
  return (
    <section className="rounded-md border border-[#ded6c9] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8a8072]">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-[#1d1d1b]">{value}</p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-md bg-[#f2eee7] text-[#1a211b]">
          <Icon className="size-5" />
        </span>
      </div>
    </section>
  )
}

function MiniMeter({ label, percent }: { label: string; percent: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-[#6b6257]">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-[#ece5d9]">
        <div className={`h-full rounded-full ${percentTone(percent)}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  )
}

export default async function AdminSubscribersPage() {
  const session = await auth()

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
  ).length

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
            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-[#b58835]">Admin</p>
            <h1 className="mt-2 text-4xl font-semibold">Subscriber operations</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b6257]">
              Track trials, Stripe connection, billing risk, storage, bandwidth, and portfolio footprint from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="inline-flex h-11 items-center gap-2 rounded-md border border-[#d7cec0] bg-white px-4 text-sm font-semibold" href="/dashboard">
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
            <Link className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white" href="/account">
              <CreditCard className="size-4" />
              Account
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard icon={Users} label="Subscribers" value={summary.total} />
          <MetricCard icon={Gauge} label="Trialing" value={summary.trialing} />
          <MetricCard icon={CreditCard} label="Active" value={summary.active} />
          <MetricCard icon={CreditCard} label="Stripe connected" value={summary.stripeConnected} />
          <MetricCard icon={AlertTriangle} label="Past due" value={summary.pastDue} />
          <MetricCard icon={AlertTriangle} label="Needs attention" value={attentionRows} />
        </section>

        <section className="mt-6 overflow-hidden rounded-md border border-[#ded6c9] bg-white shadow-sm">
          <div className="border-b border-[#ded6c9] px-5 py-4">
            <h2 className="text-lg font-semibold">Subscriber list</h2>
            <p className="mt-1 text-sm text-[#6b6257]">
              Showing the newest 200 subscriber workspaces. Storage and bandwidth percentages are metered against the current plan limits.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
              <thead className="bg-[#fbfaf7] text-xs uppercase tracking-[0.14em] text-[#8a8072]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Subscriber</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Plan</th>
                  <th className="px-5 py-3 font-semibold">Billing</th>
                  <th className="px-5 py-3 font-semibold">Usage</th>
                  <th className="px-5 py-3 font-semibold">Portfolio</th>
                  <th className="px-5 py-3 font-semibold">Renewal / Trial</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr className="border-t border-[#eee7dc]" key={row.workspaceId}>
                    <td className="px-5 py-4 align-top">
                      <p className="font-semibold text-[#1d1d1b]">{row.workspaceName}</p>
                      <p className="mt-1 text-xs text-[#6b6257]">{row.ownerName}</p>
                      <p className="mt-1 text-xs text-[#8a8072]">{row.ownerEmail}</p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(row.status)}`}>
                        {row.status.replaceAll("_", " ")}
                      </span>
                      {row.cancelAtPeriodEnd ? (
                        <p className="mt-2 text-xs font-semibold text-red-700">Canceling at period end</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="font-semibold">{row.planName}</p>
                      <p className="mt-1 text-xs text-[#6b6257]">{row.billingCycle === "MONTHLY" ? "Monthly" : row.billingCycle === "ANNUAL" ? "Annual" : "Billing not set"}</p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className={row.stripeConnected ? "font-semibold text-emerald-700" : "font-semibold text-[#7a5715]"}>
                        {row.stripeConnected ? "Stripe connected" : "Checkout incomplete"}
                      </p>
                      <p className="mt-1 text-xs text-[#6b6257]">
                        {row.autoRolloverEnabled ? "Auto-rollover on" : "Manual overage control"}
                      </p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="w-56 space-y-3">
                        <MiniMeter label="Storage" percent={row.storagePercent} />
                        <p className="text-xs text-[#8a8072]">
                          {formatAccountBytes(row.storageUsedBytes)} / {formatAccountBytes(row.storageLimitBytes)}
                        </p>
                        <MiniMeter label="Bandwidth" percent={row.bandwidthPercent} />
                        <p className="text-xs text-[#8a8072]">
                          {formatAccountBytes(row.bandwidthUsedBytes)} / {formatAccountBytes(row.bandwidthLimitBytes)}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="font-semibold">{row.galleryCount} galleries</p>
                      <p className="mt-1 text-xs text-[#6b6257]">{row.photoCount} photos</p>
                      <p className="mt-1 text-xs text-[#8a8072]">{row.clientCount} clients</p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="font-semibold">{formatDate(row.currentPeriodEnd ?? row.trialEndsAt)}</p>
                      <p className="mt-1 text-xs text-[#6b6257]">/{row.workspaceSlug}</p>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td className="px-5 py-8 text-center text-sm text-[#6b6257]" colSpan={7}>
                      No subscriber records yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5 flex items-start gap-3 rounded-md border border-[#ded6c9] bg-white px-4 py-3 text-sm leading-6 text-[#6b6257] shadow-sm">
          <HardDrive className="mt-0.5 size-4 shrink-0 text-[#b58835]" />
          The full Stripe checkout/webhook test is intentionally deferred. Run it with a Stripe test card when you are ready to create and inspect a sandbox subscription end to end.
        </section>
      </div>
    </main>
  )
}
