import { Camera } from "lucide-react"
import Link from "next/link"

const legalLinks = [
  ["Articles", "/articles"],
  ["Portfolio Comparison", "/portfolio-comparison"],
  ["Terms", "/terms"],
  ["License", "/license"],
  ["Privacy", "/privacy"],
  ["Copyright", "/copyright"],
] as const

export function SiteFooter() {
  return (
    <footer className="border-t border-[#d9ddd8] bg-[#f1f7f4] px-6 py-8 text-[#5f594f] md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-[#d8a84f] text-black">
            <Camera className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-[#1f211e]">PhotoView.io</p>
            <p className="text-sm">Copyright © 2026 PhotoView.io. All rights reserved.</p>
          </div>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-4 text-sm">
          {legalLinks.map(([label, href]) => (
            <Link className="hover:text-[#1f211e]" href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
