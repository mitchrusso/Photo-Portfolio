import { Camera, Images, Map } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { HomeHero } from "@/components/site/home-hero"
import { SiteHeader } from "@/components/site/site-header"
import { migratedGalleries } from "@/data/migrated-galleries"
import type { PortfolioGallery } from "@/lib/gallery-utils"

const featuredGalleries = migratedGalleries.slice(0, 6)

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader />
      <HomeHero galleries={migratedGalleries as PortfolioGallery[]} />

      <section className="border-y border-white/10 px-6 py-10 md:px-10">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            [Images, "Portfolio galleries", "Browse curated bodies of work from travel, landscape, and documentary trips."],
            [Map, "Trips and field notes", "Follow the routes, conditions, and stories behind the photographs."],
            [Camera, "Camera bag", "See the cameras, lenses, bags, and field tools used to make the images."],
          ].map(([Icon, title, body]) => (
            <div className="border-l border-white/15 pl-4" key={title as string}>
              <Icon className="size-5 text-[#d8a84f]" />
              <h2 className="mt-4 text-lg font-semibold">{title as string}</h2>
              <p className="mt-2 text-sm leading-6 text-white/58">{body as string}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-12 md:px-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Featured</p>
            <h2 className="mt-2 text-3xl font-semibold">Recent Galleries</h2>
          </div>
          <Link className="text-sm font-semibold text-white/70 hover:text-white" href="/portfolio">
            All galleries
          </Link>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {featuredGalleries.map((gallery) => (
            <Link className="group relative aspect-[16/10] overflow-hidden rounded-sm border border-white/10" href={`/g/${gallery.id}`} key={gallery.id}>
              <Image
                alt={`${gallery.name} cover`}
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
                fill
                sizes="(min-width: 1280px) 32vw, 90vw"
                src={gallery.cover}
              />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-3">
                <p className="font-semibold">{gallery.name}</p>
                <p className="text-xs text-white/55">{gallery.images} images</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
