import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { getArticleImage } from "@/data/article-images"
import { getMarketingArticle, getPublishedMarketingArticles, PHOTOVIEW_ARTICLE_AUTHOR } from "@/lib/marketing-articles"

export const dynamic = "force-dynamic"

type ArticlePageProps = {
  params: Promise<{ slug: string }>
}

function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

export async function generateStaticParams() {
  return (await getPublishedMarketingArticles()).map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getMarketingArticle(slug)

  if (!article) {
    return {}
  }

  const articleImage = getArticleImage(article.slug)
  const heroImageUrl = articleImage?.src || article.heroImageUrl

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
      images: heroImageUrl ? [{ alt: articleImage?.alt || `Featured photograph for ${article.title}`, url: heroImageUrl }] : [],
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getMarketingArticle(slug)

  if (!article) {
    notFound()
  }

  const articleImage = getArticleImage(article.slug)

  const heroImageUrl = articleImage?.src || article.heroImageUrl
  const heroImageAlt = articleImage?.alt || `Featured photograph for ${article.title}`

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Organization",
      name: PHOTOVIEW_ARTICLE_AUTHOR,
    },
    publisher: {
      "@type": "Organization",
      name: "PhotoView.io",
    },
    image: heroImageUrl,
    keywords: article.keywords.join(", "),
    mainEntityOfPage: `https://photoview.io/articles/${article.slug}`,
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <SiteHeader />
      <script
        dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd) }}
        type="application/ld+json"
      />
      {article.faqJsonLd && (
        <script dangerouslySetInnerHTML={{ __html: safeJsonLd(article.faqJsonLd) }} type="application/ld+json" />
      )}
      <article className="mx-auto max-w-4xl px-6 py-12 md:px-10">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#5f594f] hover:text-[#1f211e]" href="/articles">
          <ArrowLeft className="size-4" />
          Articles &amp; Tutorials
        </Link>
        <header className="mt-8 border-b border-[#ded8cc] pb-8">
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-[#8a8175]">
            <span>{article.audience}</span>
            <span>{article.readTime}</span>
            <span>By {PHOTOVIEW_ARTICLE_AUTHOR}</span>
            <time dateTime={article.publishedAt}>
              Published {new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "America/New_York" }).format(new Date(article.publishedAt))}
            </time>
          </div>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">{article.title}</h1>
          <p className="mt-5 text-xl leading-9 text-[#5f594f]">{article.description}</p>
        </header>

        {heroImageUrl && (
          <figure className="mt-9 overflow-hidden rounded-md border border-[#ded8cc] bg-white shadow-sm">
            {articleImage ? (
              <Image
                alt={heroImageAlt}
                className="h-auto w-full"
                height={articleImage.height}
                priority
                sizes="(max-width: 896px) 100vw, 896px"
                src={heroImageUrl}
                width={articleImage.width}
              />
            ) : (
              // The provider URL is validated as HTTPS during synchronization.
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={heroImageAlt} className="h-auto w-full" src={heroImageUrl} />
            )}
            {articleImage?.caption && (
              <figcaption className="px-5 py-3 text-sm leading-6 text-[#6f675d]">{articleImage.caption}</figcaption>
            )}
          </figure>
        )}

        {article.sections ? (
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
        ) : (
          <div
            className="mt-9 space-y-5 text-lg leading-8 text-[#5f594f] [&_a]:font-semibold [&_a]:text-[#1d2b22] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[#d8a84f] [&_blockquote]:pl-5 [&_figcaption]:text-sm [&_h2]:pt-5 [&_h2]:text-3xl [&_h2]:font-semibold [&_h3]:pt-3 [&_h3]:text-2xl [&_h3]:font-semibold [&_img]:h-auto [&_img]:max-w-full [&_li]:ml-6 [&_ol]:list-decimal [&_p]:my-4 [&_table]:w-full [&_ul]:list-disc"
            dangerouslySetInnerHTML={{ __html: article.html || "" }}
          />
        )}

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
