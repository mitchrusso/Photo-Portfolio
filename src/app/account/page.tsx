import { AlertTriangle, ArrowUpRight, Camera, CreditCard, Gauge, HardDrive, LayoutDashboard, Zap } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { OverageSettingsForm } from "@/components/account/overage-settings-form"
import { formatMonthlyPlanPrice, formatPlanPrice, formatPlanStorage, subscriberPlans } from "@/lib/plans"
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

function PlanActionCard({
  billingCycle,
  currentPlanSlug,
  hasStripeCustomer,
  plan,
}: {
  billingCycle: "monthly" | "annual"
  currentPlanSlug: string
  hasStripeCustomer: boolean
  plan: typeof subscriberPlans[number]
}) {
  const isCurrentPlan = plan.slug === currentPlanSlug

  return (
    <div className={`rounded-md border p-4 ${isCurrentPlan ? "border-[#d8a84f] bg-[#fff8e8]" : "border-[#ded6c9] bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{plan.name}</p>
          <p className="mt-1 text-xs text-[#6b6257]">{formatPlanStorage(plan.storageLimitBytes)} storage · 10 GB monthly bandwidth</p>
        </div>
        {isCurrentPlan ? (
          <span className="rounded-full bg-[#1a211b] px-2.5 py-1 text-xs font-semibold text-white">Current</span>
        ) : null}
      </div>
      <p className="mt-4 text-2xl font-semibold">
        {billingCycle === "monthly" ? formatMonthlyPlanPrice(plan) : formatPlanPrice(plan)}
      </p>
      <p className="mt-1 text-xs text-[#8a8072]">
        {billingCycle === "annual" ? "Annual includes two months free." : `Annual option: ${formatPlanPrice(plan)}`}
      </p>
      {hasStripeCustomer ? (
        <form action="/api/stripe/customer-portal" className="mt-4" method="post">
          <button className="inline-flex h-10 w-full items-center justify-center rounded-md border border-[#d7cec0] bg-white px-3 text-sm font-semibold" type="submit">
            {isCurrentPlan ? "Manage plan" : "Change in Stripe"}
          </button>
        </form>
      ) : (
        <form action="/api/stripe/account-checkout" className="mt-4" method="post">
          <input name="planSlug" type="hidden" value={plan.slug} />
          <input name="billingCycle" type="hidden" value={billingCycle} />
          <button className={`inline-flex h-10 w-full items-center justify-center rounded-md px-3 text-sm font-semibold ${isCurrentPlan ? "border border-[#d7cec0] bg-white text-[#1d1d1b]" : "bg-[#1a211b] text-white"}`} type="submit">
            {isCurrentPlan ? "Finish billing setup" : `Choose ${plan.name}`}
          </button>
        </form>
      )}
    </div>
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

  const hasStripeCustomer = Boolean(account.stripeCustomerId)
  const accountBillingCycle = account.billingCycle === "MONTHLY" ? "monthly" : "annual"
  const billingMessage =
    params?.billing === "missing-customer"
      ? "Billing management becomes available after the subscriber completes Stripe checkout and Stripe creates a customer record."
      : params?.billing === "portal-error"
        ? "Stripe billing management is not available yet. Check the Customer Portal configuration in Stripe, then try again."
        : params?.billing === "account-missing"
          ? "We could not find a complete account record for this login."
            : params?.billing === "already-connected"
              ? "Billing is already connected. Use Manage billing to update payment details or cancel."
              : params?.billing === "use-portal-for-plan"
                ? "Billing is already connected. Use Stripe billing management to change plans, update payment details, or cancel."
              : params?.billing === "stripe-not-configured"
              ? "Stripe checkout is not fully configured for this plan yet."
              : params?.billing === "checkout-canceled"
                ? "Stripe checkout was canceled. Your local trial remains active, but no billing method is connected."
                : params?.billing === "checkout-started"
                  ? "Stripe checkout finished. It can take a few seconds for Stripe to send the subscription update."
                  : params?.billing === "checkout-error"
                    ? "Stripe did not return a checkout URL. Please try again."
                    : params?.billing === "use-portal-to-cancel"
                      ? "This account already has Stripe billing. Use Manage billing to cancel before the trial converts."
                      : params?.billing === "not-trialing"
                        ? "This account is no longer in a trial state."
                        : null

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
            {hasStripeCustomer ? (
              <form action="/api/stripe/customer-portal" method="post">
                <button className="inline-flex h-11 items-center gap-2 rounded-md border border-[#d7cec0] bg-white px-4 text-sm font-semibold" type="submit">
                  <CreditCard className="size-4" />
                  Manage billing
                </button>
              </form>
            ) : (
              <form action="/api/stripe/account-checkout" method="post">
                <button className="inline-flex h-11 items-center gap-2 rounded-md border border-[#d7cec0] bg-white px-4 text-sm font-semibold" type="submit">
                  <CreditCard className="size-4" />
                  Finish billing setup
                </button>
              </form>
            )}
            <a className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white" href="#plan-controls">
              <ArrowUpRight className="size-4" />
              Plan options
            </a>
          </div>
        </header>

        {billingMessage ? (
          <section className="mt-5 rounded-md border border-[#e0bd69] bg-[#fff8e8] px-4 py-3 text-sm leading-6 text-[#7a5715]">
            {billingMessage}
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
            <p className="text-sm uppercase tracking-[0.18em] text-[#b58835]">Billing controls</p>
            <h2 className="mt-2 text-xl font-semibold">Upgrade, connect billing, or cancel access.</h2>
            <div className="mt-5 space-y-3 text-sm leading-6 text-[#6b6257]">
              <p>
                If auto-rollover is off, PhotoViewPro will use email alerts and account notices before paid capacity changes. You can change plans manually at any time.
              </p>
              <p>
                {hasStripeCustomer
                  ? "Use Stripe billing management to update payment details, review invoices, change plans, or cancel before the trial converts."
                  : "Finish billing setup to add a payment method. If this is a coupon/free trial account, you can also end trial access without entering a card."}
              </p>
            </div>
            <div className="mt-5 grid gap-3">
              {hasStripeCustomer ? (
                <form action="/api/stripe/customer-portal" method="post">
                  <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#d7cec0] bg-white px-4 text-sm font-semibold" type="submit">
                    <CreditCard className="size-4" />
                    Manage card, invoices, or cancel trial
                  </button>
                </form>
              ) : (
                <>
                  <form action="/api/stripe/account-checkout" method="post">
                    <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#d7cec0] bg-white px-4 text-sm font-semibold" type="submit">
                      <CreditCard className="size-4" />
                      Finish billing setup
                    </button>
                  </form>
                  {account.status === "TRIALING" ? (
                    <form action="/api/account/cancel-local-trial" method="post">
                      <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-800" type="submit">
                        End trial access
                      </button>
                    </form>
                  ) : null}
                </>
              )}
              <Link className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#d7cec0] bg-white px-4 text-sm font-semibold" href="/storage-contact">
                <Zap className="size-4" />
                Request more than 10 GB
              </Link>
            </div>
          </section>
        </section>

        <section className="mt-6 rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm" id="plan-controls">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[#b58835]">Plan options</p>
              <h2 className="mt-2 text-xl font-semibold">Choose the plan that matches this portfolio.</h2>
              <p className="mt-2 text-sm leading-6 text-[#6b6257]">
                Existing Stripe subscribers manage plan changes in the Stripe portal. Trial or coupon accounts without Stripe can choose a plan here and continue to checkout.
              </p>
            </div>
            <div className="rounded-md border border-[#ded6c9] bg-[#fbfaf7] p-1 text-sm font-semibold">
              <span className={`inline-flex rounded px-3 py-2 ${accountBillingCycle === "monthly" ? "bg-[#1a211b] text-white" : "text-[#6b6257]"}`}>Monthly</span>
              <span className={`inline-flex rounded px-3 py-2 ${accountBillingCycle === "annual" ? "bg-[#1a211b] text-white" : "text-[#6b6257]"}`}>Annual</span>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {subscriberPlans.map((plan) => (
              <PlanActionCard
                billingCycle={accountBillingCycle}
                currentPlanSlug={account.planSlug}
                hasStripeCustomer={hasStripeCustomer}
                key={plan.slug}
                plan={plan}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
