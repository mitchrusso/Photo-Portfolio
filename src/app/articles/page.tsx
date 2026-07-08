import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BookOpen, Search } from "lucide-react"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { seoArticles } from "@/data/articles"

export const metadata: Metadata = {
  title: "Photography Portfolio Articles | PhotoViewPro",
  description:
    "Practical articles for photographers building curated portfolios, mobile galleries, embedded galleries, and cleaner photo publishing workflows.",
  alternates: {
    canonical: "/articles",
  },
}

export default function ArticlesPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <SiteHeader />
      <section className="border-b border-[#ded8cc] bg-[#f5f1ea] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[#b37a1a]">Articles</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
              Practical portfolio advice for photographers who want the work to look better.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-[#5f594f]">
              These articles are written for photographers comparing platforms, improving mobile gallery presentation,
              embedding portfolios on existing websites, and publishing curated work more consistently.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 xl:grid-cols-3">
          {seoArticles.map((article) => (
            <article className="flex min-h-[310px] flex-col rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm" key={article.slug}>
              <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-[#8a8175]">
                <span>{article.audience}</span>
                <span>{article.readTime}</span>
              </div>
              <BookOpen className="mt-7 size-5 text-[#d8a84f]" />
              <h2 className="mt-4 text-2xl font-semibold leading-tight">{article.title}</h2>
              <p className="mt-3 flex-1 text-base leading-7 text-[#5f594f]">{article.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {article.keywords.slice(0, 2).map((keyword) => (
                  <span className="rounded-full border border-[#e4dbcc] bg-[#fbfaf7] px-3 py-1 text-xs text-[#6f685d]" key={keyword}>
                    {keyword}
                  </span>
                ))}
              </div>
              <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1d2b22] hover:text-[#9c6f1d]" href={`/articles/${article.slug}`}>
                Read article
                <ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#ded8cc] bg-white px-6 py-12 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-6 rounded-md border border-[#ded8cc] bg-[#fbfaf7] p-6 shadow-sm md:grid-cols-[auto_1fr_auto] md:items-center">
          <Search className="size-8 text-[#d8a84f]" />
          <div>
            <h2 className="text-2xl font-semibold">Compare portfolio platforms before you commit.</h2>
            <p className="mt-2 text-base leading-7 text-[#5f594f]">
              See how PhotoViewPro compares with Zenfolio, Pixieset, ShootProof, and Pic-Time for portfolio-first publishing.
            </p>
          </div>
          <Link className="inline-flex h-11 items-center justify-center rounded-md bg-[#1d2b22] px-4 text-sm font-semibold text-white hover:bg-[#26382d]" href="/portfolio-comparison">
            View comparison
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
