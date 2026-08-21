import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Check } from "lucide-react"

import { JsonLd } from "@/components/seo/json-ld"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { AttributedTrialLink } from "@/components/site/attributed-trial-link"
import { getMarketingSolution, marketingSolutions } from "@/data/marketing-solutions"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return marketingSolutions.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const solution = getMarketingSolution((await params).slug)
  if (!solution) return {}
  const canonical = `/solutions/${solution.slug}`
  return {
    alternates: { canonical },
    description: solution.description,
    openGraph: { description: solution.description, images: [solution.image], title: solution.title, url: canonical },
    title: solution.title,
  }
}

export default async function SolutionPage({ params }: Props) {
  const solution = getMarketingSolution((await params).slug)
  if (!solution) notFound()

  const canonical = `https://photoview.io/solutions/${solution.slug}`
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        description: solution.description,
        name: solution.title,
        url: canonical,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", item: "https://photoview.io/", name: "PhotoView.io", position: 1 },
          { "@type": "ListItem", item: "https://photoview.io/solutions", name: "Solutions", position: 2 },
          { "@type": "ListItem", item: canonical, name: solution.title, position: 3 },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: solution.faqs.map((faq) => ({
          "@type": "Question",
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
          name: faq.question,
        })),
      },
    ],
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <JsonLd data={structuredData} />
      <SiteHeader />
      <section className="border-b border-[#ded8cc] bg-[#f5f1ea] px-6 py-14 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#b37a1a]">{solution.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-6xl">{solution.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5f594f]">{solution.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <AttributedTrialLink analyticsLabel={solution.slug} campaign={solution.slug} className="inline-flex h-12 items-center gap-2 rounded-md bg-[#1d2b22] px-5 text-sm font-semibold text-white hover:bg-[#26382d]">
                Start the 14-day trial <ArrowRight className="size-4" />
              </AttributedTrialLink>
              <Link className="inline-flex h-12 items-center rounded-md border border-[#bdb5a7] bg-white px-5 text-sm font-semibold" href={solution.relatedArticle.href}>{solution.relatedArticle.label}</Link>
            </div>
          </div>
          <Image alt={solution.imageAlt} className="aspect-[4/3] w-full rounded-md object-cover shadow-xl" height={900} priority src={solution.image} width={1200} />
        </div>
      </section>

      <section className="px-6 py-14 md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="max-w-4xl text-3xl font-semibold leading-tight md:text-4xl">{solution.promise}</p>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {solution.steps.map((step, index) => (
              <article className="rounded-md border border-[#ded8cc] bg-white p-6 shadow-sm" key={step.title}>
                <span className="flex size-9 items-center justify-center rounded-full bg-[#1d2b22] text-sm font-semibold text-white">{index + 1}</span>
                <h2 className="mt-5 text-xl font-semibold">{step.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#5f594f]">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#ded8cc] bg-white px-6 py-14 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          {solution.benefits.map((benefit) => (
            <article key={benefit.title}>
              <Check className="size-6 text-[#b37a1a]" />
              <h2 className="mt-4 text-2xl font-semibold">{benefit.title}</h2>
              <p className="mt-3 leading-7 text-[#5f594f]">{benefit.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 py-14 md:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[#b37a1a]">Questions photographers ask</p>
          <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Before you publish</h2>
          <div className="mt-8 divide-y divide-[#ded8cc] border-y border-[#ded8cc]">
            {solution.faqs.map((faq) => (
              <article className="py-6" key={faq.question}>
                <h3 className="text-lg font-semibold">{faq.question}</h3>
                <p className="mt-2 leading-7 text-[#5f594f]">{faq.answer}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 rounded-md bg-[#1d2b22] p-7 text-white md:p-9">
            <h2 className="text-3xl font-semibold">Put your finished work somewhere worth visiting.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/75">Start with the Starter plan and use the full 14-day trial to import, curate, publish, and share a real portfolio.</p>
            <AttributedTrialLink analyticsLabel={`${solution.slug}-footer`} campaign={solution.slug} className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-[#d8a84f] px-4 text-sm font-semibold text-[#1d2b22]">
              Start free <ArrowRight className="size-4" />
            </AttributedTrialLink>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
