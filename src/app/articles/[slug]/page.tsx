import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { getSeoArticle, seoArticles } from "@/data/articles"

type ArticlePageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return seoArticles.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = getSeoArticle(slug)

  if (!article) {
    return {}
  }

  return {
    title: `${article.title} | PhotoView.io`,
    description: article.description,
    keywords: article.keywords,
    alternates: {
      canonical: `/articles/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.publishedAt,
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = getSeoArticle(slug)

  if (!article) {
    notFound()
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: {
      "@type": "Organization",
      name: "PhotoView.io",
    },
    publisher: {
      "@type": "Organization",
      name: "PhotoView.io",
    },
    keywords: article.keywords.join(", "),
    mainEntityOfPage: `https://photoview.io/articles/${article.slug}`,
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <SiteHeader />
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        type="application/ld+json"
      />
      <article className="mx-auto max-w-4xl px-6 py-12 md:px-10">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#5f594f] hover:text-[#1f211e]" href="/articles">
          <ArrowLeft className="size-4" />
          Articles &amp; Tutorials
        </Link>
        <header className="mt-8 border-b border-[#ded8cc] pb-8">
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-[#8a8175]">
            <span>{article.audience}</span>
            <span>{article.readTime}</span>
            <time dateTime={article.publishedAt}>
              Published {new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${article.publishedAt}T00:00:00Z`))}
            </time>
          </div>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">{article.title}</h1>
          <p className="mt-5 text-xl leading-9 text-[#5f594f]">{article.description}</p>
        </header>

        <div className="mt-9 space-y-10">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-lg leading-8 text-[#5f594f]">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="mt-12 rounded-md border border-[#ded8cc] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-[#b37a1a]">Next step</p>
          <h2 className="mt-2 text-2xl font-semibold">Build a cleaner portfolio without rebuilding your whole website.</h2>
          <p className="mt-3 text-base leading-7 text-[#5f594f]">
            PhotoView.io is designed for curated portfolios, mobile lightbox viewing, direct phone imports, Lightroom workflows, and embeds for existing sites.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1d2b22] px-4 text-sm font-semibold text-white hover:bg-[#26382d]" href="/register">
              Start free trial
              <ArrowRight className="size-4" />
            </Link>
            <Link className="inline-flex h-11 items-center rounded-md border border-[#d7cec0] px-4 text-sm font-semibold text-[#1f211e] hover:bg-[#f1ece3]" href="/portfolio-comparison">
              Compare platforms
            </Link>
          </div>
        </aside>
      </article>
      <SiteFooter />
    </main>
  )
}
