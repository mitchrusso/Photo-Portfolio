"use client"

import type { MouseEvent, ReactNode } from "react"
import Link from "next/link"

const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const

export function AttributedTrialLink({
  analyticsLabel,
  campaign,
  children,
  className,
}: {
  analyticsLabel: string
  campaign: string
  children: ReactNode
  className: string
}) {
  const fallbackHref = `/register?plan=starter&utm_source=seo&utm_medium=landing_page&utm_campaign=${encodeURIComponent(campaign)}`

  function continueWithAttribution(event: MouseEvent<HTMLAnchorElement>) {
    const current = new URLSearchParams(window.location.search)
    const destination = new URL(fallbackHref, window.location.origin)
    for (const key of utmKeys) {
      const value = current.get(key)?.trim()
      if (value) destination.searchParams.set(key, value.slice(0, 120))
    }
    event.preventDefault()
    window.location.assign(`${destination.pathname}${destination.search}`)
  }

  return (
    <Link
      className={className}
      data-analytics-event="SIGNUP_CLICK"
      data-analytics-label={analyticsLabel}
      href={fallbackHref}
      onClick={continueWithAttribution}
    >
      {children}
    </Link>
  )
}
