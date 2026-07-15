import Link from "next/link"
import { SiteHeader } from "@/components/site/site-header"

export const metadata = {
  title: "What's in My Bag | Mitch Russo Photography",
  description: "Photography field-kit notes from Mitch Russo.",
}

export default function WhatsInMyBagPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader />
      <section className="px-6 py-10 md:px-10">
        <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Field kit</p>
        <h1 className="mt-3 text-4xl font-semibold">What&apos;s in My Bag</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-white/60">
          Equipment recommendations are published only after each item has been reviewed and approved. Explore the photography portfolio while the next field-kit update is being prepared.
        </p>
        <Link className="mt-8 inline-flex h-11 items-center rounded-md bg-white px-5 text-sm font-semibold text-black" href="/portfolio">
          Explore the portfolio
        </Link>
      </section>
    </main>
  )
}
