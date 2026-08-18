"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

const AskAiHelp = dynamic(
  () => import("@/components/ai/ask-ai-help").then((module) => module.AskAiHelp),
  { ssr: false },
)

const navItems = [
  ["Features", "/#features"],
  ["Templates", "/#templates"],
  ["Workflow", "/#workflow"],
  ["Sharing", "/#sharing"],
  ["Help Center", "/tutorials"],
  ["Articles & Tutorials", "/articles"],
  ["Pricing", "/#pricing"],
] as const

export function SiteHeader() {
  const [isSubscriber, setIsSubscriber] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    const checkSession = () => {
      fetch("/api/auth/session", { signal: controller.signal })
        .then((response) => response.ok ? response.json() : null)
        .then((session: { user?: unknown } | null) => setIsSubscriber(Boolean(session?.user)))
        .catch(() => undefined)
    }

    const idleWindow = window as unknown as {
      cancelIdleCallback?: (id: number) => void
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
    }

    if (idleWindow.requestIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(checkSession, { timeout: 2500 })
      return () => {
        controller.abort()
        idleWindow.cancelIdleCallback?.(idleId)
      }
    }

    const timeoutId = setTimeout(checkSession, 1500)
    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-[#d9ddd8] bg-[#f7f8f5]/92 px-5 py-4 text-[#1f211e] backdrop-blur md:px-10">
      <div className="flex items-center justify-between gap-5">
        <Link aria-label="PhotoView.io home" className="shrink-0" href="/">
          <Image
            alt="PhotoView.io"
            className="h-auto w-[138px] sm:w-[172px]"
            height={153}
            priority
            src="/brand/photoview-logo-horizontal-transparent-small.webp"
            width={700}
          />
        </Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-5 text-sm text-[#6f685d] lg:flex">
          {navItems.map(([label, href]) => (
            <Link
              className="hover:text-[#1f211e]"
              data-analytics-event={href === "/#pricing" ? "PRICING_CLICK" : undefined}
              data-analytics-label={label}
              href={href}
              key={href}
            >
              {label.replace("&apos;", "'")}
            </Link>
          ))}
          {isSubscriber && (
            <AskAiHelp buttonClassName="inline-flex h-10 items-center gap-2 rounded-md border border-[#d7cec0] bg-white px-3 text-sm font-semibold text-[#1f211e] hover:bg-[#f1ece3]" />
          )}
          <Link
            className="rounded-md bg-[#1d2b22] px-3 py-2 font-semibold text-white hover:bg-[#26382d]"
            data-analytics-event="SIGNUP_CLICK"
            data-analytics-label="Header start free trial"
            href="/register"
          >
            Start free trial
          </Link>
          <Link
            className="rounded-md border border-[#d7cec0] px-3 py-2 text-[#1f211e] hover:bg-[#f1ece3]"
            href={isSubscriber ? "/account" : "/login"}
          >
            {isSubscriber ? "Account" : "Login"}
          </Link>
        </nav>
        <nav aria-label="Mobile navigation" className="flex shrink-0 items-center gap-2 text-sm lg:hidden">
          <Link
            className="inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-md bg-[#1d2b22] px-2.5 font-semibold text-white hover:bg-[#26382d]"
            data-analytics-event="SIGNUP_CLICK"
            data-analytics-label="Mobile header start free trial"
            href="/register"
          >
            Start trial
          </Link>
          <Link
            className="inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-md border border-[#d7cec0] px-2.5 text-[#1f211e] hover:bg-[#f1ece3]"
            href={isSubscriber ? "/account" : "/login"}
          >
            {isSubscriber ? "Account" : "Login"}
          </Link>
        </nav>
      </div>
    </header>
  )
}
