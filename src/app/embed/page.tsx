import { PublicPortfolioGrid } from "@/components/portfolio/public-portfolio-grid"
import { migratedGalleries } from "@/data/migrated-galleries"
import type { PortfolioGallery } from "@/lib/gallery-utils"

export const metadata = {
  title: "Embedded Portfolio Grid | PhotoViewPro",
  description: "A clean embeddable PhotoViewPro portfolio grid.",
  robots: {
    index: false,
    follow: true,
  },
}

export default function EmbedPortfolioPage() {
  return (
    <main className="min-h-screen bg-black px-3 py-3 text-white">
      <PublicPortfolioGrid galleries={migratedGalleries as PortfolioGallery[]} />
    </main>
  )
}
