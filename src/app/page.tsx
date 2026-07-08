import { HomeHero } from "@/components/site/home-hero"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { migratedGalleries } from "@/data/migrated-galleries"
import {
  Aperture,
  ArrowRight,
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Code2,
  GalleryHorizontalEnd,
  Images,
  MonitorSmartphone,
  PlugZap,
  ShieldCheck,
  Sparkles,
  Smartphone,
  UploadCloud,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { accountFilePolicy } from "@/lib/account-policy"

const productShots = [
  { label: "Destination Portfolio", image: migratedGalleries[0]?.cover, count: "24 images" },
  { label: "Client Proofing", image: migratedGalleries[5]?.cover, count: "36 images" },
  { label: "Fine Art Series", image: migratedGalleries[7]?.cover, count: "18 images" },
  { label: "Mobile Portfolio", image: migratedGalleries[9]?.cover, count: "12 images" },
]

const featureCards = [
  {
    icon: Images,
    title: "Multiple portfolio galleries",
    body: "Create separate portfolios for travel, weddings, events, client work, fine art, or any curated series, each with its own cover, order, visibility, and sharing controls.",
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
  {
    icon: Bot,
    title: "AI help throughout",
    body: "Subscribers can ask PhotoViewPro how to set up covers, embeds, imports, sharing, mobile viewing, billing, and gallery controls without digging through documentation.",
  },
  {
    icon: Smartphone,
    title: "Direct phone import",
    body: "Choose photos from a mobile device, review thumbnails in batches of 50, import only the keepers, then choose the cover and hide anything that should not be public.",
  },
  {
    icon: Code2,
    title: "Embed anywhere",
    body: "Copy one block of code to place a PhotoViewPro portfolio or full gallery grid inside an existing website without rebuilding the photographer's whole site.",
  },
]

const comparisonRows = [
  ["Primary experience", "Commerce and proofing first", "Portfolio display first"],
  ["Mobile viewing", "Often adapted from desktop layouts", "Designed around swipe, lightbox, and gallery grid"],
  ["Homepage", "Template-heavy marketing pages", "Rotating or static portfolio covers with subscriber controls"],
  ["Workflow direction", "Manual uploads and gallery management", "Lightroom-to-portfolio publishing"],
]

const storageTiers = [
  ["Starter", "2 GB storage · 5 GB bandwidth", "$1.99/mo or $19.99/year"],
  ["Growth", "10 GB storage · 20 GB bandwidth", "$2.99/mo or $29.99/year"],
  ["Studio", "25 GB storage · 50 GB bandwidth", "$5.99/mo or $59.99/year"],
  ["Archive", "75 GB storage · 150 GB bandwidth", "$9.99/mo or $99.99/year"],
  ["Custom", "100 GB+ storage", "Contact us"],
]

const mobilePreviewImages = {
  portrait: "/marketing-preview/mobile-tree-milky-way.png",
  landscape: "/marketing-preview/mobile-ice-cave.png",
}

export default function HomePage() {
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

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

      <section className="bg-white px-6 py-14 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
          {[
            {
              icon: Bot,
              label: "Ask AI How To...",
              text: "Context-aware subscriber help is available inside the dashboard for setup, gallery controls, sharing, imports, and account questions.",
            },
            {
              icon: Smartphone,
              label: "Phone to portfolio",
              text: "Start on the device where the photos already are. Select mobile images, review 50 thumbnails at a time, and turn the best ones into a new portfolio.",
            },
            {
              icon: Code2,
              label: "Use your existing website",
              text: "Embed one portfolio or the entire portfolio grid on any site that accepts an iframe or custom HTML block.",
            },
          ].map(({ icon: Icon, label, text }) => (
            <div className="rounded-md border border-[#ded8cc] bg-[#fbfaf7] p-5 shadow-sm" key={label}>
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-md bg-[#1d2b22] text-white">
                  <Icon className="size-5" />
                </span>
                <h2 className="text-lg font-semibold">{label}</h2>
              </div>
              <p className="mt-4 text-base leading-7 text-[#5f594f]">{text}</p>
            </div>
          ))}
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
          <div className="grid gap-5 md:grid-cols-[0.95fr_1fr] md:items-center">
            <div className="grid gap-5">
              <div className="mx-auto w-56 rounded-[2.85rem] bg-[#050505] p-3 shadow-2xl shadow-black/25 ring-1 ring-black/20">
                <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2.25rem] bg-black">
                  <div className="absolute left-1/2 top-2.5 z-20 h-4 w-20 -translate-x-1/2 rounded-full bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" />
                  <Image alt="Vertical phone lightbox preview with Milky Way tree photograph" className="object-cover" fill sizes="224px" src={mobilePreviewImages.portrait} />
                  <button
                    aria-label="Previous photo preview"
                    className="absolute left-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white"
                    type="button"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    aria-label="Next photo preview"
                    className="absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white"
                    type="button"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 z-20 h-1 w-20 -translate-x-1/2 rounded-full bg-white/55" />
                </div>
              </div>
              <div className="mx-auto w-full max-w-sm rounded-[2.4rem] bg-[#050505] p-3 shadow-2xl shadow-black/25 ring-1 ring-black/20">
                <div className="relative aspect-[19.5/9] overflow-hidden rounded-[1.8rem] bg-black">
                  <div className="absolute left-2.5 top-1/2 z-20 h-16 w-4 -translate-y-1/2 rounded-full bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" />
                  <Image alt="Landscape phone lightbox preview with blue ice cave photograph" className="object-cover" fill sizes="384px" src={mobilePreviewImages.landscape} />
                  <button
                    aria-label="Previous landscape preview"
                    className="absolute left-5 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white"
                    type="button"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    aria-label="Next landscape preview"
                    className="absolute right-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white"
                    type="button"
                  >
                    <ChevronRight className="size-5" />
                  </button>
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
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">From phone, Lightroom, or existing site to a finished portfolio.</h2>
            <p className="mt-4 text-lg leading-8 text-[#5f594f]">
              PhotoViewPro is designed around the real ways photographers already work: import from the phone, publish from Lightroom, ask AI for setup help, then share or embed the finished portfolio anywhere it needs to live.
            </p>
            <div className="mt-6 rounded-md border border-[#ded8cc] bg-white p-4 text-sm leading-6 text-[#5f594f] shadow-sm">
              You can run multiple portfolios at once, each with its own cover, order, hidden photos, captions, privacy, sharing, and embed code.
            </div>
          </div>
          <div className="grid gap-3">
            {[
              [Smartphone, "Import directly from a phone and review selected thumbnails 50 at a time"],
              [UploadCloud, "Export selected images from Lightroom into a new or existing portfolio"],
              [Aperture, "Generate optimized desktop, mobile, and thumbnail display files"],
              [GalleryHorizontalEnd, "Choose the cover, hide weak images, caption photos, and drag the order"],
              [Bot, "Ask AI how to handle setup, sharing, imports, covers, embeds, and account questions"],
              [Code2, "Embed one portfolio or the full portfolio grid on an existing website"],
              [PlugZap, "Publish with privacy, download, watermark, HDR, and client settings"],
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
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Generous portfolio storage with sensible guardrails.</h2>
            <p className="mt-4 text-lg leading-8 text-[#5f594f]">
              PhotoViewPro is priced for curated publishing, not nickel-and-diming every photograph. Each plan includes room for real portfolios, while file-size and usage guardrails keep the service fast, fair, and affordable.
            </p>
            <p className="mt-4 rounded-md border border-[#ded8cc] bg-white p-4 text-base leading-7 text-[#5f594f] shadow-sm">
              PhotoViewPro is not your entire photo business platform yet. It is the fastest, cleanest way to publish a cinematic portfolio from curated work, with enough storage to keep your best work online.
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
                {["2 GB portfolio storage", "5 GB/month viewing bandwidth", "100 MB/photo upload limit", "Portfolio-first public site", "Mobile and desktop gallery viewing"].map((item) => (
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
              <h3 className="text-xl font-semibold">Portfolio storage and viewing bandwidth</h3>
            </div>
            <div className="mt-5 overflow-hidden rounded-md border border-[#ded8cc]">
              {storageTiers.map(([name, storage, price]) => (
                <div className="grid gap-2 border-b border-[#e8dfd2] px-4 py-4 last:border-b-0 md:grid-cols-[0.7fr_1.15fr_1.15fr]" key={name}>
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
              <p>Plans are designed for curated portfolios, display files, embeds, and public sharing. Originals can be preserved, while public delivery uses optimized images for speed.</p>
              <p>Usage is metered with alerts, upgrade prompts, and optional public-delivery pauses when an account exceeds its plan. Custom subscribers can unlock larger files, higher storage, archival originals, and heavier delivery.</p>
            </div>
            <div className="mt-5 rounded-md border border-[#ded8cc] bg-[#fbfaf7] p-4">
              <h4 className="text-sm font-semibold text-[#1f211e]">If billing stops</h4>
              <div className="mt-2 grid gap-2 text-sm leading-6 text-[#6f685d]">
                {accountFilePolicy.slice(1, 4).map((item) => (
                  <p key={item.title}>
                    <span className="font-semibold text-[#1f211e]">{item.title}:</span> {item.body}
                  </p>
                ))}
              </div>
              <Link className="mt-3 inline-flex text-sm font-semibold text-[#1d2b22] underline decoration-[#d8a84f] underline-offset-4 hover:text-[#9c6f1d]" href="/terms">
                Read full cancellation and file-retention policy
              </Link>
            </div>
            <Link className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-[#1d2b22] px-4 text-sm font-semibold text-white hover:bg-[#26382d]" href="/register">
              Start 14-day trial
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
