import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"

import { WebsiteTemplateMiniPreview } from "@/components/portfolio/website-template-mini-preview"
import { JsonLd } from "@/components/seo/json-ld"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { PHOTOVIEW_ARTICLE_AUTHOR } from "@/lib/marketing-articles"
import type { WebsiteTemplate } from "@/lib/website-builder-rules"

const title = "Photography Portfolio Examples and Presentation Ideas"
const description = "See photography portfolio examples for travel, fine art, commercial, wedding, product, portrait, and mixed photo and video presentations."
const publishedAt = "2026-08-24T00:00:00-04:00"

export const metadata: Metadata = {
  alternates: { canonical: "/articles/photography-portfolio-examples" },
  description,
  keywords: ["photography portfolio examples", "photography portfolio ideas", "professional photography portfolio", "photography website inspiration"],
  openGraph: {
    description,
    images: [{ alt: "Photography portfolio presentation example", url: "/marketing-preview/photography-portfolio-examples.webp" }],
    publishedTime: publishedAt,
    title,
    type: "article",
    url: "/articles/photography-portfolio-examples",
  },
  title,
  twitter: { card: "summary_large_image", description, images: ["/marketing-preview/photography-portfolio-examples.webp"], title },
}

type PortfolioExample = {
  body: string
  image: string
  imageAlt: string
  imageHeight: number
  imageWidth: number
  name: string
  principles: string[]
  templateId: WebsiteTemplate
  templateName: string
}

const examples: PortfolioExample[] = [
  {
    name: "Travel and landscape storytelling",
    body: "A travel portfolio becomes stronger when it feels like a journey instead of a folder. Begin with a photograph that establishes place, vary wide scenes and details, and use short context only where it helps the viewer understand the experience.",
    image: "/marketing-preview/photography-portfolio-examples.webp",
    imageAlt: "Greenland landscape photography portfolio example",
    imageHeight: 934,
    imageWidth: 1800,
    principles: ["Lead with a sense of place", "Sequence wide views and details", "Keep navigation available but quiet"],
    templateId: "scroll-stack",
    templateName: "Scroll stack",
  },
  {
    name: "Commercial photography case study",
    body: "Commercial visitors need to understand the assignment quickly. Organize the work by project, identify the client or creative problem where appropriate, and show enough range to establish capability without turning the page into an archive.",
    image: "/marketing-preview/gallery-sloss-furnaces.webp",
    imageAlt: "Industrial commercial photography portfolio example",
    imageHeight: 1229,
    imageWidth: 840,
    principles: ["Label projects clearly", "Show a consistent visual result", "Make the inquiry path easy to find"],
    templateId: "commercial-casebook",
    templateName: "Commercial casebook",
  },
  {
    name: "Fine art and exhibition portfolio",
    body: "Fine art presentation often benefits from restraint. Give each image room, preserve its proportions, use consistent supporting labels, and let the sequence communicate relationships across the collection.",
    image: "/marketing-preview/gallery-brazil.webp",
    imageAlt: "Fine art city photography portfolio example",
    imageHeight: 573,
    imageWidth: 840,
    principles: ["Preserve natural image proportions", "Use measured spacing", "Treat titles and labels consistently"],
    templateId: "museum-wall",
    templateName: "Museum wall",
  },
  {
    name: "Night, motion, and cinematic work",
    body: "Cinematic portfolios can use scale, motion, and darkness to hold attention. One strong opening image, carefully paced transitions, and a focused film strip can create energy without turning the portfolio into a slideshow of everything.",
    image: "/marketing-preview/gallery-moab-night-sky.webp",
    imageAlt: "Night sky photography portfolio example",
    imageHeight: 560,
    imageWidth: 840,
    principles: ["Use one decisive opening frame", "Mix still photography and motion deliberately", "Keep the visual controls unobtrusive"],
    templateId: "dark-filmstrip",
    templateName: "Dark filmstrip",
  },
]

const additionalPatterns = [
  { id: "acclaim-portfolio" as const, name: "Wedding and portrait", note: "Warm, confident presentation with selected recognition and a clear contact path." },
  { id: "object-stage" as const, name: "Product and still life", note: "Controlled negative space gives objects, materials, and details individual attention." },
  { id: "editorial-story" as const, name: "Documentary and editorial", note: "Images and writing work together to establish context, pacing, and point of view." },
]

export default function PhotographyPortfolioExamplesPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        author: { "@type": "Organization", name: PHOTOVIEW_ARTICLE_AUTHOR },
        dateModified: publishedAt,
        datePublished: publishedAt,
        description,
        headline: title,
        image: "https://photoview.io/marketing-preview/photography-portfolio-examples.webp",
        mainEntityOfPage: "https://photoview.io/articles/photography-portfolio-examples",
        publisher: { "@type": "Organization", name: "PhotoView.io" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", item: "https://photoview.io/", name: "PhotoView.io", position: 1 },
          { "@type": "ListItem", item: "https://photoview.io/articles", name: "Articles and Tutorials", position: 2 },
          { "@type": "ListItem", item: "https://photoview.io/articles/photography-portfolio-examples", name: title, position: 3 },
        ],
      },
    ],
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <JsonLd data={structuredData} />
      <SiteHeader />
      <article>
        <header className="border-b border-[#ded8cc] bg-[#f5f1ea] px-6 py-14 md:px-10">
          <div className="mx-auto max-w-6xl">
            <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#5f594f] hover:text-[#1f211e]" href="/articles">
              <ArrowLeft className="size-4" />
              Articles &amp; Tutorials
            </Link>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b37a1a]">Portfolio inspiration</p>
                <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">{title}</h1>
              </div>
              <div>
                <p className="text-xl leading-9 text-[#5f594f]">{description}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[#8a8175]">By {PHOTOVIEW_ARTICLE_AUTHOR} · 8 min read</p>
              </div>
            </div>
          </div>
        </header>

        <section className="px-6 py-12 md:px-10">
          <div className="mx-auto max-w-4xl text-lg leading-8 text-[#5f594f]">
            <h2 className="text-3xl font-semibold text-[#1f211e]">What makes a photography portfolio work?</h2>
            <p className="mt-5">
              The strongest portfolio is not necessarily the one with the most photographs or the most elaborate design. It is the one that helps the intended viewer understand the work quickly, remember it clearly, and continue looking without fighting the interface.
            </p>
            <p className="mt-4">
              A travel story needs pacing and context. A commercial case study needs clear project labels. Fine art often benefits from restraint. Wedding work needs warmth, trust, and a coherent emotional sequence. The presentation should support what the photographer wants the work to accomplish.
            </p>
          </div>
        </section>

        <section className="space-y-16 px-6 pb-16 md:px-10">
          {examples.map((example, index) => (
            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2 lg:items-center" key={example.name}>
              <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                <div className="overflow-hidden rounded-md border border-[#ded8cc] bg-white p-3 shadow-sm">
                  <Image alt={example.imageAlt} className="h-auto max-h-[540px] w-full object-contain" height={example.imageHeight} sizes="(max-width: 1024px) 100vw, 50vw" src={example.image} width={example.imageWidth} />
                </div>
              </div>
              <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b37a1a]">Example {index + 1}</p>
                <h2 className="mt-3 text-3xl font-semibold">{example.name}</h2>
                <p className="mt-4 text-lg leading-8 text-[#5f594f]">{example.body}</p>
                <ul className="mt-5 space-y-2 text-sm text-[#4d473f]">
                  {example.principles.map((principle) => (
                    <li className="flex items-start gap-2" key={principle}><Check className="mt-0.5 size-4 shrink-0 text-[#b37a1a]" />{principle}</li>
                  ))}
                </ul>
                <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1d2b22] underline decoration-[#d8a84f] underline-offset-4" href={`/photography-website-templates#${example.templateId}`}>
                  See the {example.templateName} presentation
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          ))}
        </section>

        <section className="border-y border-[#ded8cc] bg-[#f1f7f4] px-6 py-14 md:px-10">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm uppercase tracking-[0.2em] text-[#b37a1a]">More presentation patterns</p>
            <h2 className="mt-3 text-3xl font-semibold">Match the layout to the viewer and the work.</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {additionalPatterns.map((pattern) => (
                <article className="rounded-md border border-[#ded8cc] bg-white p-4" key={pattern.id}>
                  <WebsiteTemplateMiniPreview isSelected={false} templateId={pattern.id} />
                  <h3 className="text-lg font-semibold">{pattern.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5f594f]">{pattern.note}</p>
                  <Link className="mt-4 inline-flex text-sm font-semibold underline decoration-[#d8a84f] underline-offset-4" href={`/photography-website-templates#${pattern.id}`}>View this style</Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-14 md:px-10">
          <div className="mx-auto grid max-w-5xl gap-8 rounded-md bg-[#1d2b22] p-8 text-white md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[#e2b85e]">Put the idea to work</p>
              <h2 className="mt-3 text-3xl font-semibold">Build the presentation your photography needs.</h2>
              <p className="mt-3 max-w-2xl leading-7 text-white/70">Start with any PhotoView.io template, review it on desktop and mobile, and change the design without rebuilding your content.</p>
            </div>
            <Link className="inline-flex h-12 items-center gap-2 rounded-md bg-white px-6 text-sm font-semibold text-[#1d2b22] hover:bg-[#f1ece3]" href="/register">
              Start your 14-day trial
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </article>
      <SiteFooter />
    </main>
  )
}
