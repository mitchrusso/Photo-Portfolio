import "server-only"

import { getPublishedSeoArticles, getSeoArticle, getSeoArticlePublishTime, type SeoArticle } from "@/data/articles"
import { getPrismaClient } from "@/lib/db"

export const PHOTOVIEW_ARTICLE_AUTHOR = "PhotoView.io"

export type PublicMarketingArticle = {
  audience: string
  description: string
  excerpt: string | null
  faqJsonLd: Record<string, unknown> | null
  heroImageUrl: string | null
  html: string | null
  keywords: string[]
  languageCode: string
  publishedAt: string
  readTime: string
  sections: SeoArticle["sections"] | null
  slug: string
  title: string
  updatedAt: string
}

function estimateReadTime(html: string) {
  const wordCount = html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.ceil(wordCount / 200))} min read`
}

function staticArticleToPublic(article: SeoArticle): PublicMarketingArticle {
  const publishedAt = getSeoArticlePublishTime(article)
  return {
    audience: article.audience,
    description: article.description,
    excerpt: article.description,
    faqJsonLd: null,
    heroImageUrl: null,
    html: null,
    keywords: article.keywords,
    languageCode: "en",
    publishedAt,
    readTime: article.readTime,
    sections: article.sections,
    slug: article.slug,
    title: article.title,
    updatedAt: publishedAt,
  }
}

function jsonStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === "string").slice(0, 30)
}

function jsonObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function syncedArticleToPublic(article: {
  contentHtml: string
  description: string
  excerpt: string | null
  faqJsonLd: unknown
  heroImageUrl: string | null
  keywords: unknown
  languageCode: string
  publishedAt: Date
  slug: string
  title: string
  updatedAt: Date
}): PublicMarketingArticle {
  return {
    audience: "Photographers",
    description: article.description,
    excerpt: article.excerpt,
    faqJsonLd: jsonObject(article.faqJsonLd),
    heroImageUrl: article.heroImageUrl,
    html: article.contentHtml,
    keywords: jsonStringArray(article.keywords),
    languageCode: article.languageCode,
    publishedAt: article.publishedAt.toISOString(),
    readTime: estimateReadTime(article.contentHtml),
    sections: null,
    slug: article.slug,
    title: article.title,
    updatedAt: article.updatedAt.toISOString(),
  }
}

export async function getPublishedMarketingArticles(now = new Date()) {
  const staticArticles = getPublishedSeoArticles(now).map(staticArticleToPublic)
  if (!process.env.DATABASE_URL) return staticArticles

  const syncedArticles = await getPrismaClient().marketingArticle.findMany({
    orderBy: { publishedAt: "desc" },
    where: { isPublished: true, publishedAt: { lte: now } },
  })
  const staticSlugs = new Set(staticArticles.map((article) => article.slug))

  return [
    ...staticArticles,
    ...syncedArticles.filter((article) => !staticSlugs.has(article.slug)).map(syncedArticleToPublic),
  ]
}

export async function getMarketingArticle(slug: string, now = new Date()) {
  const staticArticle = getSeoArticle(slug)
  if (staticArticle && new Date(getSeoArticlePublishTime(staticArticle)) <= now) {
    return staticArticleToPublic(staticArticle)
  }
  if (!process.env.DATABASE_URL) return null

  const syncedArticle = await getPrismaClient().marketingArticle.findFirst({
    where: { isPublished: true, publishedAt: { lte: now }, slug },
  })
  return syncedArticle ? syncedArticleToPublic(syncedArticle) : null
}
