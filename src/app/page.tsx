import { HomeHero } from "@/components/site/home-hero"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { SettingsCapabilitiesShowcase } from "@/components/site/settings-capabilities-showcase"
import { WebsiteTemplateMiniPreview } from "@/components/portfolio/website-template-mini-preview"
import { migratedGalleries } from "@/data/migrated-galleries"
import type { WebsiteTemplate } from "@/lib/website-builder-rules"
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
  Layers3,
  LayoutTemplate,
  Link2,
  Megaphone,
  MonitorSmartphone,
  PlugZap,
  ShieldCheck,
  Sparkles,
  Smartphone,
  TimerReset,
  UploadCloud,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { FaLinkedinIn } from "react-icons/fa"
import {
  SiFacebook,
  SiInstagram,
  SiPinterest,
  SiTiktok,
  SiX,
  SiYoutube,
} from "react-icons/si"

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
    body: "Ask AI How To answers product questions, Edit Hints point to the exact control, and Tours guide subscribers through multi-step tasks without taking away creative control.",
  },
  {
    icon: Smartphone,
    title: "Direct phone import",
    body: "Choose photos from a mobile device, review thumbnails in batches of 50, import only the keepers, then choose the cover and hide anything that should not be public.",
  },
  {
    icon: Code2,
    title: "Embed anywhere",
    body: "Copy one block of code to place a PhotoView.io portfolio or full gallery grid inside an existing website without rebuilding the photographer's whole site.",
  },
  {
    icon: LayoutTemplate,
    title: "Build a complete photography website",
    body: "Choose a visual style, work beside a live responsive canvas, and build a site with your own hero, portfolios, galleries, About page, gear, trips, articles, contact form, colors, type, and domain. Your website header can use a photograph or an uploaded looping MP4 video.",
  },
  {
    icon: CalendarClock,
    title: "Run an automated social campaign",
    body: "Turn curated photographs into a complete campaign with designed layouts, custom messages, calls to action, destination links, exact photo selection, multiple connected accounts, and a schedule you approve before anything publishes.",
  },
  {
    icon: UploadCloud,
    title: "Import from the tools you already use",
    body: "Bring work in from a phone, publish through the Lightroom plugin, or watch a desktop export folder used by Capture One, Photoshop, Affinity, Photo Mechanic, DxO, or ON1.",
  },
]

const comparisonRows = [
  {
    area: "Best fit",
    photoViewPro: "Passionate photographers publishing a carefully selected body of work",
    smugMug: "Photographers who want unlimited JPEG storage, delivery, and print sales",
    zenfolio: "Studios that need proofing, sales, marketing, booking, and client workflows",
  },
  {
    area: "Relevant price",
    photoViewPro: "$3.99/month for 5 GB or $5.99/month for 20 GB. Larger storage plans are also available.",
    smugMug: "$23.50/month billed annually ($282/year) for the Portfolio plan",
    zenfolio: "$7/month billed annually ($84/year) for Basic; $9 month-to-month",
  },
  {
    area: "Storage approach",
    photoViewPro: "Right-sized tiers from 5–150 GB for curated, portfolio-ready photographs",
    smugMug: "Unlimited full-resolution JPEG storage; RAW storage is a paid add-on",
    zenfolio: "15 GB Basic, 150 GB Professional, unlimited JPEG on Advanced",
  },
  {
    area: "Portfolio presentation",
    photoViewPro: "Cinematic desktop viewing plus clean vertical and horizontal mobile lightboxes",
    smugMug: "Professional portfolio or storefront with customizable templates",
    zenfolio: "Website and client-gallery templates designed for proofing and selling",
  },
  {
    area: "Website builder",
    photoViewPro: "Included at every tier with a live canvas, editable sections, pages, domains, and one uploaded MP4 Hero video",
    smugMug: "Customizable website templates on Portfolio and Pro",
    zenfolio: "Custom website, domain, and logo included on all plans",
  },
  {
    area: "Getting photographs in",
    photoViewPro: "Direct phone selection, Lightroom Plugin, and watched desktop export folders",
    smugMug: "Lightroom integration plus automatic upload through SmugMug apps",
    zenfolio: "Lightroom plugin, uploader app, and gallery organization tools",
  },
  {
    area: "Guided help",
    photoViewPro: "Ask AI How To, contextual Edit Hints, guided Tours, and contact support available 24/7 for questions, comments, or suggestions",
    smugMug: "24/7 live human support",
    zenfolio: "24/7 support plus AI gallery creation and tagging",
  },
  {
    area: "Sharing beyond the platform",
    photoViewPro: "Embeddable portfolios plus designed, multi-account social campaigns with exact scheduling and direct publishing for eligible connected accounts",
    smugMug: "Gallery delivery, QR codes, downloads, and storefront sharing",
    zenfolio: "Client galleries, SMS delivery, invitations, and marketing tools",
  },
  {
    area: "Proofing and commerce",
    photoViewPro: "Maybe later, but for now, we are passionately supporting your desire to share your photos with the audience you choose.",
    smugMug: "Print and digital sales, fulfillment, pricelists, packages, and client favoriting",
    zenfolio: "Proofing, print and digital sales, booking, payments, and studio management",
  },
]

const storageTiers = [
  ["Starter", "5 GB storage", "$3.99/mo or $39.99/year"],
  ["Growth", "20 GB storage", "$5.99/mo or $59.99/year"],
  ["Studio", "50 GB storage", "$7.99/mo or $79.99/year"],
  ["Premier", "150 GB storage", "$11.99/mo or $119.99/year"],
  ["Custom", "More than 150 GB", "Contact us"],
]

const mobilePreviewImages = {
  portrait: "/marketing-preview/mobile-tree-milky-way.png",
  landscape: "/marketing-preview/mobile-ice-cave.png",
}

const socialPlatforms = [
  { label: "Facebook", icon: SiFacebook, className: "bg-[#1877f2]" },
  { label: "Instagram", icon: SiInstagram, className: "bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]" },
  { label: "LinkedIn", icon: FaLinkedinIn, className: "bg-[#0a66c2]" },
  { label: "Pinterest", icon: SiPinterest, className: "bg-[#e60023]" },
  { label: "X", icon: SiX, className: "bg-black" },
  { label: "TikTok", icon: SiTiktok, className: "bg-[#111111]" },
  { label: "YouTube", icon: SiYoutube, className: "bg-[#ff0000]" },
]

const homepageWebsiteTemplates: Array<{ id: WebsiteTemplate; label: string }> = [
  { id: "split-hero", label: "Split hero" },
  { id: "gallery-wall", label: "Gallery wall" },
  { id: "clean-grid", label: "Clean portfolio grid" },
  { id: "editorial-magazine", label: "Editorial magazine" },
  { id: "story-journal", label: "Story journal" },
  { id: "travel-atlas", label: "Travel atlas" },
  { id: "panorama-scroll", label: "Panorama scroll" },
  { id: "museum-wall", label: "Museum wall" },
  { id: "portrait-card", label: "Portrait card" },
]

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
              PhotoView.io is for serious photographers who love making images and need one clean place to store, organize, curate, and show their best work without adopting a complicated all-in-one platform.
            </p>
          </div>

          <div className="mt-10">
            <div className="flex gap-3 overflow-x-auto pb-3" role="list" aria-label="Website template previews">
              {homepageWebsiteTemplates.map((template) => (
                <div className="w-44 shrink-0 rounded-md border border-[#ded8cc] bg-white p-2 shadow-sm" key={template.id} role="listitem">
                  <WebsiteTemplateMiniPreview isSelected={false} templateId={template.id} />
                  <span className="block truncate text-xs font-semibold">{template.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 w-full text-center text-sm leading-6 text-[#6f685d]">
              A full selection of website templates is available in the dashboard, with more being added regularly.
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

          <SettingsCapabilitiesShowcase />
        </div>
      </section>

      <section id="social-campaigns" className="border-b border-[#d7e2dc] bg-[#eef7f3] px-6 pb-14 md:px-10">
        <div className="mx-auto max-w-6xl rounded-md border border-[#ded8cc] bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9c6f1d]">
                <Megaphone className="size-5" />
                Social campaign studio
              </div>
              <h2 className="mt-3 text-2xl font-semibold leading-tight md:text-3xl">
                Turn one portfolio into a complete social campaign.
              </h2>
              <p className="mt-3 text-base leading-7 text-[#5f594f]">
                Choose a campaign layout, message, photographs, connected accounts, and schedule. Preview every post before publishing begins.
              </p>
              <div className="mt-4 grid gap-x-5 gap-y-2 text-sm text-[#4f4a42] sm:grid-cols-2">
                {[
                  [Layers3, "Five campaign layouts"],
                  [Link2, "Your message and call to action"],
                  [TimerReset, "Automatic scheduling"],
                  [ShieldCheck, "Review, activate, or pause"],
                ].map(([Icon, title]) => (
                  <div className="flex items-center gap-2" key={title as string}>
                    <Icon className="size-4 shrink-0 text-[#c58f2f]" />
                    <span className="font-medium">{title as string}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-[#e5ded2] pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <p className="text-sm font-semibold text-[#4f4a42]">Create once. Publish across your channels.</p>
              <div className="mt-3 flex flex-wrap gap-2" aria-label="Supported social platforms">
                {socialPlatforms.map(({ label, icon: Icon, className }) => (
                  <span
                    className={`flex size-9 items-center justify-center rounded-lg text-white shadow-sm ${className}`}
                    key={label}
                    title={label}
                  >
                    <Icon aria-hidden="true" className="size-[18px]" />
                    <span className="sr-only">{label}</span>
                  </span>
                ))}
              </div>
              <Link className="mt-4 inline-flex h-10 w-fit items-center gap-2 rounded-md bg-[#1d2b22] px-4 text-sm font-semibold text-white hover:bg-[#26382d]" href="/register">
                Build your first campaign
                <ArrowRight className="size-4" />
              </Link>
              <p className="mt-3 max-w-md text-xs leading-5 text-[#777064]">
                Direct publishing currently supports multiple eligible Facebook Pages and Instagram Professional accounts connected through Meta.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fff8f4] px-6 py-14 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
          {[
            {
              icon: Bot,
              label: "AI that shows you what to do next",
              text: "Ask a question, reveal contextual Edit Hints, or Take a Tour that leads directly to the controls needed to finish the task.",
            },
            {
              icon: Smartphone,
              label: "Phone to portfolio",
              text: "Start on the device where the photos already are. Select mobile images, review 50 thumbnails at a time, and turn the best ones into a new portfolio.",
            },
            {
              icon: LayoutTemplate,
              label: "Build here or embed anywhere",
              text: "Create a complete photography website inside PhotoView.io, or embed one portfolio or your entire portfolio grid on a site you already use.",
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
              <span>PhotoView.io</span>
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
              {["Homepage Hero image or looping MP4 video", "Live website builder with editable pages and sections", "Full-frame gallery covers and adjustable preview sizes", "Captions, portfolio information, ordering, and hidden-photo controls", "Subscriber settings for privacy, downloads, HDR, and watermarks", "Guided AI help and designed social campaigns"].map((item) => (
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
          <div className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Why different</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Pay for the portfolio you need. Not the photography business you don’t.</h2>
            <p className="mt-4 text-lg leading-8 text-[#5f594f]">
              Most passionate photographers cull and finish their work in Lightroom or another editor, then publish only their strongest photographs. For many, 5–10 GB is enough for an entire curated collection. PhotoView.io is built for that real workflow: keep the selected work, shape the presentation, build a beautiful photography website, and share it anywhere.
            </p>
            <p className="mt-4 text-base leading-7 text-[#6a6359]">
              SmugMug and Zenfolio are capable platforms when you need proofing, print fulfillment, booking, or a complete studio-business system. When your priority is presenting your best work without paying for that larger operational stack, PhotoView.io is the more direct choice.
            </p>
          </div>
          <div className="mt-8 overflow-x-auto rounded-md border border-[#ded8cc] bg-white shadow-sm">
            <div className="min-w-[960px]">
              <div className="grid grid-cols-[0.72fr_1.18fr_1fr_1fr] bg-[#f5f1ea] text-sm font-semibold text-[#1f211e]">
                <span className="px-4 py-4">Compare</span>
                <span className="border-x border-[#d8a84f] bg-[#fff6dc] px-4 py-4 text-[#735223]">PhotoView.io</span>
                <span className="px-4 py-4">SmugMug</span>
                <span className="px-4 py-4">Zenfolio</span>
              </div>
              {comparisonRows.map(({ area, photoViewPro, smugMug, zenfolio }) => (
                <div className="grid grid-cols-[0.72fr_1.18fr_1fr_1fr] border-t border-[#e8dfd2] text-sm leading-6 text-[#5f594f]" key={area}>
                  <span className="px-4 py-4 font-semibold text-[#1f211e]">{area}</span>
                  <span className="border-x border-[#ead7aa] bg-[#fffaf0] px-4 py-4 font-medium text-[#352b1b]">{photoViewPro}</span>
                  <span className="px-4 py-4">{smugMug}</span>
                  <span className="px-4 py-4">{zenfolio}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 text-sm leading-6 text-[#6f685d] md:flex-row md:items-center md:justify-between">
            <p>Competitor pricing and plan details checked July 2026. Promotional pricing and features may change.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 font-semibold">
              <a className="underline decoration-[#d8a84f] underline-offset-4" href="https://www.smugmug.com/plans" rel="noreferrer" target="_blank">SmugMug plans</a>
              <a className="underline decoration-[#d8a84f] underline-offset-4" href="https://zenfolio.com/plans-pricing/" rel="noreferrer" target="_blank">Zenfolio plans</a>
            </div>
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
              PhotoView.io is designed around the real ways passionate photographers already work: bring images in, shape the visible edit, ask for guidance when needed, then publish a portfolio, build a complete site, embed it elsewhere, or prepare a social series.
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
              [Bot, "Use Ask AI How To, Edit Hints, and guided Tours to finish unfamiliar tasks"],
              [LayoutTemplate, "Build a responsive photography website with editable pages, sections, styles, forms, and domains"],
              [Code2, "Embed one portfolio or the full portfolio grid on an existing website"],
              [CalendarClock, "Design, review, and automatically publish a multi-account social campaign from selected photographs"],
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
          <p className="text-sm text-white/70">The complete portfolio and website experience starts at $39.99 per year.</p>
        </div>
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Generous portfolio storage with sensible guardrails.</h2>
            <p className="mt-4 text-lg leading-8 text-[#5f594f]">
              PhotoView.io is priced for curated publishing, not nickel-and-diming every photograph. Each plan includes room for real portfolios, while file-size and usage guardrails keep the service fast, fair, and affordable.
            </p>
            <p className="mt-4 rounded-md border border-[#ded8cc] bg-white p-4 text-base leading-7 text-[#5f594f] shadow-sm">
              PhotoView.io is not trying to run your whole photography business. It is a focused place to store, curate, display, and share the photographs you care about most.
            </p>
            <div className="mt-6 rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-[#6f685d]">Starter plan</p>
                  <p className="mt-2 text-5xl font-semibold">$3.99</p>
                </div>
                <p className="pb-2 text-sm text-[#6f685d]">/ month</p>
              </div>
              <p className="mt-2 text-sm text-[#6f685d]">$39.99/year when billed annually. Save compared with monthly billing.</p>
              <div className="mt-5 grid gap-3 text-sm text-[#4f4a42]">
                {["5 GB portfolio storage", "Original files preserved securely", "Portfolio-first public site", "Visual website builder with one Hero video", "Guided AI help and campaign tutorial", "Social campaign designer and scheduler", "Mobile and desktop gallery viewing", "Public sharing links and embeds"].map((item) => (
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
              <p>Every plan includes the visual website builder with one Hero video, portfolio presentation, mobile viewing, embeds, guided AI help, and public sharing. Choose a plan based on the storage your photography needs.</p>
              <p>Subscribers receive a personal referral link. Each eligible trial that converts to paid access adds a permanent 1 GB storage bonus once—never subscription time or recurring annual credit.</p>
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
