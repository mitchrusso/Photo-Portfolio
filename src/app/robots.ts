import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/account"],
    },
    sitemap: "https://photoviewpro.com/sitemap.xml",
  }
}
