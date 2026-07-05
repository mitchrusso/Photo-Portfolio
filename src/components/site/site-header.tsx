import { Camera } from "lucide-react"
import Link from "next/link"

const navItems = [
  ["Gallery demo", "/portfolio"],
  ["Features", "/#features"],
  ["Lightroom", "/#lightroom"],
  ["Articles", "/articles"],
  ["Contact", "/contact"],
] as const

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/82 px-5 py-4 text-white backdrop-blur md:px-10">
      <div className="flex items-center justify-between gap-5">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex size-9 items-center justify-center rounded-md bg-[#d8a84f] text-black">
            <Camera className="size-5" />
          </span>
          <span className="font-semibold">PhotoViewPro</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-white/70 lg:flex">
          {navItems.map(([label, href]) => (
            <Link className="hover:text-white" href={href} key={href}>
              {label.replace("&apos;", "'")}
            </Link>
          ))}
          <Link className="rounded-md border border-white/15 px-3 py-2 text-white hover:bg-white/10" href="/dashboard">
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  )
}
