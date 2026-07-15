import { PublicPortfolioGrid } from "@/components/portfolio/public-portfolio-grid"
import { SiteHeader } from "@/components/site/site-header"
import { migratedGalleries } from "@/data/migrated-galleries"
import type { PortfolioGallery } from "@/lib/gallery-utils"

export const metadata = {
  title: "Portfolio Demo | PhotoView.io",
  description: "Explore a curated PhotoView.io portfolio across desktop and mobile.",
}

const demoGalleryIds = new Set(["sloss-furnaces", "myanmar", "lofoten-norway"])
const demoGalleries = migratedGalleries.filter((gallery) => demoGalleryIds.has(gallery.id))

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader />
      <section className="px-6 py-10 md:px-10">
        <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Curated demo</p>
        <h1 className="mt-3 text-4xl font-semibold">See PhotoView.io in action</h1>
        <p className="mt-3 max-w-2xl text-white/60">
          Open one of three selected portfolios to experience the gallery grid, full-screen viewer, keyboard navigation, and mobile lightbox.
        </p>
        <PublicPortfolioGrid demoMode galleries={demoGalleries as PortfolioGallery[]} />
      </section>
    </main>
  )
}
