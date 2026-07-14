import type { ReactNode } from "react"

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"

  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 2)} ${units[index]}`
}

export function formatAccountDate(value?: string | null) {
  if (!value) return "Not scheduled"

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export function formatAccountStatus(status: string, cancelAtPeriodEnd: boolean) {
  if (cancelAtPeriodEnd) return "Canceling at period end"

  const statusLabels: Record<string, string> = {
    ACTIVE: "Active",
    CANCELED: "Canceled",
    INCOMPLETE: "Incomplete",
    PAST_DUE: "Past due",
    TRIALING: "Trialing",
  }

  return statusLabels[status] ?? status.replaceAll("_", " ").toLowerCase()
}

export function AccountUsageMeter({
  label,
  limit,
  mutedTextClass,
  percent,
  used,
}: {
  label: string
  limit: number
  mutedTextClass: string
  percent: number
  used: number
}) {
  return (
    <div className="rounded-md border border-[#e5ded2] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <span className="rounded-full bg-[#fff8e8] px-2.5 py-1 text-xs font-semibold text-[#735223]">
          {Math.min(percent, 100)}%
        </span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-black/10">
        <div className="h-full rounded-full bg-[#d8a84f]" style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <p className={`mt-2 text-xs ${mutedTextClass}`}>
        {formatBytes(used)} used of {formatBytes(limit)}
      </p>
    </div>
  )
}

export function AccountPortalButton({
  children,
  flow,
  icon,
  primary = false,
}: {
  children: ReactNode
  flow?: "payment_method_update"
  icon: ReactNode
  primary?: boolean
}) {
  return (
    <form action="/api/stripe/customer-portal" method="post">
      {flow ? <input name="flow" type="hidden" value={flow} /> : null}
      <button
        className={`flex h-10 w-full items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold ${
          primary
            ? "border-[#1f2a24] bg-[#1f2a24] text-white"
            : "border-[#d7d0c4] bg-white text-[#1e211d]"
        }`}
        type="submit"
      >
        {icon}
        {children}
      </button>
    </form>
  )
}


