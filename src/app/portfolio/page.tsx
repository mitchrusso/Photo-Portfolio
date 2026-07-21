import { PublicPortfolioGrid } from "@/components/portfolio/public-portfolio-grid"
import { SiteHeader } from "@/components/site/site-header"
import { migratedGalleries } from "@/data/migrated-galleries"
import type { PortfolioGallery } from "@/lib/gallery-utils"

export const metadata = {
  title: "Portfolio | Mitch Russo Photography",
  description: "Travel and fine art photography galleries by Mitch Russo.",
}

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-black text-white">
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
