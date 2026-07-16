import { AlertTriangle, ArrowUpRight, Camera, CreditCard, HardDrive, LayoutDashboard, Zap } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { OverageSettingsForm } from "@/components/account/overage-settings-form"
import { accountFilePolicy } from "@/lib/account-policy"
import { formatMonthlyPlanPrice, formatPlanPrice, formatPlanStorage, subscriberPlans } from "@/lib/plans"
import { formatAccountBytes, getSubscriberAccountSummary } from "@/lib/subscriber-account"

type AccountPageProps = {
  searchParams?: Promise<{
    billing?: string
  }>
}

const billingMessages: Record<string, string> = {
  "account-missing": "We could not find a complete account record for this login.",
  "already-connected": "Billing is already connected. Use Manage billing to update payment details or cancel.",
  "cancel-error": "Stripe could not schedule trial cancellation. Try again or use Manage billing.",
  "checkout-canceled": "Stripe checkout was canceled. Your local trial remains active, but no billing method is connected.",
  "checkout-error": "Stripe did not return a checkout URL. Please try again.",
  "checkout-started": "Stripe checkout finished. It can take a few seconds for Stripe to send the subscription update.",
  "missing-customer": "Billing management becomes available after the subscriber completes Stripe checkout and Stripe creates a customer record.",
  "missing-subscription": "Stripe has not returned a subscription id for this account yet. Please try again in a moment.",
  "not-trialing": "This account is no longer in a trial state.",
  "payment-method-updated": "Your replacement payment method is now saved securely in Stripe.",
  "portal-error": "Stripe billing management is not available yet. Check the Customer Portal configuration in Stripe, then try again.",
  "stripe-not-configured": "Stripe checkout is not fully configured for this plan yet.",
  "trial-cancel-scheduled": "Your trial is scheduled to end before paid billing starts. You can keep using PhotoView.io until the trial period ends.",
  "use-portal-for-plan": "Billing is already connected. Use Stripe billing management to change plans, update payment details, or cancel.",
  "use-portal-to-cancel": "This account already has Stripe billing. Use Manage billing to cancel before the trial converts.",
}

function formatDate(value: string | null) {
  if (!value) return "Not set"
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value))
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase()
}

function formatBillingCycle(value: "MONTHLY" | "ANNUAL" | null) {
  if (value === "MONTHLY") return "Monthly"
  if (value === "ANNUAL") return "Annual"
  return "Not set"
}

function getNextBillingLabel(status: string, currentPeriodEnd: string | null, trialEndsAt: string | null) {
  if (status === "TRIALING") return trialEndsAt ? `First bill after ${formatDate(trialEndsAt)}` : "Trial end not set"
  if (status === "CANCELED") return "Canceled"
  return currentPeriodEnd ? formatDate(currentPeriodEnd) : "Not set"
}

function AccountMetricCard({
  detail,
  label,
  tone = "neutral",
  value,
}: {
  detail?: string
  label: string
  tone?: "neutral" | "good" | "warn"
  value: string
}) {
  const toneClass = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-800",
    neutral: "border-[#ded6c9] bg-white text-[#1d1d1b]",
    warn: "border-[#e0bd69] bg-[#fff8e8] text-[#7a5715]",
  }[tone]

  return (
    <div className={`rounded-md border p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.18em] opacity-75">{label}</p>
      <p className="mt-2 text-lg font-semibold capitalize">{value}</p>
      {detail ? <p className="mt-2 text-xs leading-5 opacity-75">{detail}</p> : null}
    </div>
  )
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
  assignedStorageLimitBytes,
  billingCycle,
  currentPlanSlug,
  hasStripeCustomer,
  plan,
}: {
  assignedStorageLimitBytes: number
  billingCycle: "monthly" | "annual"
  currentPlanSlug: string
  hasStripeCustomer: boolean
  plan: typeof subscriberPlans[number]
}) {
  const isCurrentPlan = plan.slug === currentPlanSlug
  const hasCustomStorage = isCurrentPlan && assignedStorageLimitBytes !== plan.storageLimitBytes

  return (
    <div className={`flex h-full flex-col rounded-md border p-4 ${isCurrentPlan ? "border-[#d8a84f] bg-[#fff8e8]" : "border-[#ded6c9] bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{plan.name}</p>
          <p className="mt-1 text-xs leading-5 text-[#6b6257]">
            {hasCustomStorage
              ? `${formatPlanStorage(assignedStorageLimitBytes)} assigned to your account`
              : `${formatPlanStorage(plan.storageLimitBytes)} storage`}
          </p>
        </div>
        {isCurrentPlan ? (
          <span className="rounded-full bg-[#1a211b] px-2.5 py-1 text-xs font-semibold text-white">
            {formatPlanStorage(assignedStorageLimitBytes)} storage
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-2xl font-semibold">
        {billingCycle === "monthly" ? formatMonthlyPlanPrice(plan) : formatPlanPrice(plan)}
      </p>
      <p className="mt-1 text-xs text-[#8a8072]">
        {billingCycle === "annual" ? "Annual includes two months free." : `Annual option: ${formatPlanPrice(plan)}`}
      </p>
      {hasStripeCustomer ? (
        <form action="/api/stripe/customer-portal" className="mt-auto pt-4" method="post">
          <button className="inline-flex h-10 w-full items-center justify-center rounded-md border border-[#d7cec0] bg-white px-3 text-sm font-semibold" type="submit">
            {isCurrentPlan ? "Manage plan" : "Change in Stripe"}
          </button>
        </form>
      ) : (
        <form action="/api/stripe/account-checkout" className="mt-auto pt-4" method="post">
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
            We could not find a subscriber workspace for this login yet. Complete registration or sign in with the email used for your trial.
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
  const billingMessage = params?.billing ? billingMessages[params.billing] : null

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-5 py-8 text-[#1d1d1b] md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-[#ded6c9] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link className="inline-flex items-center gap-3" href="/">
              <span className="flex size-10 items-center justify-center rounded-md bg-[#d8a84f] text-black">
                <Camera className="size-5" />
              </span>
              <span className="font-semibold">PhotoView.io</span>
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

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <AccountMetricCard
            detail={`${formatPlanStorage(account.storageLimitBytes)} storage`}
            label="Current plan"
            value={account.planName}
          />
          <AccountMetricCard
            detail={`Billing cycle: ${formatBillingCycle(account.billingCycle)}`}
            label="Account status"
            tone={account.status === "PAST_DUE" || account.status === "UNPAID" || account.status === "INCOMPLETE" ? "warn" : "neutral"}
            value={formatStatus(account.status)}
          />
          <AccountMetricCard
            detail={account.currentPeriodStart ? `Current period started ${formatDate(account.currentPeriodStart)}` : "Stripe updates this after checkout/webhook completion."}
            label="Next billing date"
            value={getNextBillingLabel(account.status, account.currentPeriodEnd, account.trialEndsAt)}
          />
        </section>

        <section className="mt-6 max-w-3xl">
          <UsageMeter
            detail="Originals, generated display files, thumbnails, and retained hidden photos count toward storage."
            icon={HardDrive}
            label="Storage"
            limit={account.storageLimitBytes}
            percent={account.storagePercent}
            used={account.storageUsedBytes}
          />
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <OverageSettingsForm
            autoRolloverEnabled={account.autoRolloverEnabled}
            overagePolicy={account.overagePolicy}
            referral={account.referral}
          />

          <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.18em] text-[#b58835]">Billing controls</p>
            <h2 className="mt-2 text-xl font-semibold">Upgrade, connect billing, or cancel access.</h2>
            <div className="mt-5 space-y-3 text-sm leading-6 text-[#6b6257]">
              <p>
                If auto-rollover is off, PhotoView.io will use email alerts and account notices before paid capacity changes. You can change plans manually at any time.
              </p>
              <p>
                {hasStripeCustomer
                  ? "Use Stripe billing management to update payment details, review invoices, change plans, or cancel before the trial converts. PhotoView.io never stores full card numbers."
                  : "Finish billing setup to add a payment method. If this is a coupon/free trial account, you can also end trial access without entering a card."}
              </p>
            </div>
            <div className="mt-5 grid gap-3">
              {hasStripeCustomer ? (
                <>
                  <form action="/api/stripe/customer-portal" method="post">
                    <input name="flow" type="hidden" value="payment_method_update" />
                    <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white" type="submit">
                      <CreditCard className="size-4" />
                      Replace payment card
                    </button>
                  </form>
                  <form action="/api/stripe/customer-portal" method="post">
                    <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#d7cec0] bg-white px-4 text-sm font-semibold" type="submit">
                      <ArrowUpRight className="size-4" />
                      Manage plan and invoices
                    </button>
                  </form>
                  {account.status === "TRIALING" ? (
                    <form action="/api/stripe/cancel-trial" method="post">
                      <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-800" type="submit">
                        Cancel before paid billing starts
                      </button>
                    </form>
                  ) : null}
                </>
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
                Request more than 100 GB
              </Link>
            </div>
            <div className="mt-5 rounded-md border border-[#eee7dc] bg-[#fbfaf7] p-4">
              <h3 className="text-sm font-semibold">What happens if billing stops?</h3>
              <div className="mt-3 grid gap-2 text-xs leading-5 text-[#6b6257]">
                {accountFilePolicy.slice(1, 5).map((item) => (
                  <p key={item.title}>
                    <span className="font-semibold text-[#1d1d1b]">{item.title}:</span> {item.body}
                  </p>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                <Link className="inline-flex text-xs font-semibold text-[#1d2b22] underline decoration-[#d8a84f] underline-offset-4 hover:text-[#9c6f1d]" href="/terms">
                  Terms and file policy
                </Link>
                <Link className="inline-flex text-xs font-semibold text-[#1d2b22] underline decoration-[#d8a84f] underline-offset-4 hover:text-[#9c6f1d]" href="/license">
                  Subscriber License Agreement
                </Link>
              </div>
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
            <div className="grid min-w-36 grid-cols-1 rounded-md border border-[#ded6c9] bg-[#fbfaf7] p-1 text-sm font-semibold sm:grid-cols-2 md:grid-cols-1">
              <span className={`inline-flex h-9 items-center justify-center rounded px-3 text-center ${accountBillingCycle === "monthly" ? "bg-[#1a211b] text-white" : "text-[#6b6257]"}`}>Monthly</span>
              <span className={`inline-flex h-9 items-center justify-center rounded px-3 text-center ${accountBillingCycle === "annual" ? "bg-[#1a211b] text-white" : "text-[#6b6257]"}`}>Annual</span>
            </div>
          </div>
          <div className="mt-5 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
            {subscriberPlans.map((plan) => (
              <PlanActionCard
                assignedStorageLimitBytes={account.storageLimitBytes}
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
