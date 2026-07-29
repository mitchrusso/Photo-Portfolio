import Image from "next/image"
import Link from "next/link"

const legalLinks = [
  ["Help Center", "/tutorials"],
  ["Articles & Tutorials", "/articles"],
  ["Portfolio Comparison", "/portfolio-comparison"],
  ["Terms", "/terms"],
  ["License", "/license"],
  ["Privacy", "/privacy"],
  ["Copyright & DMCA", "/copyright"],
] as const

export function SiteFooter() {
  return (
    <footer className="border-t border-[#d9ddd8] bg-[#f1f7f4] px-6 py-8 text-[#5f594f] md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <Link aria-label="PhotoView.io home" className="inline-block" href="/">
            <Image
              alt="PhotoView.io"
              className="h-auto w-[172px]"
              height={376}
              src="/brand/photoview-logo-horizontal-transparent.png"
              width={1717}
            />
          </Link>
          <p className="mt-2 text-sm">Copyright © 2026 PhotoView.io. All rights reserved.</p>
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
