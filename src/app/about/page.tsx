import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Camera, Eye, MessageCircleQuestion, ShieldCheck } from "lucide-react"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"

const title = "About PhotoView and Founder Mitch Russo"
const description = "Learn how award-winning photographer Mitch Russo turned years of frustration with portfolio platforms into PhotoView: a focused way to present finished photography with pride."

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
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)] lg:items-start">
          <figure className="mx-auto w-full max-w-sm overflow-hidden rounded-md border border-[#d8a84f]/55 bg-[#17241d] shadow-xl shadow-[#17241d]/10">
            <Image
              alt="PhotoView founder and award-winning photographer Mitch Russo"
              className="h-auto w-full"
              height={480}
              priority
              sizes="(min-width: 1024px) 384px, 90vw"
              src="/brand/mitch-russo-founder.jpg"
              width={384}
            />
            <figcaption className="border-t border-[#d8a84f]/40 px-5 py-4 text-sm leading-6 text-white/80">
              <span className="block font-semibold text-white">Mitch Russo</span>
              Founder of PhotoView.io and award-winning photographer
            </figcaption>
          </figure>

          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#76500b]">Why I built PhotoView</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">I wanted a portfolio website worthy of the photographs.</h1>
            <div className="mt-8 max-w-3xl space-y-5 text-lg leading-8 text-[#5f594f]">
              <p>
                For years, I struggled to find a good way to present my award-winning photography. I eventually settled on SmugMug, but I could never make the portfolio look the way I wanted. It was difficult to shape around my work, and I could not build the blog or travel log I wanted beside it.
              </p>
              <p>
                I stayed with it for more than five years. Then, early in 2026, another price-increase notice arrived. I was not willing to pay around $200 a year for something that still did not work well for me. That was the moment I decided to build a platform for my own photography.
              </p>
              <p>
                As PhotoView took shape, other photographers saw what it could become and wanted in. A personal solution grew into a commercial platform where photographers can store, curate, and publish their work as portfolio websites, mobile presentations, and live embeds—without forcing the photographs into somebody else&apos;s idea of a portfolio.
              </p>
              <p>
                PhotoView is built on commercial cloud infrastructure with protected storage and operational safeguards. I also added built-in AI guidance and practical support tools so subscribers can get clear answers without having to master another complicated system. I am proud of what PhotoView has become and grateful to every photographer helping make it better.
              </p>
            </div>
            <p className="mt-8 text-base font-semibold">— Mitch Russo, founder of PhotoView.io</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#76500b]">A photographer&apos;s priorities, built into the product</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight md:text-4xl">Credibility comes from understanding the work firsthand.</h2>
        </div>
        <div className="mx-auto mt-8 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            [Camera, "Built by a photographer", "PhotoView began with five years of firsthand frustration trying to present finished work with pride."],
            [Eye, "Presentation comes first", "Templates, lightboxes, mobile viewing, and embeds support the photograph rather than compete with it."],
            [ShieldCheck, "Commercial foundation", "Protected storage, operational safeguards, and a modern cloud platform support the work behind every portfolio."],
            [MessageCircleQuestion, "Help without the maze", "Built-in AI guidance and practical support tools give photographers a clearer path to the next step."],
          ].map(([Icon, heading, body]) => (
            <article className="rounded-md border border-[#ded8cc] bg-white p-6 shadow-sm" key={heading as string}>
              <Icon className="size-6 text-[#b37a1a]" />
              <h2 className="mt-4 text-xl font-semibold">{heading as string}</h2>
              <p className="mt-3 leading-7 text-[#5f594f]">{body as string}</p>
            </article>
          ))}
        </div>
        <div className="mx-auto mt-10 flex max-w-6xl flex-wrap gap-3">
          <Link className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1d2b22] px-5 text-sm font-semibold text-white" href="/portfolio">See Mitch’s photography <ArrowRight className="size-4" /></Link>
          <Link className="inline-flex h-11 items-center gap-2 rounded-md border border-[#b9b0a1] px-5 text-sm font-semibold" href="/articles">Read PhotoView articles</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
