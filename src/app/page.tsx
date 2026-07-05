import { PublicPortfolioGrid } from "@/components/portfolio/public-portfolio-grid"
import { HomeHero } from "@/components/site/home-hero"
import { SiteHeader } from "@/components/site/site-header"
import { migratedGalleries } from "@/data/migrated-galleries"
import type { PortfolioGallery } from "@/lib/gallery-utils"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader />
      <HomeHero galleries={migratedGalleries as PortfolioGallery[]} />

      <section className="px-6 py-10 md:px-10">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Portfolio</p>
          <h2 className="mt-2 text-3xl font-semibold">Galleries</h2>
        </div>
        <PublicPortfolioGrid galleries={migratedGalleries as PortfolioGallery[]} />
      </section>
    </main>
  )
}
