import { PublicPortfolioGrid } from "@/components/portfolio/public-portfolio-grid"
import { SiteHeader } from "@/components/site/site-header"
import { migratedGalleries } from "@/data/migrated-galleries"
import type { PortfolioGallery } from "@/lib/gallery-utils"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata = {
  title: "Mitch Russo Travel and Fine Art Photography Portfolio",
  description: "Explore Mitch Russo’s travel and fine art photography galleries, featuring landscapes, night skies, architecture, and field work captured around the world.",
  alternates: { canonical: "/portfolio" },
}

export default function PortfolioPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Mitch Russo Photography Portfolio",
    description: metadata.description,
    author: { "@type": "Person", name: "Mitch Russo" },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: migratedGalleries.map((gallery, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: gallery.name,
        url: `https://photoview.io/demo/${encodeURIComponent(gallery.id)}`,
      })),
    },
    url: "https://photoview.io/portfolio",
  }
  return (
    <main className="min-h-screen bg-black text-white">
      <JsonLd data={structuredData} />
      <SiteHeader />
      <section className="px-6 py-10 md:px-10">
        <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Portfolio</p>
        <h1 className="mt-3 text-4xl font-semibold">Travel Galleries</h1>
        <p className="mt-3 max-w-2xl text-white/60">Curated places, light, weather, and field work from the road.</p>
        <PublicPortfolioGrid demoMode galleries={migratedGalleries as PortfolioGallery[]} />
      </section>
    </main>
  )
}
