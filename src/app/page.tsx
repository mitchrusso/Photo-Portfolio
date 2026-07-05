import { PublicPortfolioGrid } from "@/components/portfolio/public-portfolio-grid"
import { HomeHero } from "@/components/site/home-hero"
import { SiteHeader } from "@/components/site/site-header"
import { migratedGalleries } from "@/data/migrated-galleries"
import type { PortfolioGallery } from "@/lib/gallery-utils"
import { Aperture, Images, MonitorSmartphone, PlugZap, ShieldCheck, Sparkles } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  const demoGalleries = migratedGalleries.slice(0, 4)
  const mobileGallery = migratedGalleries.find((gallery) => gallery.id === "tupper-lake") ?? migratedGalleries[1]

  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader />
      <HomeHero galleries={migratedGalleries as PortfolioGallery[]} />

      <section className="border-y border-white/10 bg-white/[0.03] px-6 py-14 md:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Why PhotoViewPro</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-5xl">A portfolio experience first. Everything else second.</h2>
          </div>
          <p className="max-w-3xl text-base leading-8 text-white/62">
            Traditional gallery platforms are powerful, but they often feel like proofing stores with portfolio viewing added on. PhotoViewPro starts with the presentation: full-frame images, clean controls, fast mobile browsing, and subscriber-owned settings that decide how visitors experience the work.
          </p>
        </div>

        <div id="features" className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            [Images, "Full-frame presentation", "Covers, filmstrips, lightbox navigation, and showcase mode are designed around viewing the image, not managing the store."],
            [MonitorSmartphone, "Mobile and desktop by design", "Landscape, portrait, swipe, keyboard, and large-screen viewing are treated as first-class display modes."],
            [ShieldCheck, "Photographer-controlled delivery", "Downloads, copy links, HDR preference, watermarks, privacy, and cover behavior belong to the subscriber, not the visitor."],
          ].map(([Icon, title, body]) => (
            <div className="rounded-md border border-white/10 bg-black p-5" key={title as string}>
              <Icon className="size-5 text-[#d8a84f]" />
              <h3 className="mt-5 text-lg font-semibold">{title as string}</h3>
              <p className="mt-3 text-sm leading-6 text-white/58">{body as string}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-14 md:px-10">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div className="rounded-md border border-white/10 bg-[#070707] p-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-white/45">
              <span>Desktop portfolio grid</span>
              <span>PhotoViewPro</span>
            </div>
            <div className="grid gap-2 pt-3 sm:grid-cols-2">
              {demoGalleries.map((gallery) => (
                <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-white/10" key={gallery.id}>
                  <Image alt={`${gallery.name} preview`} className="object-cover" fill sizes="420px" src={gallery.cover} />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2">
                    <p className="text-sm font-semibold">{gallery.name}</p>
                    <p className="text-xs text-white/55">{gallery.images} images</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Built to show the work</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Screens that feel like a portfolio, not an admin panel.</h2>
            <p className="mt-4 text-base leading-8 text-white/62">
              Your public site can open with a rotating hero, dimmed or shown exactly as uploaded, then move straight into the gallery grid. Visitors get a simple path: choose a gallery, view the cover, move through the filmstrip, and open a clean lightbox.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-white/70">
              {["Adjustable gallery cover sizes", "Full-frame gallery covers", "Showcase mode for distraction-free viewing", "Subscriber settings for downloads, copying, HDR, and watermarks"].map((item) => (
                <div className="flex items-center gap-3" key={item}>
                  <Sparkles className="size-4 text-[#d8a84f]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03] px-6 py-14 md:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Mobile presentation</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">The phone experience is not an afterthought.</h2>
            <p className="mt-4 text-base leading-8 text-white/62">
              PhotoViewPro emphasizes touch-first viewing: swipe navigation, full-screen lightbox mode, visible left/right controls, mobile-optimized display files, and clean exits back to the gallery grid.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-[0.8fr_1fr] md:items-center">
            <div className="mx-auto w-56 rounded-[2rem] border border-white/15 bg-black p-3 shadow-2xl">
              <div className="relative aspect-[9/16] overflow-hidden rounded-[1.45rem] bg-black">
                <Image alt={`${mobileGallery.name} mobile lightbox`} className="object-cover" fill sizes="224px" src={mobileGallery.cover} />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-black/45 px-3 py-3">
                  <span className="rounded-full border border-white/20 px-3 py-1 text-xs">Gallery grid</span>
                  <span className="flex size-8 items-center justify-center rounded-full border border-white/20">×</span>
                </div>
              </div>
            </div>
            <div className="rounded-md border border-white/10 bg-black p-5">
              <Aperture className="size-5 text-[#d8a84f]" />
              <h3 className="mt-4 text-xl font-semibold">Optimized without sacrificing originals</h3>
              <p className="mt-3 text-sm leading-7 text-white/58">
                Originals stay preserved in storage. Public viewing can use mobile-friendly display images by default, while HDR/original preference can be enabled by the subscriber when image quality matters more than load time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="lightroom" className="px-6 py-14 md:px-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Next workflow</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Lightroom to portfolio, without the busywork.</h2>
            <p className="mt-4 text-base leading-8 text-white/62">
              The planned Lightroom plugin will let photographers select images, choose or create a portfolio, upload optimized display versions plus originals, and publish directly into PhotoViewPro.
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-[#070707] p-5">
            <div className="flex items-center gap-3">
              <PlugZap className="size-5 text-[#d8a84f]" />
              <h3 className="text-xl font-semibold">Lightroom plugin roadmap</h3>
            </div>
            <div className="mt-5 grid gap-3 text-sm text-white/68">
              {["Export selected photos to a new or existing portfolio", "Generate mobile and desktop display files during upload", "Preserve full-resolution originals in storage", "Assign covers, gallery names, visibility, and client status from the export flow"].map((item) => (
                <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3" key={item}>{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-14 md:px-10">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Portfolio</p>
          <h2 className="mt-2 text-3xl font-semibold">Live gallery demo</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">
            These galleries use the same viewing patterns PhotoViewPro will package for photographers: cover grids, gallery presentation, filmstrip navigation, mobile lightbox, and subscriber-controlled settings.
          </p>
        </div>
        <PublicPortfolioGrid galleries={migratedGalleries as PortfolioGallery[]} />
      </section>
    </main>
  )
}
