import { createHash } from "node:crypto"
import sanitizeHtml from "sanitize-html"
import { z } from "zod"

const MAX_ARTICLE_HTML_BYTES = 2 * 1024 * 1024

export const babyLoveGrowthArticleSchema = z.object({
  id: z.union([z.string().min(1), z.number().int().nonnegative()]),
  title: z.string().trim().min(1).max(300),
  slug: z.string().trim().min(1).max(300).optional(),
  content_html: z.string().max(MAX_ARTICLE_HTML_BYTES).optional(),
  content_markdown: z.string().max(MAX_ARTICLE_HTML_BYTES).optional(),
  meta_description: z.string().trim().max(500).optional().nullable(),
  metaDescription: z.string().trim().max(500).optional().nullable(),
  excerpt: z.string().trim().max(1_000).optional().nullable(),
  hero_image_url: z.string().trim().max(2_000).optional().nullable(),
  heroImageUrl: z.string().trim().max(2_000).optional().nullable(),
  languageCode: z.string().trim().max(20).optional().nullable(),
  keywords: z.array(z.string()).max(100).optional().default([]),
  faqJsonLd: z.unknown().optional(),
  created_at: z.string().trim().max(100).optional().nullable(),
  createdAt: z.string().trim().max(100).optional().nullable(),
  updated_at: z.string().trim().max(100).optional().nullable(),
  published: z.boolean().optional(),
}).passthrough()

export type PreparedMarketingArticle = {
  contentHash: string
  contentHtml: string
  description: string
  excerpt: string | null
  faqJsonLd: Record<string, unknown> | null
  heroImageUrl: string | null
  isPublished: boolean
  keywords: string[]
  languageCode: string
  publishedAt: Date
  slug: string
  sourceArticleId: string
  sourceCreatedAt: Date | null
  sourceSlug: string | null
  sourceUpdatedAt: Date | null
  title: string
}

function cleanText(value: string | null | undefined, maxLength: number) {
  return (value || "").replace(/\s+/g, " ").trim().slice(0, maxLength)
}

function parseDate(value: string | null | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function safeHttpsUrl(value: string | null | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" || url.username || url.password) return null
    return url.toString()
  } catch {
    return null
  }
}

function normalizeSlug(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180)
}

function plainTextFromHtml(value: string) {
  return sanitizeHtml(value, { allowedAttributes: {}, allowedTags: [] })
}

export function contentFingerprint(title: string, content: string) {
  const normalized = `${plainTextFromHtml(title)} ${plainTextFromHtml(content)}`
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
  return createHash("sha256").update(normalized).digest("hex")
}

export function sanitizeBabyLoveGrowthHtml(value: string) {
  return sanitizeHtml(value, {
    allowedAttributes: {
      a: ["href", "rel", "target", "title"],
      img: ["alt", "height", "src", "title", "width"],
    },
    allowedSchemes: ["https", "mailto"],
    allowedSchemesByTag: { img: ["https"] },
    allowedTags: [
      "a", "blockquote", "br", "code", "em", "figcaption", "figure", "h2", "h3", "h4",
      "hr", "img", "li", "ol", "p", "pre", "strong", "table", "tbody", "td", "th", "thead", "tr", "ul",
    ],
    enforceHtmlBoundary: true,
    nonTextTags: ["script", "style", "textarea", "option", "noscript"],
    transformTags: {
      a: (_tagName, attribs) => ({
        attribs: { ...attribs, rel: "nofollow noopener noreferrer", target: "_blank" },
        tagName: "a",
      }),
      h1: "h2",
    },
  }).trim()
}

function sanitizeFaqJsonLd(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const input = value as Record<string, unknown>
  if (input["@type"] !== "FAQPage" || !Array.isArray(input.mainEntity)) return null

  const mainEntity = input.mainEntity.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return []
    const question = entry as Record<string, unknown>
    const answer = question.acceptedAnswer
    if (!answer || typeof answer !== "object" || Array.isArray(answer)) return []
    const answerRecord = answer as Record<string, unknown>
    const name = cleanText(typeof question.name === "string" ? question.name : "", 300)
    const text = cleanText(typeof answerRecord.text === "string" ? plainTextFromHtml(answerRecord.text) : "", 2_000)
    if (!name || !text) return []
    return [{
      "@type": "Question",
      acceptedAnswer: { "@type": "Answer", text },
      name,
    }]
  }).slice(0, 30)

  if (mainEntity.length === 0) return null
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity }
}

export function prepareBabyLoveGrowthArticle(input: unknown): PreparedMarketingArticle {
  const article = babyLoveGrowthArticleSchema.parse(input)
  const title = cleanText(article.title, 300)
  const slug = normalizeSlug(article.slug || title || String(article.id))
  if (!slug) throw new Error("BabyLoveGrowth article did not provide a usable slug.")

  const contentHtml = sanitizeBabyLoveGrowthHtml(article.content_html || "")
  if (!contentHtml) throw new Error("BabyLoveGrowth article did not provide usable HTML content.")

  const sourceCreatedAt = parseDate(article.created_at || article.createdAt)
  const sourceUpdatedAt = parseDate(article.updated_at)
  const excerpt = cleanText(article.excerpt, 1_000) || null
  const description = cleanText(article.meta_description || article.metaDescription || excerpt || title, 500)

  return {
    contentHash: contentFingerprint(title, contentHtml),
    contentHtml,
    description,
    excerpt,
    faqJsonLd: sanitizeFaqJsonLd(article.faqJsonLd),
    heroImageUrl: safeHttpsUrl(article.hero_image_url || article.heroImageUrl),
    isPublished: article.published !== false,
    keywords: [...new Set(article.keywords.map((keyword) => cleanText(keyword, 100)).filter(Boolean))].slice(0, 30),
    languageCode: cleanText(article.languageCode, 20) || "en",
    publishedAt: sourceCreatedAt || new Date(),
    slug,
    sourceArticleId: String(article.id),
    sourceCreatedAt,
    sourceSlug: article.slug || null,
    sourceUpdatedAt,
    title,
  }
}
