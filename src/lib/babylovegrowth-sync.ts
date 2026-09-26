import "server-only"

import { z } from "zod"

import { seoArticles } from "@/data/articles"
import { Prisma } from "@/generated/prisma/client"
import { babyLoveGrowthRequest } from "@/lib/babylovegrowth-api"
import {
  babyLoveGrowthArticleSchema,
  contentFingerprint,
  prepareBabyLoveGrowthArticle,
} from "@/lib/babylovegrowth-content"
import { getPrismaClient } from "@/lib/db"

export const BABYLOVEGROWTH_SOURCE = "BABYLOVEGROWTH"
const ARTICLE_PAGE_SIZE = 50
export type BabyLoveGrowthSyncResult = {
  created: number
  duplicates: number
  fetched: number
  skipped: number
  unpublished: number
  updated: number
}

const staticArticleSlugs = new Set(seoArticles.map((article) => article.slug))
const staticArticleTitles = new Set(seoArticles.map((article) => article.title.toLowerCase().replace(/\s+/g, " ").trim()))
const staticContentHashes = new Set(seoArticles.map((article) => contentFingerprint(
  article.title,
  article.sections.flatMap((section) => [section.heading, ...section.body]).join(" "),
)))

function isPrismaUniqueConstraintError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002")
}

function summaryMatchesStoredArticle(
  summaryUpdatedAt: string | null | undefined,
  storedUpdatedAt: Date | null,
) {
  if (!summaryUpdatedAt || !storedUpdatedAt) return false
  const parsed = new Date(summaryUpdatedAt)
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() === storedUpdatedAt.getTime()
}

export async function storeBabyLoveGrowthArticle(input: unknown) {
  const prepared = prepareBabyLoveGrowthArticle(input)
  const prisma = getPrismaClient()
  const existing = await prisma.marketingArticle.findUnique({
    where: {
      source_sourceArticleId: {
        source: BABYLOVEGROWTH_SOURCE,
        sourceArticleId: prepared.sourceArticleId,
      },
    },
  })

  const normalizedTitle = prepared.title.toLowerCase().replace(/\s+/g, " ").trim()
  if (staticArticleSlugs.has(prepared.slug) || staticArticleTitles.has(normalizedTitle) || staticContentHashes.has(prepared.contentHash)) {
    if (existing?.isPublished) {
      await prisma.marketingArticle.update({ data: { isPublished: false, lastSyncedAt: new Date() }, where: { id: existing.id } })
    }
    return { action: "duplicate" as const, article: existing }
  }

  const conflict = await prisma.marketingArticle.findFirst({
    where: {
      ...(existing ? { NOT: { id: existing.id } } : {}),
      OR: [
        { slug: prepared.slug },
        { contentHash: prepared.contentHash },
        { title: { equals: prepared.title, mode: "insensitive" } },
      ],
    },
  })
  if (conflict) {
    if (existing?.isPublished) {
      await prisma.marketingArticle.update({ data: { isPublished: false, lastSyncedAt: new Date() }, where: { id: existing.id } })
    }
    return { action: "duplicate" as const, article: conflict }
  }

  const data = {
    contentHash: prepared.contentHash,
    contentHtml: prepared.contentHtml,
    description: prepared.description,
    excerpt: prepared.excerpt,
    faqJsonLd: prepared.faqJsonLd
      ? JSON.parse(JSON.stringify(prepared.faqJsonLd)) as Prisma.InputJsonValue
      : Prisma.JsonNull,
    heroImageUrl: prepared.heroImageUrl,
    isPublished: prepared.isPublished,
    keywords: prepared.keywords,
    languageCode: prepared.languageCode,
    lastSyncedAt: new Date(),
    publishedAt: prepared.publishedAt,
    slug: existing?.slug || prepared.slug,
    source: BABYLOVEGROWTH_SOURCE,
    sourceArticleId: prepared.sourceArticleId,
    sourceCreatedAt: prepared.sourceCreatedAt,
    sourceSlug: prepared.sourceSlug,
    sourceUpdatedAt: prepared.sourceUpdatedAt,
    title: prepared.title,
  }

  try {
    if (existing) {
      return { action: "updated" as const, article: await prisma.marketingArticle.update({ data, where: { id: existing.id } }) }
    }
    return { action: "created" as const, article: await prisma.marketingArticle.create({ data }) }
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) return { action: "duplicate" as const, article: null }
    throw error
  }
}

export async function syncBabyLoveGrowthArticles(): Promise<BabyLoveGrowthSyncResult> {
  const result: BabyLoveGrowthSyncResult = { created: 0, duplicates: 0, fetched: 0, skipped: 0, unpublished: 0, updated: 0 }
  const activeSourceIds: string[] = []
  const prisma = getPrismaClient()
  const storedArticles = await prisma.marketingArticle.findMany({
    select: { sourceArticleId: true, sourceUpdatedAt: true },
    where: { source: BABYLOVEGROWTH_SOURCE },
  })
  const storedBySourceId = new Map(storedArticles.map((article) => [article.sourceArticleId, article]))

  for (let offset = 0; ; offset += ARTICLE_PAGE_SIZE) {
    const page = await babyLoveGrowthRequest<unknown>(`v1/articles?limit=${ARTICLE_PAGE_SIZE}&offset=${offset}`)
    const summaries = z.array(babyLoveGrowthArticleSchema).parse(page)
    if (summaries.length === 0) break

    for (const summary of summaries) {
      if (summary.published === false) continue
      const sourceArticleId = String(summary.id)
      activeSourceIds.push(sourceArticleId)
      const stored = storedBySourceId.get(sourceArticleId)
      if (stored && summaryMatchesStoredArticle(summary.updated_at, stored.sourceUpdatedAt)) {
        result.skipped += 1
        continue
      }
      const detail = await babyLoveGrowthRequest<unknown>(`v1/articles/${encodeURIComponent(sourceArticleId)}`)
      const saved = await storeBabyLoveGrowthArticle({ ...summary, ...babyLoveGrowthArticleSchema.parse(detail) })
      result.fetched += 1
      result[saved.action === "duplicate" ? "duplicates" : saved.action] += 1
    }

    if (summaries.length < ARTICLE_PAGE_SIZE) break
  }

  if (activeSourceIds.length > 0) {
    const unpublished = await prisma.marketingArticle.updateMany({
      data: { isPublished: false, lastSyncedAt: new Date() },
      where: {
        isPublished: true,
        source: BABYLOVEGROWTH_SOURCE,
        sourceArticleId: { notIn: activeSourceIds },
      },
    })
    result.unpublished = unpublished.count
  }
  return result
}
