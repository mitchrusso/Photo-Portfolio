import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Check, MonitorSmartphone, RefreshCw } from "lucide-react"

import { WebsiteTemplateMiniPreview } from "@/components/portfolio/website-template-mini-preview"
import { JsonLd } from "@/components/seo/json-ld"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { marketingTemplateCategories, marketingTemplates } from "@/data/marketing-templates"

const title = "Photography Website Templates for Beautiful Portfolios"
const description = "Explore 30+ responsive photography website templates for cinematic, editorial, commercial, and fine art portfolios. Change designs without rebuilding."

export const metadata: Metadata = {
  alternates: { canonical: "/photography-website-templates" },
  description,
  openGraph: {
    description,
    images: [{ alt: "PhotoView.io photography website template collection", url: "/opengraph-image" }],
    title,
    type: "website",
    url: "/photography-website-templates",
  },
  title,
  twitter: { card: "summary_large_image", description, images: ["/opengraph-image"], title },
}

const faqs = [
  {
    question: "Can I change templates after I start building?",
    answer: "Yes. Your photography and website content remain in PhotoView.io while you compare and change presentation styles.",
  },
  {
    question: "Do the templates work on phones and desktop computers?",
    answer: "Yes. Every template is responsive and can be reviewed in desktop and mobile preview before publishing.",
  },
  {
    question: "Are all templates included with every PhotoView.io plan?",
    answer: "Yes. Every paid plan includes the complete template collection and website builder.",
  },
]

export default function PhotographyWebsiteTemplatesPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        description,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: marketingTemplates.map((template, index) => ({
            "@type": "ListItem",
            name: template.label,
            position: index + 1,
            url: `https://photoview.io/photography-website-templates#${template.id}`,
          })),
        },
        name: title,
        url: "https://photoview.io/photography-website-templates",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", item: "https://photoview.io/", name: "PhotoView.io", position: 1 },
          { "@type": "ListItem", item: "https://photoview.io/photography-website-templates", name: "Photography website templates", position: 2 },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
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

      <section className="border-b border-[#ded8cc] bg-[#f1f7f4] px-6 py-16 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b37a1a]">30+ responsive designs</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
              Photography website templates designed to showcase the work.
            </h1>
          </div>
          <div>
            <p className="text-lg leading-8 text-[#5f594f]">
              Choose a visual starting point for travel, fine art, commercial, wedding, portrait, product, or documentary photography. Change the design without rebuilding your portfolios.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1d2b22] px-5 text-sm font-semibold text-white hover:bg-[#26382d]" href="/register">
                Build your portfolio
                <ArrowRight className="size-4" />
              </Link>
              <Link className="inline-flex h-11 items-center rounded-md border border-[#cfc7ba] bg-white px-5 text-sm font-semibold hover:bg-[#f5f1ea]" href="/articles/photography-portfolio-examples">
                See portfolio examples
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#ded8cc] px-6 py-8 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3">
          {[
            { icon: MonitorSmartphone, title: "Designed for every screen", body: "Review the complete experience on desktop and mobile before publishing." },
            { icon: RefreshCw, title: "Change without rebuilding", body: "Keep the same photographs and content while you compare presentation styles." },
            { icon: Check, title: "Every design included", body: "Use the complete template collection with any paid PhotoView.io plan." },
          ].map(({ body, icon: Icon, title: itemTitle }) => (
            <div className="rounded-md border border-[#ded8cc] bg-white p-5" key={itemTitle}>
              <Icon className="size-5 text-[#b37a1a]" />
              <h2 className="mt-4 text-lg font-semibold">{itemTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-[#6f685d]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <nav aria-label="Template categories" className="px-6 pt-10 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2">
          {marketingTemplateCategories.map((category) => (
            <a className="rounded-full border border-[#d7cec0] bg-white px-4 py-2 text-sm font-semibold hover:border-[#b37a1a]" href={category === "All" ? "#all-templates" : `#${category.toLowerCase()}`} key={category}>
              {category}
            </a>
          ))}
        </div>
      </nav>

      <section className="px-6 py-10 md:px-10" id="all-templates">
        <div className="mx-auto max-w-7xl space-y-14">
          {marketingTemplateCategories.filter((category) => category !== "All").map((category) => {
            const templates = marketingTemplates.filter((template) => template.category === category)
            return (
              <section aria-labelledby={`${category.toLowerCase()}-heading`} id={category.toLowerCase()} key={category}>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-[#ded8cc] pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b37a1a]">Presentation style</p>
                    <h2 className="mt-2 text-3xl font-semibold" id={`${category.toLowerCase()}-heading`}>{category}</h2>
                  </div>
                  <p className="text-sm text-[#6f685d]">{templates.length} starting points</p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {templates.map((template) => (
                    <article className="scroll-mt-28 rounded-md border border-[#ded8cc] bg-white p-4 shadow-sm" id={template.id} key={template.id}>
                      <WebsiteTemplateMiniPreview isSelected={false} templateId={template.id} />
                      <h3 className="text-lg font-semibold">{template.label}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#5f594f]">{template.description}</p>
                      <p className="mt-4 border-t border-[#ece7df] pt-3 text-xs leading-5 text-[#7d756a]">
                        <span className="font-semibold text-[#4d473f]">Best for:</span> {template.bestFor}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </section>

      <section className="border-y border-[#ded8cc] bg-[#1d2b22] px-6 py-14 text-white md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#e2b85e]">Your photography, your presentation</p>
            <h2 className="mt-3 text-3xl font-semibold">Choose a design, then make it unmistakably yours.</h2>
          </div>
          <Link className="inline-flex h-12 shrink-0 items-center gap-2 rounded-md bg-white px-6 text-sm font-semibold text-[#1d2b22] hover:bg-[#f1ece3]" href="/register">
            Start your 14-day trial
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="px-6 py-14 md:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[#b37a1a]">Questions</p>
          <h2 className="mt-3 text-3xl font-semibold">Choosing a photography website template</h2>
          <div className="mt-6 divide-y divide-[#ded8cc] border-y border-[#ded8cc]">
            {faqs.map((faq) => (
              <div className="py-5" key={faq.question}>
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="mt-2 leading-7 text-[#5f594f]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
