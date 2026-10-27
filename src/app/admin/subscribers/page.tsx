import { AlertTriangle, Camera, CreditCard, Gauge, Users } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { LogoutButton } from "@/components/auth/logout-button"
import { isAdminSession } from "@/lib/admin-access"
import { hasValidSuperAdminMfa } from "@/lib/admin-mfa"
import {
  adminSubscriberNeedsAttention,
  getAdminSubscribers,
  isInternalAdminSubscriber,
} from "@/lib/admin-subscribers"
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

function storageReplyHref(row: { ownerEmail: string; ownerName: string; storageRequested: string | null }) {
  const subject = "Your PhotoView.io storage question"
  const body = `Hi ${row.ownerName},\n\nThank you for your storage note:\n\n“${row.storageRequested ?? ""}”\n\n`
  return `mailto:${row.ownerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function MetricCard({
  description,
  href,
  icon: Icon,
  label,
  value,
}: {
  description: string
  href: string
  icon: typeof Users
  label: string
  value: number | string
}) {
  return (
    <Link className="group rounded-md border border-[#ded6c9] bg-white p-4 shadow-sm transition hover:border-[#b58835] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#d8a84f]" href={href}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8a8072]">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-[#1d1d1b]">{value}</p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-md bg-[#f2eee7] text-[#1a211b]">
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#6b6257]">{description}</p>
      <span className="mt-2 inline-flex text-xs font-semibold text-[#1d2b22] underline decoration-[#d8a84f] underline-offset-4">View these accounts</span>
    </Link>
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

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (!isAdminSession(session)) {
    redirect("/account")
  }

  if (!(await hasValidSuperAdminMfa(session))) {
    redirect("/admin/verify?next=%2Fadmin%2Fsubscribers")
  }

  const { rows } = await getAdminSubscribers()
  const filter = (await searchParams)?.filter ?? "all"
  const customerRows = rows.filter((row) => !isInternalAdminSubscriber(row))
  const canceledRows = customerRows.filter((row) => row.status === "CANCELED")
  const currentRows = customerRows.filter((row) => row.status !== "CANCELED")
  const pastDueRows = currentRows.filter((row) => ["PAST_DUE", "UNPAID"].includes(row.status))
  const attentionRows = currentRows.filter(adminSubscriberNeedsAttention)
  const visibleRows = filter === "trialing"
    ? currentRows.filter((row) => row.status === "TRIALING")
    : filter === "active"
      ? currentRows.filter((row) => row.status === "ACTIVE")
      : filter === "stripe"
        ? currentRows.filter((row) => row.stripeConnected)
        : filter === "past-due"
          ? pastDueRows
          : filter === "attention"
            ? attentionRows
            : currentRows
  const filterLabels: Record<string, string> = {
    active: "Active subscribers",
    attention: "Accounts needing attention",
    "past-due": "Past-due accounts",
    stripe: "Stripe-connected subscribers",
    trialing: "Trialing subscribers",
  }

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
            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-[#b58835]">Admin</p>
            <h1 className="mt-2 text-4xl font-semibold">Subscriber operations</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b6257]">
              Track trials, Stripe connection, billing risk, storage, and portfolio footprint from one place.
            </p>
            <p className="mt-3 text-sm text-[#6b6257]">
              <span className="font-semibold text-[#1d1d1b]">Signed in as</span> {session.user.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="inline-flex h-11 items-center gap-2 rounded-md border border-[#d7cec0] bg-white px-4 text-sm font-semibold" href="/admin">
              <Gauge className="size-4" />
              Overview
            </Link>
            <LogoutButton className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white" />
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard description="Current customer accounts, excluding canceled and internal/test workspaces." href="/admin/subscribers#subscriber-list" icon={Users} label="Subscribers" value={currentRows.length} />
          <MetricCard description="Customers currently inside their trial period." href="/admin/subscribers?filter=trialing#subscriber-list" icon={Gauge} label="Trialing" value={currentRows.filter((row) => row.status === "TRIALING").length} />
          <MetricCard description="Paid subscriptions currently marked active by Stripe." href="/admin/subscribers?filter=active#subscriber-list" icon={CreditCard} label="Active" value={currentRows.filter((row) => row.status === "ACTIVE").length} />
          <MetricCard description="Accounts with a Stripe customer record connected." href="/admin/subscribers?filter=stripe#subscriber-list" icon={CreditCard} label="Stripe connected" value={currentRows.filter((row) => row.stripeConnected).length} />
          <MetricCard description="Stripe could not collect payment or the subscription remains unpaid." href="/admin/subscribers?filter=past-due#subscriber-list" icon={AlertTriangle} label="Past due" value={pastDueRows.length} />
          <MetricCard description="Checkout incomplete, past due, storage at 90%+, or cancellation scheduled." href="/admin/subscribers?filter=attention#subscriber-list" icon={AlertTriangle} label="Needs attention" value={attentionRows.length} />
        </section>

        <section className="mt-6 overflow-hidden rounded-md border border-[#ded6c9] bg-white shadow-sm" id="subscriber-list">
          <div className="border-b border-[#ded6c9] px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{filterLabels[filter] ?? "Current subscriber list"}</h2>
              {filter !== "all" ? <Link className="text-sm font-semibold underline decoration-[#d8a84f] underline-offset-4" href="/admin/subscribers#subscriber-list">Clear filter</Link> : null}
            </div>
            <p className="mt-1 text-sm text-[#6b6257]">
              Canceled, Mitch-owned, and PhotoView test accounts are excluded. Storage is measured against each account&apos;s current capacity.
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
                {visibleRows.map((row) => (
                  <tr className="border-t border-[#eee7dc]" key={row.workspaceId}>
                    <td className="px-5 py-4 align-top">
                      <p className="font-semibold text-[#1d1d1b]">{row.workspaceName}</p>
                      <p className="mt-1 text-xs text-[#6b6257]">{row.ownerName}</p>
                      <p className="mt-1 text-xs text-[#8a8072]">{row.ownerEmail}</p>
                      {row.storageRequested ? (
                        <div className="mt-3 max-w-72 rounded border border-[#e0bd69] bg-[#fff8e8] p-3 text-xs leading-5 text-[#6b6257]">
                          <p className="font-semibold text-[#7a5715]">Storage note</p>
                          <p className="mt-1 whitespace-pre-wrap">{row.storageRequested}</p>
                          <a className="mt-2 inline-flex font-semibold text-[#1d2b22] underline decoration-[#d8a84f] underline-offset-4" href={storageReplyHref(row)}>
                            Reply by email
                          </a>
                        </div>
                      ) : null}
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
                {visibleRows.length === 0 ? (
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

        <details className="mt-6 overflow-hidden rounded-md border border-[#ded6c9] bg-white shadow-sm">
          <summary className="cursor-pointer px-5 py-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#d8a84f]">
            Canceled subscribers ({canceledRows.length})
          </summary>
          <div className="border-t border-[#ded6c9] px-5 py-4">
            <p className="text-sm leading-6 text-[#6b6257]">Archived from the current subscriber list. Expand this section only when cancellation history needs review.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-[#fbfaf7] text-xs uppercase tracking-[0.14em] text-[#8a8072]"><tr><th className="px-4 py-3">Subscriber</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Last period</th></tr></thead>
                <tbody>
                  {canceledRows.map((row) => <tr className="border-t border-[#eee7dc]" key={row.workspaceId}><td className="px-4 py-3"><p className="font-semibold">{row.ownerName}</p><p className="mt-1 text-xs text-[#6b6257]">{row.ownerEmail}</p></td><td className="px-4 py-3">{row.planName}</td><td className="px-4 py-3">Canceled</td><td className="px-4 py-3">{formatDate(row.currentPeriodEnd)}</td></tr>)}
                  {canceledRows.length === 0 ? <tr><td className="px-4 py-5 text-[#6b6257]" colSpan={4}>No canceled subscribers.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </div>
    </main>
  )
}
