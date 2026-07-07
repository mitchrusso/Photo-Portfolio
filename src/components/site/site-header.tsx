"use client"

import { Camera } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"

const navItems = [
  ["Features", "/#features"],
  ["Product", "/#product"],
  ["Workflow", "/#workflow"],
  ["Pricing", "/#pricing"],
  ["Demo", "/portfolio"],
] as const

export function SiteHeader() {
  const { status } = useSession()
  const isSubscriber = status === "authenticated"

  return (
    <header className="sticky top-0 z-40 border-b border-[#ded8cc] bg-[#fbfaf7]/92 px-5 py-4 text-[#1f211e] backdrop-blur md:px-10">
      <div className="flex items-center justify-between gap-5">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex size-9 items-center justify-center rounded-md bg-[#d8a84f] text-black">
            <Camera className="size-5" />
          </span>
          <span className="font-semibold">PhotoViewPro</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-[#6f685d] lg:flex">
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
      </div>
    </header>
  )
}
