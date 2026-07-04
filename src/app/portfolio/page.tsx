import Image from "next/image"
import Link from "next/link"
import { SiteHeader } from "@/components/site/site-header"
import { migratedGalleries } from "@/data/migrated-galleries"

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
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {migratedGalleries.map((gallery) => (
            <Link className="group relative aspect-[16/10] overflow-hidden rounded-sm border border-white/10" href={`/g/${gallery.id}`} key={gallery.id}>
              <Image alt={`${gallery.name} cover`} className="object-cover transition duration-300 group-hover:scale-[1.03]" fill sizes="25vw" src={gallery.cover} />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2">
                <p className="text-sm font-semibold">{gallery.name}</p>
                <p className="text-xs text-white/55">{gallery.images} images</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
