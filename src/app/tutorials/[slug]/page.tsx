import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Clock3, Lightbulb, ListChecks } from "lucide-react"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { getProductTutorial, productTutorials } from "@/data/product-tutorials"

type TutorialPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return productTutorials.map((tutorial) => ({ slug: tutorial.slug }))
}

export async function generateMetadata({ params }: TutorialPageProps): Promise<Metadata> {
  const { slug } = await params
  const tutorial = getProductTutorial(slug)

  if (!tutorial) return {}

  return {
    title: `${tutorial.title} | PhotoView Help Center`,
    description: tutorial.summary,
    alternates: {
      canonical: `/tutorials/${tutorial.slug}`,
    },
    openGraph: {
      title: tutorial.title,
      description: tutorial.summary,
      images: [{ alt: tutorial.screenshot.alt, url: tutorial.screenshot.src }],
      type: "article",
    },
  }
}

export default async function TutorialPage({ params }: TutorialPageProps) {
  const { slug } = await params
  const tutorial = getProductTutorial(slug)

  if (!tutorial) notFound()

  const orderedTutorials = [...productTutorials].sort((left, right) => left.order - right.order)
  const tutorialIndex = orderedTutorials.findIndex((item) => item.slug === tutorial.slug)
  const previousTutorial = orderedTutorials[tutorialIndex - 1]
  const nextTutorial = orderedTutorials[tutorialIndex + 1]
  const tutorialJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: tutorial.title,
    description: tutorial.summary,
    image: `https://photoview.io${tutorial.screenshot.src}`,
    totalTime: `PT${tutorial.readTime.replace(/\D/g, "")}M`,
    step: tutorial.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.heading,
      text: step.body.join(" "),
    })),
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <SiteHeader />
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(tutorialJsonLd) }} type="application/ld+json" />
      <article className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#5f594f] hover:text-[#1f211e]" href="/tutorials">
          <ArrowLeft className="size-4" />
          PhotoView Help Center
        </Link>

        <header className="mt-8 border-b border-[#ded8cc] pb-8">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#8a8175]">
            <span>Tutorial {tutorial.order} of {orderedTutorials.length}</span>
            <span aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
              <Clock3 className="size-3.5" />
              {tutorial.readTime}
            </span>
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">{tutorial.title}</h1>
          <p className="mt-5 max-w-4xl text-xl leading-9 text-[#5f594f]">{tutorial.summary}</p>
          <div className="mt-6 flex items-start gap-3 rounded-md border border-[#d9d2c6] bg-[#f5f1ea] p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#9c6f1d]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a8175]">What you’ll accomplish</p>
              <p className="mt-1 text-base leading-7 text-[#423f39]">{tutorial.outcome}</p>
            </div>
          </div>
        </header>

        <section className="mt-8 rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm" aria-labelledby="before-you-start">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="size-5 text-[#9c6f1d]" />
            <h2 className="text-xl font-semibold" id="before-you-start">Before you begin</h2>
          </div>
          <ul className="mt-4 grid gap-3 text-base leading-7 text-[#5f594f]">
            {tutorial.beforeYouStart.map((item) => (
              <li className="flex items-start gap-3" key={item}>
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#b37a1a]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <figure className="mt-9 overflow-hidden rounded-md border border-[#ded8cc] bg-white shadow-sm">
          <div className="relative aspect-[16/9] bg-[#e9e5dd]">
            <Image
              alt={tutorial.screenshot.alt}
              className="object-contain"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              src={tutorial.screenshot.src}
            />
          </div>
          <figcaption className="border-t border-[#ded8cc] px-5 py-4 text-sm leading-6 text-[#6f675d]">
            {tutorial.screenshot.caption}
          </figcaption>
        </figure>

        <div className="mx-auto mt-12 max-w-3xl space-y-12">
          {tutorial.steps.map((step, index) => (
            <section className="relative pl-12" key={step.heading}>
              <span className="absolute left-0 top-0 grid size-8 place-items-center rounded-full bg-[#1d2b22] text-sm font-semibold text-white">
                {index + 1}
              </span>
              <h2 className="text-2xl font-semibold">{step.heading}</h2>
              <div className="mt-4 space-y-4 text-lg leading-8 text-[#5f594f]">
                {step.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {step.tip && (
                <aside className="mt-5 flex items-start gap-3 rounded-md border border-[#e0d4bc] bg-[#fffaf0] p-4 text-base leading-7 text-[#5c5140]">
                  <Lightbulb className="mt-1 size-5 shrink-0 text-[#b37a1a]" />
                  <p><span className="font-semibold">Tip:</span> {step.tip}</p>
                </aside>
              )}
            </section>
          ))}
        </div>

        <section className="mx-auto mt-12 max-w-3xl rounded-md border border-[#cdd8d0] bg-[#eef5f0] p-6" aria-labelledby="tutorial-checklist">
          <div className="flex items-center gap-3">
            <ListChecks className="size-6 text-[#315a42]" />
            <h2 className="text-2xl font-semibold" id="tutorial-checklist">Finish with this checklist</h2>
          </div>
          <ul className="mt-5 grid gap-3 text-base leading-7 text-[#425248]">
            {tutorial.checklist.map((item) => (
              <li className="flex items-start gap-3" key={item}>
                <CheckCircle2 className="mt-1 size-5 shrink-0 text-[#3f7653]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <nav aria-label="Tutorial navigation" className="mt-14 grid gap-4 border-t border-[#ded8cc] pt-8 sm:grid-cols-2">
          {previousTutorial ? (
            <Link className="rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm hover:bg-[#f5f1ea]" href={`/tutorials/${previousTutorial.slug}`}>
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#8a8175]">
                <ArrowLeft className="size-4" />
                Previous
              </span>
              <span className="mt-2 block font-semibold">{previousTutorial.title}</span>
            </Link>
          ) : <span />}
          {nextTutorial ? (
            <Link className="rounded-md border border-[#ded8cc] bg-white p-5 text-right shadow-sm hover:bg-[#f5f1ea]" href={`/tutorials/${nextTutorial.slug}`}>
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#8a8175]">
                Next
                <ArrowRight className="size-4" />
              </span>
              <span className="mt-2 block font-semibold">{nextTutorial.title}</span>
            </Link>
          ) : (
            <Link className="rounded-md bg-[#1d2b22] p-5 text-right text-white hover:bg-[#26382d]" href="/dashboard?panel=website">
              <span className="text-xs uppercase tracking-[0.16em] text-white/70">Series complete</span>
              <span className="mt-2 block font-semibold">Open My Website</span>
            </Link>
          )}
        </nav>
      </article>
      <SiteFooter />
    </main>
  )
}
