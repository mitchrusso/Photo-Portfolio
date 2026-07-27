import type { MetadataRoute } from "next"
import { getPublishedSeoArticles, getSeoArticlePublishTime } from "@/data/articles"

const baseUrl = "https://photoview.io"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/articles",
    "/portfolio-comparison",
    "/portfolio",
    "/register",
    "/login",
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
      priority: route === "" ? 1 : route === "/register" ? 0.9 : 0.7,
    })),
    ...getPublishedSeoArticles().map((article) => ({
      url: `${baseUrl}/articles/${article.slug}`,
      lastModified: new Date(getSeoArticlePublishTime(article)),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ]
}
