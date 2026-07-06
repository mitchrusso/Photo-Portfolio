import { AlertTriangle, ArrowUpRight, Camera, CreditCard, Gauge, HardDrive, LayoutDashboard, Zap } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { OverageSettingsForm } from "@/components/account/overage-settings-form"
import { formatAccountBytes, getSubscriberAccountSummary } from "@/lib/subscriber-account"

type AccountPageProps = {
  searchParams?: Promise<{
    billing?: string
  }>
}

function formatDate(value: string | null) {
  if (!value) return "Not set"
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value))
}

function meterTone(percent: number) {
  if (percent >= 100) return "bg-red-600"
  if (percent >= 90) return "bg-[#d8a84f]"
  return "bg-[#1a211b]"
}

function UsageMeter({
  detail,
  icon: Icon,
  label,
  limit,
  percent,
  used,
}: {
  detail: string
  icon: typeof HardDrive
  label: string
  limit: number
  percent: number
  used: number
}) {
  return (
    <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[#b58835]">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-[#1d1d1b]">{percent}%</p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-md bg-[#f2eee7] text-[#1a211b]">
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-5 h-2 rounded-full bg-[#ece5d9]">
        <div className={`h-full rounded-full ${meterTone(percent)}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <p className="mt-3 text-sm text-[#6b6257]">
        {formatAccountBytes(used)} used of {formatAccountBytes(limit)}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#8a8072]">{detail}</p>
      {percent >= 90 ? (
        <p className="mt-3 flex items-center gap-2 rounded-md border border-[#e0bd69] bg-[#fff8e8] px-3 py-2 text-xs font-semibold text-[#7a5715]">
          <AlertTriangle className="size-4" />
          {percent >= 100 ? "Limit reached" : "Approaching limit"}
        </p>
      ) : null}
    </section>
  )
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const session = await auth()
  const params = await searchParams

  if (!session?.user) {
    redirect("/login")
  }

  const account = await getSubscriberAccountSummary(session.user.workspaceId)

  if (!account) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] px-5 py-8 text-[#1d1d1b] md:px-10">
        <div className="mx-auto max-w-3xl rounded-md border border-[#ded6c9] bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Account not ready yet</h1>
          <p className="mt-3 text-sm leading-6 text-[#6b6257]">
            We could not find a subscriber account for this login. Complete registration or sign in with the email used for your trial.
          </p>
          <Link className="mt-5 inline-flex h-11 items-center rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white" href="/register">
            Start registration
          </Link>
        </div>
      </main>
    )
  }

  const nextPlanHref = account.nextPlanSlug ? `/register?plan=${account.nextPlanSlug}` : "/storage-contact"

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-5 py-8 text-[#1d1d1b] md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-[#ded6c9] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link className="inline-flex items-center gap-3" href="/">
              <span className="flex size-10 items-center justify-center rounded-md bg-[#d8a84f] text-black">
                <Camera className="size-5" />
              </span>
              <span className="font-semibold">PhotoViewPro</span>
            </Link>
            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-[#b58835]">Subscriber account</p>
            <h1 className="mt-2 text-4xl font-semibold">{account.workspaceName}</h1>
            <p className="mt-2 text-sm text-[#6b6257]">
              Manage plan status, usage, billing paths, and automatic rollover preferences.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="inline-flex h-11 items-center gap-2 rounded-md border border-[#d7cec0] bg-white px-4 text-sm font-semibold" href="/dashboard">
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
            <form action="/api/stripe/customer-portal" method="post">
              <button className="inline-flex h-11 items-center gap-2 rounded-md border border-[#d7cec0] bg-white px-4 text-sm font-semibold" type="submit">
                <CreditCard className="size-4" />
                Manage billing
              </button>
            </form>
            <Link className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white" href={nextPlanHref}>
              <ArrowUpRight className="size-4" />
              Upgrade
            </Link>
          </div>
        </header>

        {params?.billing ? (
          <section className="mt-5 rounded-md border border-[#e0bd69] bg-[#fff8e8] px-4 py-3 text-sm leading-6 text-[#7a5715]">
            {params.billing === "missing-customer"
              ? "Billing management becomes available after the subscriber completes Stripe checkout and Stripe creates a customer record."
              : "Stripe billing management is not available yet. Check the Customer Portal configuration in Stripe, then try again."}
          </section>
        ) : null}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Plan", account.planName],
            ["Status", account.status.replaceAll("_", " ")],
            ["Billing", account.billingCycle === "MONTHLY" ? "Monthly" : account.billingCycle === "ANNUAL" ? "Annual" : "Not set"],
            ["Renews / trial ends", account.currentPeriodEnd ? formatDate(account.currentPeriodEnd) : formatDate(account.trialEndsAt)],
          ].map(([label, value]) => (
            <div className="rounded-md border border-[#ded6c9] bg-white p-4 shadow-sm" key={label}>
              <p className="text-xs uppercase tracking-[0.18em] text-[#8a8072]">{label}</p>
              <p className="mt-2 text-lg font-semibold capitalize">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <UsageMeter
            detail="Originals, generated display files, thumbnails, and retained hidden photos count toward storage."
            icon={HardDrive}
            label="Storage"
            limit={account.storageLimitBytes}
            percent={account.storagePercent}
            used={account.storageUsedBytes}
          />
          <UsageMeter
            detail={`Monthly public viewing bandwidth. Current period ends ${formatDate(account.bandwidthPeriodEndsAt ?? account.currentPeriodEnd)}.`}
            icon={Gauge}
            label="Bandwidth"
            limit={account.bandwidthLimitBytes}
            percent={account.bandwidthPercent}
            used={account.bandwidthUsedBytes}
          />
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <OverageSettingsForm
            autoRolloverEnabled={account.autoRolloverEnabled}
            overagePolicy={account.overagePolicy}
          />

          <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.18em] text-[#b58835]">Manual upgrade path</p>
            <h2 className="mt-2 text-xl font-semibold">Keep control from your account page.</h2>
            <div className="mt-5 space-y-3 text-sm leading-6 text-[#6b6257]">
              <p>
                If auto-rollover is off, PhotoViewPro will use email alerts and account notices before paid capacity changes. You can upgrade manually at any time.
              </p>
              <p>
                Storage warnings should trigger at 75%, 90%, and 100%. Bandwidth warnings should trigger at 75%, 90%, and monthly limit reached.
              </p>
            </div>
            <div className="mt-5 grid gap-3">
              <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white" href={nextPlanHref}>
                <Zap className="size-4" />
                {account.nextPlanSlug ? "Upgrade to next plan" : "Request custom storage"}
              </Link>
              <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#d7cec0] bg-[#fbfaf7] px-4 text-sm font-semibold" href="/contact">
                <CreditCard className="size-4" />
                Billing help
              </Link>
              <form action="/api/stripe/customer-portal" method="post">
                <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#d7cec0] bg-white px-4 text-sm font-semibold" type="submit">
                  <CreditCard className="size-4" />
                  Manage card, invoices, or cancellation
                </button>
              </form>
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
