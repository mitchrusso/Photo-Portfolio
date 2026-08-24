import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { marketingSolutions } from "@/data/marketing-solutions"

export const metadata: Metadata = {
  alternates: { canonical: "/solutions" },
  description: "Explore PhotoView.io workflows for templates, Lightroom publishing, photo and video portfolios, private sharing, mobile presentation, storage, and live embeds.",
  title: "Photography Portfolio Publishing Solutions",
}

export default function SolutionsPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <SiteHeader />
      <section className="border-b border-[#ded8cc] bg-[#f5f1ea] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[#b37a1a]">PhotoView.io workflows</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">Finish the photograph. Publish the portfolio.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5f594f]">Practical ways to move curated work from the tools you use into a responsive portfolio, a live website, and the places where clients discover you.</p>
        </div>
      </section>
      <section className="px-6 py-14 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          {marketingSolutions.map((solution) => (
            <article className="overflow-hidden rounded-md border border-[#ded8cc] bg-white shadow-sm" key={solution.slug}>
              <Image alt={solution.imageAlt} className="aspect-[4/3] w-full object-cover" height={720} src={solution.image} width={960} />
              <div className="p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-[#b37a1a]">{solution.eyebrow}</p>
                <h2 className="mt-3 text-2xl font-semibold">{solution.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#5f594f]">{solution.description}</p>
                <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold" href={`/solutions/${solution.slug}`}>
                  Explore the workflow <ArrowRight className="size-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
