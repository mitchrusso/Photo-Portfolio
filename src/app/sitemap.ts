import type { MetadataRoute } from "next"
import { getPublishedSeoArticles, getSeoArticlePublishTime } from "@/data/articles"
import { productTutorials } from "@/data/product-tutorials"

const baseUrl = "https://photoview.io"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/articles",
    "/tutorials",
    "/portfolio-comparison",
    "/portfolio",
    "/contact",
    "/terms",
    "/license",
    "/privacy",
    "/copyright",
    "/whats-in-my-bag",
    "/trips",
  ]

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date("2026-07-07"),
      changeFrequency: route === "/articles" ? "daily" as const : route === "" ? "weekly" as const : "monthly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...getPublishedSeoArticles().map((article) => ({
      url: `${baseUrl}/articles/${article.slug}`,
      lastModified: new Date(getSeoArticlePublishTime(article)),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...productTutorials.map((tutorial) => ({
      url: `${baseUrl}/tutorials/${tutorial.slug}`,
      lastModified: new Date("2026-07-29"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]
}
