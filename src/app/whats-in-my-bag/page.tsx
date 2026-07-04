import { ExternalLink } from "lucide-react"
import { SiteHeader } from "@/components/site/site-header"

const gearItems = [
  ["Camera Bodies", "Primary mirrorless camera body", "https://www.amazon.com/"],
  ["Wide Lens", "Ultra-wide lens for interiors, night sky, and landscapes", "https://www.amazon.com/"],
  ["Travel Tripod", "Compact carbon tripod for long exposure field work", "https://www.amazon.com/"],
  ["Camera Bag", "Carry-on friendly pack for long travel days", "https://www.amazon.com/"],
  ["Filters", "Neutral density and polarizing filters", "https://www.amazon.com/"],
  ["Storage", "Portable SSDs and memory cards for redundant backups", "https://www.amazon.com/"],
]

export const metadata = {
  title: "What's in My Bag | Mitch Russo Photography",
  description: "Photography gear used by Mitch Russo, with affiliate links.",
}

export default function WhatsInMyBagPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader />
      <section className="px-6 py-10 md:px-10">
        <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Field kit</p>
        <h1 className="mt-3 text-4xl font-semibold">What&apos;s in My Bag</h1>
        <p className="mt-3 max-w-2xl text-white/60">
          The working gear list will become editable in the admin and support Amazon affiliate links.
        </p>
        <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {gearItems.map(([category, description, href]) => (
            <a className="rounded-md border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06]" href={href} key={category} rel="noreferrer" target="_blank">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold">{category}</h2>
                <ExternalLink className="size-4 text-[#d8a84f]" />
              </div>
              <p className="mt-3 text-sm leading-6 text-white/58">{description}</p>
              <p className="mt-5 text-xs text-white/38">Amazon affiliate link placeholder</p>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
