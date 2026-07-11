import { HomeHero } from "@/components/site/home-hero"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { migratedGalleries } from "@/data/migrated-galleries"
import {
  Aperture,
  ArrowRight,
  Bot,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Code2,
  GalleryHorizontalEnd,
  Images,
  LayoutTemplate,
  MonitorSmartphone,
  PlugZap,
  ShieldCheck,
  Sparkles,
  Smartphone,
  UploadCloud,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const productShots = [
  { label: "Destination Portfolio", image: migratedGalleries[0]?.cover, count: "24 images" },
  { label: "Travel Collection", image: migratedGalleries[5]?.cover, count: "36 images" },
  { label: "Fine Art Series", image: migratedGalleries[7]?.cover, count: "18 images" },
  { label: "Mobile Portfolio", image: migratedGalleries[9]?.cover, count: "12 images" },
]

const featureCards = [
  {
    icon: Images,
    title: "Multiple portfolio galleries",
    body: "Create separate portfolios for travel, landscape, street, wildlife, fine art, family collections, or any curated series, each with its own cover, order, visibility, and sharing controls.",
  },
  {
    icon: MonitorSmartphone,
    title: "Display work beautifully anywhere",
    body: "Full-screen viewing, swipe navigation, desktop keyboard controls, and clean gallery grids are designed around the photograph, not around selling packages.",
  },
  {
    icon: ShieldCheck,
    title: "Curate without losing your work",
    body: "Choose covers, reorder images, hide weaker photos, write captions, and keep originals protected while showing only the version of the portfolio you want visitors to see.",
  },
  {
    icon: Bot,
    title: "Guided AI help throughout",
    body: "Ask AI How To answers product questions, Edit Hints point to the exact control, and Merlin walkthroughs guide subscribers through multi-step tasks without taking away creative control.",
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
  {
    icon: LayoutTemplate,
    title: "Build a complete photography website",
    body: "Choose a visual style, work beside a live responsive canvas, and build a site with your own hero, portfolios, galleries, About page, gear, trips, articles, contact form, colors, type, and domain.",
  },
  {
    icon: CalendarClock,
    title: "Plan a social photo series",
    body: "Choose a portfolio, select the visible photographs, set a start time and posting pace, and prepare an ordered social queue without accidentally sharing hidden work.",
  },
  {
    icon: UploadCloud,
    title: "Import from the tools you already use",
    body: "Bring work in from a phone, publish through the Lightroom plugin, or watch a desktop export folder used by Capture One, Photoshop, Affinity, Photo Mechanic, DxO, or ON1.",
  },
]

const comparisonRows = [
  ["Primary experience", "Client delivery and business workflow", "Store, curate, display, and share"],
  ["Mobile viewing", "Often adapted from desktop layouts", "Designed around swipe, lightbox, and gallery grid"],
  ["Homepage", "Template-heavy marketing pages", "Your selected portfolio covers and best work"],
  ["Website building", "Business-site complexity and locked layouts", "Live visual building around your own photography"],
  ["Workflow direction", "Business tools and delivery workflows", "Phone, Lightroom, storage, curation, and display"],
]

const storageTiers = [
  ["Starter", "2 GB storage", "$1.99/mo or $19.99/year"],
  ["Growth", "10 GB storage", "$2.99/mo or $29.99/year"],
  ["Studio", "25 GB storage", "$5.99/mo or $59.99/year"],
  ["Premier", "75 GB storage", "$9.99/mo or $99.99/year"],
  ["Custom", "100 GB+ storage", "Contact us"],
]

const mobilePreviewImages = {
  portrait: "/marketing-preview/mobile-tree-milky-way.png",
  landscape: "/marketing-preview/mobile-ice-cave.png",
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#1f211e]">
      <SiteHeader />
      <HomeHero />

      <section id="features" className="border-y border-[#d7e2dc] bg-[#eef7f3] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <h2 className="text-3xl font-semibold md:text-5xl">A portfolio home built around the photographs themselves.</h2>
            </div>
            <p className="max-w-3xl text-lg leading-8 text-[#5f594f]">
              PhotoViewPro is for serious photographers who love making images and need one clean place to store, organize, curate, and show their best work without adopting a complicated all-in-one platform.
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

      <section className="bg-[#fff8f4] px-6 py-14 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
          {[
            {
              icon: Bot,
              label: "AI that shows you what to do next",
              text: "Ask a question, reveal contextual Edit Hints, or start a Merlin walkthrough that takes you directly to the controls needed to finish the task.",
            },
            {
              icon: Smartphone,
              label: "Phone to portfolio",
              text: "Start on the device where the photos already are. Select mobile images, review 50 thumbnails at a time, and turn the best ones into a new portfolio.",
            },
            {
              icon: LayoutTemplate,
              label: "Build here or embed anywhere",
              text: "Create a complete photography website inside PhotoViewPro, or embed one portfolio or your entire portfolio grid on a site you already use.",
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
              {["Rotating or static homepage cover images", "Live website builder with editable pages and sections", "Full-frame gallery covers and adjustable preview sizes", "Captions, portfolio information, ordering, and hidden-photo controls", "Subscriber settings for privacy, downloads, HDR, and watermarks", "Guided AI help and paced social-sharing plans"].map((item) => (
                <div className="flex items-center gap-3" key={item}>
                  <Sparkles className="size-4 text-[#d8a84f]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#ded8e7] bg-[#f6f3fb] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Why different</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Not another all-in-one photography business platform.</h2>
            <p className="mt-4 text-lg leading-8 text-[#5f594f]">
              Traditional platforms can do many things, but they often make the image presentation compete with proofing, selling, packages, and business features. PhotoViewPro is intentionally focused: help photographers store their work, choose the best images, and present them beautifully.
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

      <section className="bg-[#edf7f5] px-6 py-16 md:px-10">
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
                  <span aria-hidden="true" className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                    <ChevronLeft className="size-7" strokeWidth={3} />
                  </span>
                  <span aria-hidden="true" className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                    <ChevronRight className="size-7" strokeWidth={3} />
                  </span>
                  <div className="absolute bottom-2 left-1/2 z-20 h-1 w-20 -translate-x-1/2 rounded-full bg-white/55" />
                </div>
              </div>
              <div className="mx-auto w-full max-w-sm rounded-[2.4rem] bg-[#050505] p-3 shadow-2xl shadow-black/25 ring-1 ring-black/20">
                <div className="relative aspect-[19.5/9] overflow-hidden rounded-[1.8rem] bg-black">
                  <div className="absolute left-2.5 top-1/2 z-20 h-16 w-4 -translate-y-1/2 rounded-full bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" />
                  <Image alt="Landscape phone lightbox preview with blue ice cave photograph" className="object-cover" fill sizes="384px" src={mobilePreviewImages.landscape} />
                  <span aria-hidden="true" className="absolute left-5 top-1/2 z-10 -translate-y-1/2 text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                    <ChevronLeft className="size-7" strokeWidth={3} />
                  </span>
                  <span aria-hidden="true" className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                    <ChevronRight className="size-7" strokeWidth={3} />
                  </span>
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

      <section id="workflow" className="border-y border-[#eadfd8] bg-[#fff8f4] px-6 py-16 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Workflow</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">From phone, Lightroom, or desktop folder to a finished portfolio and website.</h2>
            <p className="mt-4 text-lg leading-8 text-[#5f594f]">
              PhotoViewPro is designed around the real ways passionate photographers already work: bring images in, shape the visible edit, ask for guidance when needed, then publish a portfolio, build a complete site, embed it elsewhere, or prepare a social series.
            </p>
            <div className="mt-6 rounded-md border border-[#ded8cc] bg-white p-4 text-sm leading-6 text-[#5f594f] shadow-sm">
              You can run multiple portfolios at once, each with its own cover, order, hidden photos, captions, privacy, sharing, and embed code.
            </div>
          </div>
          <div className="grid gap-3">
            {[
              [Smartphone, "Import directly from a phone and review selected thumbnails 50 at a time"],
              [UploadCloud, "Export selected images from Lightroom into a new or existing portfolio"],
              [Images, "Watch a desktop folder for finished JPEG, PNG, WebP, or AVIF exports"],
              [Aperture, "Generate optimized desktop, mobile, and thumbnail display files"],
              [GalleryHorizontalEnd, "Choose the cover, hide weak images, caption photos, and drag the order"],
              [Bot, "Use Ask AI How To, Edit Hints, and Merlin walkthroughs to finish unfamiliar tasks"],
              [LayoutTemplate, "Build a responsive photography website with editable pages, sections, styles, forms, and domains"],
              [Code2, "Embed one portfolio or the full portfolio grid on an existing website"],
              [CalendarClock, "Plan a paced sequence of visible portfolio photographs for social sharing"],
              [PlugZap, "Publish with privacy, download, watermark, HDR, and sharing settings"],
            ].map(([Icon, text]) => (
              <div className="flex items-center gap-3 rounded-md border border-[#ded8cc] bg-white px-4 py-4 text-base text-[#4f4a42] shadow-sm" key={text as string}>
                <Icon className="size-5 text-[#d8a84f]" />
                <span>{text as string}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[#f5f3fa] px-6 py-16 md:px-10">
        <div className="mx-auto mb-8 flex max-w-6xl flex-col gap-2 rounded-md border border-[#c98c29] bg-[#1d2b22] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-semibold">Introductory Pricing Live Now</p>
          <p className="text-sm text-white/70">The complete portfolio and website experience starts at $19.99 per year.</p>
        </div>
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Generous portfolio storage with sensible guardrails.</h2>
            <p className="mt-4 text-lg leading-8 text-[#5f594f]">
              PhotoViewPro is priced for curated publishing, not nickel-and-diming every photograph. Each plan includes room for real portfolios, while file-size and usage guardrails keep the service fast, fair, and affordable.
            </p>
            <p className="mt-4 rounded-md border border-[#ded8cc] bg-white p-4 text-base leading-7 text-[#5f594f] shadow-sm">
              PhotoViewPro is not trying to run your whole photography business. It is a focused place to store, curate, display, and share the photographs you care about most.
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
                {["2 GB portfolio storage", "100 MB/photo upload limit", "Portfolio-first public site", "Visual website builder included", "Guided AI help", "Mobile and desktop gallery viewing", "Public sharing links and embeds"].map((item) => (
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
              <h3 className="text-xl font-semibold">Portfolio storage</h3>
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
              <p>Every plan includes the visual website builder, portfolio presentation, mobile viewing, embeds, guided AI help, and public sharing. Choose a plan based on the storage your photography needs.</p>
              <p>Subscribers also receive a personal referral link. When an eligible referral converts to paid access, account rewards can add time or capacity.</p>
              <p>Storage is metered with alerts and upgrade prompts as a subscriber approaches their plan limit. Public viewing traffic is monitored for abuse, performance, and reliability, but it is not sold as a separate plan allowance.</p>
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
