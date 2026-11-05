import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Camera, Eye, ShieldCheck } from "lucide-react"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"

const title = "About PhotoView and Founder Mitch Russo"
const description = "Learn why photographer Mitch Russo built PhotoView: a focused way to store, curate, present, and share finished photography without the weight of a full studio-management platform."

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  description,
  openGraph: { description, images: [{ alt: "PhotoView.io", height: 630, url: "/opengraph-image", width: 1200 }], siteName: "PhotoView.io", title, type: "website", url: "https://photoview.io/about" },
  title,
  twitter: { card: "summary_large_image", description, images: ["/opengraph-image"], title },
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <SiteHeader />
      <section className="border-b border-[#ded8cc] bg-[linear-gradient(115deg,#edf8f4_0%,#fff8f3_52%,#f4f1fa_100%)] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#76500b]">Why PhotoView exists</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">Built by photographer Mitch Russo for the work that comes after the edit.</h1>
          <div className="mt-8 max-w-3xl space-y-5 text-lg leading-8 text-[#5f594f]">
            <p>
              I built PhotoView because finished photographs deserve more than a folder, a compressed social feed, or a website that makes every photographer look the same. The hard part is not only making an image. It is choosing the work that matters, arranging it with care, and giving people a clear way to experience it.
            </p>
            <p>
              PhotoView keeps that job focused. It brings your finished photos and video into one library, turns selected work into responsive portfolio websites, and keeps live embeds and presentations current when the portfolio changes. It does not pretend to replace every proofing, print-sales, contract, or studio-management tool.
            </p>
            <p>
              The product is built around a simple standard: your photographs lead, the controls stay understandable, and the platform tells you plainly what it does and does not do.
            </p>
          </div>
          <p className="mt-8 text-base font-semibold">— Mitch Russo, founder of PhotoView.io</p>
        </div>
      </section>

      <section className="px-6 py-14 md:px-10">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {[
            [Camera, "Made for finished work", "Import from the tools you already use, then curate and publish without rebuilding your workflow."],
            [Eye, "Presentation comes first", "Templates, lightboxes, mobile viewing, and embeds are designed to support the photograph rather than compete with it."],
            [ShieldCheck, "Plain about the limits", "If you need proofing, print sales, contracts, or full studio management today, PhotoView will say so clearly."],
          ].map(([Icon, heading, body]) => (
            <article className="rounded-md border border-[#ded8cc] bg-white p-6 shadow-sm" key={heading as string}>
              <Icon className="size-6 text-[#b37a1a]" />
              <h2 className="mt-4 text-xl font-semibold">{heading as string}</h2>
              <p className="mt-3 leading-7 text-[#5f594f]">{body as string}</p>
            </article>
          ))}
        </div>
        <div className="mx-auto mt-10 flex max-w-5xl flex-wrap gap-3">
          <Link className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1d2b22] px-5 text-sm font-semibold text-white" href="/portfolio">See Mitch’s photography <ArrowRight className="size-4" /></Link>
          <Link className="inline-flex h-11 items-center gap-2 rounded-md border border-[#b9b0a1] px-5 text-sm font-semibold" href="/articles">Read PhotoView articles</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
