import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BookOpenCheck, Clock3, MonitorSmartphone } from "lucide-react"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { productTutorials } from "@/data/product-tutorials"

export const metadata: Metadata = {
  title: "PhotoView Help Center & Tutorials | PhotoView.io",
  description:
    "Illustrated, step-by-step tutorials for building, previewing, and publishing your photography website with PhotoView.io.",
  alternates: {
    canonical: "/tutorials",
  },
}

export default function TutorialsPage() {
  const tutorials = [...productTutorials].sort((left, right) => left.order - right.order)

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <SiteHeader />
      <section className="border-b border-[#ded8cc] bg-[#f5f1ea] px-6 py-14 md:px-10 md:py-18">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[#b37a1a]">PhotoView Help Center</p>
          <div className="mt-4 grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
                Build your photography website with confidence.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[#5f594f]">
                Follow the illustrated Website Builder series in order, or open the tutorial for the task you are working on now.
              </p>
            </div>
            <div className="grid gap-3 rounded-md border border-[#d7cec0] bg-white p-5 shadow-sm sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div>
                <BookOpenCheck className="size-5 text-[#b37a1a]" />
                <p className="mt-2 text-2xl font-semibold">{tutorials.length}</p>
                <p className="text-sm text-[#6f685d]">guided lessons</p>
              </div>
              <div>
                <Clock3 className="size-5 text-[#b37a1a]" />
                <p className="mt-2 text-2xl font-semibold">6–9 min</p>
                <p className="text-sm text-[#6f685d]">per lesson</p>
              </div>
              <div>
                <MonitorSmartphone className="size-5 text-[#b37a1a]" />
                <p className="mt-2 text-2xl font-semibold">Real screens</p>
                <p className="text-sm text-[#6f685d]">desktop + mobile</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[#8a8175]">Series 1</p>
              <h2 className="mt-2 text-3xl font-semibold">Build your website</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#6f685d]">
              Start with the beginner’s tour, then work through identity, layout, content, responsive review, and publishing.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {tutorials.map((tutorial) => (
              <article className="group flex min-h-[290px] flex-col rounded-md border border-[#ded8cc] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" key={tutorial.slug}>
                <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.16em] text-[#8a8175]">
                  <span>Tutorial {tutorial.order}</span>
                  <span>{tutorial.readTime}</span>
                </div>
                <h3 className="mt-5 text-2xl font-semibold leading-tight">{tutorial.title}</h3>
                <p className="mt-3 flex-1 text-base leading-7 text-[#5f594f]">{tutorial.summary}</p>
                <p className="mt-5 border-l-2 border-[#d8a84f] pl-3 text-sm leading-6 text-[#6f685d]">
                  {tutorial.outcome}
                </p>
                <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1d2b22] group-hover:text-[#9c6f1d]" href={`/tutorials/${tutorial.slug}`}>
                  Start tutorial
                  <ArrowRight className="size-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#ded8cc] bg-white px-6 py-10 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-md border border-[#ded8cc] bg-[#f5f1ea] p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Need an answer while you work?</h2>
            <p className="mt-2 text-base leading-7 text-[#5f594f]">
              Subscribers can also use Ask AI How To, Edit Hints, and Tours inside My Website.
            </p>
          </div>
          <Link className="inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-[#1d2b22] px-4 text-sm font-semibold text-white hover:bg-[#26382d]" href="/dashboard?panel=website">
            Open My Website
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
