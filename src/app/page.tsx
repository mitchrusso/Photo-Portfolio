import { HomeHero } from "@/components/site/home-hero"
import { SiteHeader } from "@/components/site/site-header"
import { migratedGalleries } from "@/data/migrated-galleries"
import {
  Aperture,
  ArrowRight,
  Check,
  Cloud,
  GalleryHorizontalEnd,
  Images,
  MonitorSmartphone,
  PlugZap,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const productShots = [
  { label: "Destination Portfolio", image: migratedGalleries[0]?.cover, count: "24 images" },
  { label: "Client Proofing", image: migratedGalleries[5]?.cover, count: "36 images" },
  { label: "Fine Art Series", image: migratedGalleries[7]?.cover, count: "18 images" },
  { label: "Mobile Showcase", image: migratedGalleries[9]?.cover, count: "12 images" },
]

const featureCards = [
  {
    icon: Images,
    title: "Portfolio-first galleries",
    body: "Lead with full-frame covers, clean filmstrips, keyboard controls, and showcase mode instead of storefront clutter.",
  },
  {
    icon: MonitorSmartphone,
    title: "Built for mobile and desktop",
    body: "Swipe, tap, arrow-key, and full-screen viewing patterns are designed as core product behavior.",
  },
  {
    icon: ShieldCheck,
    title: "Subscriber-controlled display",
    body: "The photographer controls downloads, copy links, watermarks, HDR preference, privacy, cover behavior, and homepage presentation.",
  },
]

const comparisonRows = [
  ["Primary experience", "Commerce and proofing first", "Portfolio display first"],
  ["Mobile viewing", "Often adapted from desktop layouts", "Designed around swipe, lightbox, and gallery grid"],
  ["Homepage", "Template-heavy marketing pages", "Rotating or static portfolio covers with subscriber controls"],
  ["Workflow direction", "Manual uploads and gallery management", "Lightroom-to-portfolio publishing"],
]

const storageTiers = [
  ["Starter", "100 MB", "$1.99/mo or $19.99/year"],
  ["Growth", "1 GB", "$2.99/mo or $29.99/year"],
  ["Studio", "5 GB", "$5.99/mo or $59.99/year"],
  ["Archive", "10 GB", "$9.99/mo or $99.99/year"],
  ["Custom", "Above 10 GB", "Contact us"],
]

export default function HomePage() {
  const allPhotos = migratedGalleries.flatMap((gallery) => gallery.photos ?? [])
  const portraitMobileImage =
    allPhotos.find((photo) => photo.width && photo.height && photo.height > photo.width * 1.15)?.displayUrl ??
    migratedGalleries[0]?.cover
  const landscapeMobileImage =
    allPhotos.find((photo) => photo.width && photo.height && photo.width / photo.height >= 1.65 && photo.width / photo.height <= 1.9)?.displayUrl ??
    migratedGalleries.find((gallery) => gallery.id === "tupper-lake")?.cover ??
    migratedGalleries[1]?.cover

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <SiteHeader />
      <HomeHero />

      <section id="features" className="border-y border-[#ded8cc] bg-[#f5f1ea] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <h2 className="text-3xl font-semibold md:text-5xl">A gallery platform that starts with presentation.</h2>
            </div>
            <p className="max-w-3xl text-lg leading-8 text-[#5f594f]">
              PhotoViewPro is being built for photographers who care about how the work feels when a client, collector, editor, or fan opens a gallery. Proofing, downloads, sales, and storage matter, but the image experience comes first.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, body }) => (
              <div className="rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm" key={title}>
                <Icon className="size-5 text-[#d8a84f]" />
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-base leading-7 text-[#5f594f]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="product" className="bg-[#11130f] px-6 py-16 text-white md:px-10">
        <div className="mx-auto grid max-w-6xl gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div className="rounded-md border border-white/10 bg-[#070707] p-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-white/45">
              <span>Portfolio grid preview</span>
              <span>PhotoViewPro</span>
            </div>
            <div className="grid gap-2 pt-3 sm:grid-cols-2">
              {productShots.map((shot) => (
                <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-white/10" key={shot.label}>
                  {shot.image && <Image alt={`${shot.label} preview`} className="object-cover" fill sizes="420px" src={shot.image} />}
                  <div className="absolute inset-x-0 bottom-0 bg-black/64 px-3 py-2">
                    <p className="text-sm font-semibold">{shot.label}</p>
                    <p className="text-xs text-white/55">{shot.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Product</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">From homepage hero to lightbox, every screen is built around the photograph.</h2>
            <p className="mt-4 text-lg leading-8 text-white/70">
              The public experience can open with a rotating hero, move into gallery covers, then present each gallery with a centered image, left/right navigation, a bottom filmstrip, and a clean mobile lightbox.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-white/70">
              {["Rotating or static homepage cover images", "Dim controls for homepage image readability", "Full-frame gallery covers and adjustable preview sizes", "Subscriber settings for privacy, downloads, HDR, and watermarks"].map((item) => (
                <div className="flex items-center gap-3" key={item}>
                  <Sparkles className="size-4 text-[#d8a84f]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#ded8cc] bg-[#fbfaf7] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Why different</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Not another template-heavy proofing site.</h2>
            <p className="mt-4 text-lg leading-8 text-[#5f594f]">
              Traditional platforms can do many things, but they often make the image presentation compete with commerce, menus, packages, and account features. PhotoViewPro is intentionally narrower at the start: make the portfolio feel excellent, then add business tools around it.
            </p>
          </div>
          <div className="mt-8 overflow-hidden rounded-md border border-[#ded8cc] bg-white shadow-sm">
            <div className="grid grid-cols-[1fr_1fr_1fr] bg-[#f5f1ea] px-4 py-3 text-sm font-semibold text-[#1f211e]">
              <span>Area</span>
              <span>Traditional platforms</span>
              <span>PhotoViewPro direction</span>
            </div>
            {comparisonRows.map(([area, traditional, product]) => (
              <div className="grid grid-cols-[1fr_1fr_1fr] border-t border-[#e8dfd2] px-4 py-4 text-sm text-[#5f594f]" key={area}>
                <span className="font-medium text-[#1f211e]">{area}</span>
                <span>{traditional}</span>
                <span>{product}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f1ea] px-6 py-16 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Mobile</p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight md:text-[2.35rem]">
              A phone gallery that feels intentional, not squeezed down.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#5f594f]">
              The mobile viewer is designed around the way people actually browse images: full-screen, swipeable, quick to exit, and simple enough that the controls do not compete with the photograph.
            </p>
            <div className="mt-6 grid gap-3 text-base text-[#4f4a42]">
              {["Full-screen vertical and landscape lightbox", "Swipe plus visible left/right navigation", "Mobile-optimized display files", "Return-to-grid controls for fast browsing"].map((item) => (
                <div className="flex items-center gap-3" key={item}>
                  <Check className="size-4 text-[#d8a84f]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-[0.9fr_1fr] md:items-center">
            <div className="grid gap-4">
              <div className="mx-auto w-52 rounded-[2rem] border border-white/15 bg-black p-3 shadow-2xl">
                <div className="relative aspect-[9/16] overflow-hidden rounded-[1.45rem] bg-black">
                  {portraitMobileImage && (
                    <Image alt="Portrait mobile lightbox preview" className="object-cover" fill sizes="208px" src={portraitMobileImage} />
                  )}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-black/45 px-3 py-3">
                    <span className="rounded-full border border-white/20 px-3 py-1 text-xs">Portrait</span>
                    <span className="flex size-8 items-center justify-center rounded-full border border-white/20">×</span>
                  </div>
                </div>
              </div>
              <div className="mx-auto w-full max-w-sm rounded-[1.6rem] border border-white/15 bg-black p-3 shadow-2xl">
                <div className="relative aspect-[16/9] overflow-hidden rounded-[1.05rem] bg-black">
                  {landscapeMobileImage && (
                    <Image alt="Landscape mobile lightbox preview" className="object-cover" fill sizes="360px" src={landscapeMobileImage} />
                  )}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-black/45 px-3 py-2">
                    <span className="rounded-full border border-white/20 px-3 py-1 text-xs">Landscape</span>
                    <span className="flex size-7 items-center justify-center rounded-full border border-white/20">×</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm">
              <Aperture className="size-5 text-[#d8a84f]" />
              <h3 className="mt-4 text-xl font-semibold">Optimized without sacrificing originals</h3>
              <p className="mt-3 text-base leading-7 text-[#5f594f]">
                Originals stay preserved in storage. Public viewing can use mobile-friendly display images by default, while HDR/original preference can be enabled by the subscriber when image quality matters more than load time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="border-y border-[#ded8cc] bg-[#fbfaf7] px-6 py-16 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Workflow</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Lightroom to portfolio, without rebuilding the gallery by hand.</h2>
            <p className="mt-4 text-lg leading-8 text-[#5f594f]">
              The Lightroom Classic plugin lets photographers select images, choose or create a portfolio, upload optimized display versions plus originals, and publish directly into PhotoViewPro.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              [UploadCloud, "Export selected images from Lightroom"],
              [GalleryHorizontalEnd, "Create or update a PhotoViewPro portfolio"],
              [Aperture, "Generate desktop and mobile display files"],
              [PlugZap, "Publish with cover, privacy, and client settings"],
            ].map(([Icon, text]) => (
              <div className="flex items-center gap-3 rounded-md border border-[#ded8cc] bg-white px-4 py-4 text-base text-[#4f4a42] shadow-sm" key={text as string}>
                <Icon className="size-5 text-[#d8a84f]" />
                <span>{text as string}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[#f5f1ea] px-6 py-16 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Simple pricing with guardrails against surprise usage.</h2>
            <p className="mt-4 text-lg leading-8 text-[#5f594f]">
              PhotoViewPro starts with a focused portfolio plan. Storage, bandwidth, and file-size limits keep each plan affordable while giving serious publishers a clear upgrade path.
            </p>
            <p className="mt-4 rounded-md border border-[#ded8cc] bg-white p-4 text-base leading-7 text-[#5f594f] shadow-sm">
              PhotoViewPro is not your entire photo business platform yet. It is the fastest, cleanest way to publish a cinematic portfolio from curated work.
            </p>
            <div className="mt-6 rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-[#6f685d]">Starter plan</p>
                  <p className="mt-2 text-5xl font-semibold">$1.99</p>
                </div>
                <p className="pb-2 text-sm text-[#6f685d]">/ month</p>
              </div>
              <p className="mt-2 text-sm text-[#6f685d]">$19.99/year when billed annually. Annual includes two months free.</p>
              <div className="mt-5 grid gap-3 text-sm text-[#4f4a42]">
                {["100 MB storage", "2 GB/month viewing bandwidth", "25 MB/photo upload limit", "Portfolio-first public site", "Mobile and desktop gallery viewing"].map((item) => (
                  <div className="flex items-center gap-3" key={item}>
                    <Check className="size-4 text-[#d8a84f]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Cloud className="size-5 text-[#d8a84f]" />
              <h3 className="text-xl font-semibold">Storage and bandwidth</h3>
            </div>
            <div className="mt-5 overflow-hidden rounded-md border border-[#ded8cc]">
              {storageTiers.map(([name, storage, price]) => (
                <div className="grid gap-2 border-b border-[#e8dfd2] px-4 py-4 last:border-b-0 md:grid-cols-[0.8fr_0.65fr_1.25fr]" key={name}>
                  <span className="text-sm font-semibold text-[#1f211e]">{name}</span>
                  <span className="text-sm text-[#d8a84f]">{storage}</span>
                  {price === "Contact us" ? (
                    <Link className="text-sm font-semibold text-[#1f211e] underline decoration-[#d8a84f] underline-offset-4 hover:text-[#9c6f1d]" href="/storage-contact">
                      Contact us
                    </Link>
                  ) : (
                    <span className="text-sm leading-6 text-[#6f685d]">{price}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 text-sm leading-6 text-[#6f685d]">
              <p>Bandwidth is metered for fair-use plan limits. With Cloudflare R2, public image delivery is no longer priced as a simple per-GB Vercel Blob pass-through, so overage handling should focus on alerts, upgrade prompts, or pausing public delivery when an account exceeds its plan.</p>
              <p>Max subscribers can unlock larger files, higher storage, archival originals, and custom bandwidth planning.</p>
            </div>
            <Link className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-[#1d2b22] px-4 text-sm font-semibold text-white hover:bg-[#26382d]" href="/register">
              Start 14-day trial
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
