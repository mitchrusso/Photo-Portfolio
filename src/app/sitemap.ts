import type { MetadataRoute } from "next"
import { seoArticles } from "@/data/articles"

const baseUrl = "https://photoview.io"

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
    ...seoArticles.map((article) => ({
      url: `${baseUrl}/articles/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ]
}
