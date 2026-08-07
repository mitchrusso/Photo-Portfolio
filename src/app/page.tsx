import { HomeHero } from "@/components/site/home-hero"
import { HomeVideoShowcase } from "@/components/site/home-video-showcase"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { SettingsCapabilitiesShowcase } from "@/components/site/settings-capabilities-showcase"
import { WebsiteTemplateMiniPreview } from "@/components/portfolio/website-template-mini-preview"
import { migratedGalleries } from "@/data/migrated-galleries"
import { SELECTABLE_WEBSITE_TEMPLATE_IDS, type WebsiteTemplate } from "@/lib/website-builder-rules"
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
  Globe2,
  GripVertical,
  Images,
  Layers3,
  LayoutTemplate,
  Link2,
  LockKeyhole,
  Megaphone,
  MonitorSmartphone,
  RefreshCw,
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
    title: "Show photographs and motion together",
    body: "Present photographs and video in the same curated portfolio, with responsive playback, poster thumbnails, full-screen viewing, and no distracting third-party branding.",
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
    body: "Choose photographs, MP4 files, and MOV files from a mobile device, import only the keepers, then arrange, hide, move, download, or share them with the same familiar controls.",
  },
  {
    icon: Code2,
    title: "Embed anywhere",
    body: "Copy one block of code to place a PhotoView.io portfolio or full gallery grid inside an existing website without rebuilding the photographer's whole site.",
  },
  {
    icon: LayoutTemplate,
    title: "Build a complete photography website",
    body: "Choose a visual style, work beside a live responsive canvas, and build a site with your own hero, portfolios, galleries, About page, gear, trips, articles, contact form, colors, type, and personal PhotoView.io address. Your website header can use a photograph or an uploaded looping MP4 video.",
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
    photoViewPro: "Sensible tiers from 5 to 150 GB for curated, portfolio ready photographs",
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
    photoViewPro: "Included at every tier with a live canvas, editable sections, flexible pages, a personal PhotoView.io address, and one uploaded MP4 Hero video",
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
  { id: "scroll-stack", label: "Scroll stack" },
  { id: "kinetic-headline", label: "Kinetic headline" },
  { id: "atelier-split", label: "Atelier split" },
  { id: "triptych-stage", label: "Triptych stage" },
  { id: "commercial-casebook", label: "Commercial casebook" },
  { id: "studio-split", label: "Studio split" },
  { id: "swiss-sequence", label: "Swiss sequence" },
  { id: "object-stage", label: "Object stage" },
  { id: "specimen-wall", label: "Specimen wall" },
  { id: "quiet-sequence", label: "Quiet sequence" },
  { id: "acclaim-portfolio", label: "Acclaim portfolio" },
  { id: "cinematic-home", label: "Cinematic home" },
  { id: "editorial-rail", label: "Editorial rail" },
  { id: "masonry-journal", label: "Masonry journal" },
  { id: "dark-filmstrip", label: "Dark filmstrip" },
  { id: "coral-panorama", label: "Coral panorama" },
  { id: "editorial-story", label: "Editorial story" },
  { id: "cinematic-chapters", label: "Cinematic chapters" },
  { id: "museum-index", label: "Museum index" },
  { id: "split-hero", label: "Split hero" },
  { id: "gallery-wall", label: "Gallery wall" },
  { id: "clean-grid", label: "Clean portfolio grid" },
  { id: "editorial-magazine", label: "Editorial magazine" },
  { id: "story-journal", label: "Story journal" },
  { id: "travel-atlas", label: "Travel atlas" },
  { id: "panorama-scroll", label: "Panorama scroll" },
  { id: "museum-wall", label: "Museum wall" },
  { id: "portrait-card", label: "Portrait card" },
  { id: "gear-notebook", label: "Gear notebook" },
  { id: "bold-color", label: "Bold color" },
]

const websiteBuilderPages = [
  { label: "Home", detail: "Hero image or video, galleries, and featured work." },
  { label: "About me", detail: "Your story, portrait, and creative point of view." },
  { label: "What's in My Bag", detail: "Gear, recommendations, and product links." },
  { label: "Trips / Blog", detail: "Stories linked to the portfolios that illustrate them." },
  { label: "Useful Articles", detail: "Original writing for visitors and search engines." },
  { label: "Contact", detail: "A contact form delivered to your private email." },
  { label: "Custom pages", detail: "Add up to five pages for workshops, services, press, licensing, or anything else." },
  { label: "Custom branding", detail: "Your logo, site name, colors, typography, and image style." },
]

const workflowSteps = [
  {
    icon: UploadCloud,
    label: "Import",
    detail: "Photos and video from phone or direct upload, plus Lightroom and watched folders",
  },
  {
    icon: Images,
    label: "Organize",
    detail: "Build separate portfolios and keep every photograph in its place",
  },
  {
    icon: GalleryHorizontalEnd,
    label: "Curate",
    detail: "Choose covers, order images, add captions, and hide weaker work",
  },
  {
    icon: LayoutTemplate,
    label: "Design",
    detail: "Select a template and shape a complete responsive photography site",
  },
  {
    icon: Megaphone,
    label: "Share",
    detail: "Publish, embed, send a private link, or schedule a social campaign",
  },
]

const presentationCards = [
  {
    icon: LayoutTemplate,
    title: "Your complete photography website",
    body: "Build a polished responsive site with a Hero image or video, About page, stories, articles, contact form, custom pages, and your own domain.",
  },
  {
    icon: MonitorSmartphone,
    title: "Gorgeous desktop presentation",
    body: "Show photographs at full frame with cinematic lightboxes, clean navigation, captions, filmstrips, and layouts that respect the original shape of every image.",
  },
  {
    icon: Smartphone,
    title: "Mobile that feels designed",
    body: "Give phone visitors a full-screen, swipeable presentation with clear navigation and mobile-optimized display files that never compete with the photograph.",
  },
  {
    icon: Code2,
    title: "Live embeds for sites you already use",
    body: "Place one portfolio or your complete portfolio grid in an existing website, blog, Shopify page, or campaign. Update PhotoView once and every connected embed updates.",
  },
]

const importMethods = [
  {
    icon: Aperture,
    title: "Publish directly from Lightroom Classic",
    body: "Select finished photographs, choose a new or existing PhotoView portfolio, and export rendered files up to 50 MB without resizing or cropping them.",
  },
  {
    icon: RefreshCw,
    title: "Automate desktop exports with Smart Folders",
    body: "Create up to 12 watched-folder routes for different subjects, clients, websites, or destinations. Export from the editor you already trust and let the desktop uploader deliver the files.",
  },
  {
    icon: Smartphone,
    title: "Import from your phone",
    body: "Choose photographs, MP4 files, and MOV files from your mobile device, review the keepers, and add them directly to the right portfolio.",
  },
  {
    icon: UploadCloud,
    title: "Bring existing work with you",
    body: "Import from SmugMug or upload directly from your computer whenever a one-time transfer is the better choice.",
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#1f211e]">
      <SiteHeader />
      <HomeHero />

      <section className="border-b border-[#d7e2dc] bg-[#17241d] px-6 py-16 text-white md:px-10">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ffd86a]">Your best work should not disappear</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">
              A folder stores photographs. A feed forgets them. PhotoView presents them.
            </h2>
          </div>
          <div className="space-y-5 text-lg leading-8 text-white/72">
            <p>
              You invested your eye, your time, and your skill in every finished image. Yet too often the work ends up trapped in a folder, compressed into a social feed, or squeezed into a website template that looks like everyone else&apos;s.
            </p>
            <p>
              PhotoView is built for what happens after the edit: choosing the work that matters, shaping how it is experienced, and placing it in front of the people you want to reach.
            </p>
            <p className="font-semibold text-white">
              This is not another place to edit photographs. It is the place finished photographs go to be seen.
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="border-b border-[#d7e2dc] bg-[#fff8f4] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9c6f1d]">One body of work · beautiful everywhere</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">
              Give every photograph the space it deserves wherever people discover you.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#5f594f]">
              Create once in PhotoView, then present your work beautifully across every important screen and destination.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {presentationCards.map(({ icon: Icon, title, body }) => (
              <article className="rounded-md border border-[#ded8cc] bg-white p-6 shadow-sm" key={title}>
                <span className="flex size-11 items-center justify-center rounded-md bg-[#1d2b22] text-white">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-base leading-7 text-[#5f594f]">{body}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1d2b22] px-5 text-sm font-semibold text-white hover:bg-[#26382d]" href="/register">
              Start building your presentation
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="templates" className="border-y border-[#d7e2dc] bg-[#eef7f3] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9c6f1d]">30 distinctive starting points</p>
              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">Choose a website that feels like your photography, not a generic portfolio template.</h2>
              <p className="mt-4 text-sm font-semibold text-[#6f685d]">A portfolio home built around the photographs themselves.</p>
            </div>
            <p className="max-w-3xl text-lg leading-8 text-[#5f594f]">
              Minimal or cinematic. Editorial or immersive. Quiet and museum-like or bold and kinetic. Every template creates a genuinely different experience using the portfolios, pages, and content you have already built.
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
              Browse all {SELECTABLE_WEBSITE_TEMPLATE_IDS.length} website templates here. Switch designs without rebuilding your content; every template is included with every plan and adapts to desktop and mobile.
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

          <HomeVideoShowcase />

          <SettingsCapabilitiesShowcase />
        </div>
      </section>

      <section id="import-workflow" className="border-b border-[#d7e2dc] bg-[#fff8f4] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9c6f1d]">From finished file to finished portfolio</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">Edit where you already edit. Let PhotoView handle what comes next.</h2>
            </div>
            <p className="text-lg leading-8 text-[#5f594f]">
              Send finished photographs directly to a new or existing portfolio without rebuilding folders, repeating uploads, or changing the way you process your images.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {importMethods.map(({ icon: Icon, title, body }) => (
              <article className="rounded-md border border-[#ded8cc] bg-white p-6 shadow-sm" key={title}>
                <Icon className="size-6 text-[#c58f2f]" />
                <h3 className="mt-4 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-base leading-7 text-[#5f594f]">{body}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-center text-sm leading-6 text-[#6f685d]">
            Titles, captions, capture dates, and original filenames travel with supported Lightroom imports when available.
          </p>
        </div>
      </section>

      <section id="website-storytelling" className="border-b border-[#d7e2dc] bg-[#f7f8f5] px-6 py-14 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9c6f1d]">More than a portfolio</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">Build the complete website around your photography.</h2>
            <p className="mt-4 text-base leading-7 text-[#5f594f] md:text-lg">
              Choose the pages you need, arrange them in your navigation, and edit every page beside the live website canvas.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-md border border-[#ded8cc] bg-white shadow-[0_16px_42px_rgba(80,65,45,0.10)]" data-testid="homepage-website-builder-pages">
            <div className="flex items-start gap-3 border-b border-[#ded8cc] bg-[#fbfaf7] p-4 md:p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#1d2b22] text-white">
                <LayoutTemplate className="size-5" />
              </span>
              <div>
                <h3 className="text-xl font-semibold">Build your site</h3>
                <p className="mt-1 text-sm leading-6 text-[#6f685d]">Drag pages into order. Open any page to edit its content, visibility, label, and page-specific options.</p>
              </div>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 md:p-5">
              {websiteBuilderPages.map(({ label, detail }) => (
                <div className="flex items-start gap-3 rounded-md border border-[#ded8cc] bg-white p-3" key={label}>
                  <GripVertical aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#a49b8e]" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-semibold text-[#1f211e]">{label}</h4>
                    <p className="mt-1 text-sm leading-5 text-[#6f685d]">{detail}</p>
                  </div>
                  <ChevronRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#8a8277]" />
                </div>
              ))}
            </div>

            <div className="border-t border-[#ded8cc] bg-[#fffaf0] px-4 py-3 text-sm leading-6 text-[#6f685d] md:px-5">
              Start at your personal <strong className="font-semibold text-[#352b1b]">name.photoview.io</strong> address, then connect a custom domain when you are ready. Save up to 12 background images and switch between them without uploading again.
              Helpful original articles can improve search visibility, but no platform can guarantee search rankings.
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#d7e2dc] bg-[#17241d] px-6 py-16 text-white md:px-10">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
          <article className="rounded-md border border-white/12 bg-white/[0.05] p-6">
            <Globe2 className="size-6 text-[#ffd86a]" />
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#ffd86a]">Custom domains</p>
            <h2 className="mt-3 text-2xl font-semibold">Your photographs. Your website. Your domain.</h2>
            <p className="mt-4 leading-7 text-white/70">
              Connect a domain you already own, keep both root and www visitors headed to the same place, and use guided one-click setup with supported providers.
            </p>
          </article>
          <article className="rounded-md border border-white/12 bg-white/[0.05] p-6">
            <Layers3 className="size-6 text-[#ffd86a]" />
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#ffd86a]">Accordion Story</p>
            <h2 className="mt-3 text-2xl font-semibold">Let visitors move through the meaning behind the images.</h2>
            <p className="mt-4 leading-7 text-white/70">
              Add an optional story experience to any template. Visitors open chapters such as Origin, Process, Place, or whatever structure fits your work without leaving the page.
            </p>
          </article>
          <article id="sharing" className="rounded-md border border-white/12 bg-white/[0.05] p-6">
            <LockKeyhole className="size-6 text-[#ffd86a]" />
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#ffd86a]">Sharing and privacy</p>
            <h2 className="mt-3 text-2xl font-semibold">Share publicly, privately, or only with the people you choose.</h2>
            <p className="mt-4 leading-7 text-white/70">
              Use private links, passwords, email verification, QR codes, multiple embed profiles, download controls, and watermarks to match the audience and purpose.
            </p>
          </article>
        </div>
      </section>

      <section className="border-b border-[#d7e2dc] bg-[#f7f8f5] px-6 py-16 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9c6f1d]">For passionate and commercial photographers</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">
              Give prospective clients a presentation that makes the work easy to remember.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#5f594f]">
              A PhotoView site can be a personal body of work, a polished commercial presentation, or both. Build separate portfolios for the audiences you serve and send each person directly to the work that matters.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Wedding and people", "Create emotional, story-led collections that feel complete on phones, tablets, and large screens."],
              ["Product and commercial", "Separate campaigns, categories, or clients, then embed the right portfolio into a proposal or existing company site."],
              ["Fine-art and editorial", "Use restrained layouts, captions, private previews, and story chapters to give a series context and authority."],
            ].map(([title, body]) => (
              <article className="rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm" key={title}>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5f594f]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="social-campaigns" className="border-b border-[#d7e2dc] bg-[#eef7f3] px-6 py-14 md:px-10">
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

      <div className="flex flex-col">
      <section className="order-3 border-y border-[#ded8e7] bg-[#f6f3fb] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Why different</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Pay for the portfolio you need. Not the photography business you don’t.</h2>
            <p className="mt-4 text-lg leading-8 text-[#5f594f]">
              Most passionate photographers cull and finish their work in Lightroom or another editor, then publish only their strongest photographs. For many, 5 to 10 GB is enough for an entire curated collection. PhotoView.io is built for that real workflow: keep the selected work, shape the presentation, build a beautiful photography website, and share it anywhere.
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
          <p className="mt-5 text-sm leading-6 text-[#6f685d]">
            Competitor pricing and plan details checked July 2026. Promotional pricing and features may change.
          </p>
        </div>
      </section>

      <section className="order-2 bg-[#edf7f5] px-6 py-16 md:px-10">
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

      <section id="workflow" className="order-1 border-y border-[#eadfd8] bg-[#fff8f4] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Workflow</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">From first import to finished audience, one connected creative flow.</h2>
            <p className="mt-4 text-lg leading-8 text-[#5f594f]">
              PhotoView.io carries your best work through every stage without forcing you to stitch together a collection of complicated tools.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-md border border-[#ded8cc] bg-white shadow-[0_18px_50px_rgba(80,65,45,0.08)]" data-testid="homepage-workflow-ribbon">
            <div className="grid md:grid-cols-5">
              {workflowSteps.map(({ icon: Icon, label, detail }, index) => (
                <div className="relative border-b border-[#eadfd8] p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0" key={label}>
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-full bg-[#1d2b22] text-white">
                      <Icon className="size-5" />
                    </span>
                    <span className="text-xs font-semibold tracking-[0.16em] text-[#b58835]">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{label}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6f685d]">{detail}</p>
                  {index < workflowSteps.length - 1 ? (
                    <span className="absolute -right-3 top-8 z-10 hidden size-6 items-center justify-center rounded-full border border-[#ded8cc] bg-[#fffaf0] text-[#b58835] md:flex" aria-hidden="true">
                      <ArrowRight className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-6 text-[#6f685d]">
            Multiple portfolios can move through this workflow at once, each with its own cover, order, privacy, watermark, sharing controls, and destination.
          </p>
        </div>
      </section>
      </div>

      <section id="pricing" className="bg-[#f5f3fa] px-6 py-16 md:px-10">
        <div className="mx-auto mb-8 flex max-w-6xl flex-col gap-2 rounded-md border border-[#c98c29] bg-[#1d2b22] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-semibold">Introductory Pricing Live Now</p>
          <p className="text-sm text-white/70">The complete portfolio and website experience starts at $39.99 per year.</p>
        </div>
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Choose how much storage you need. Everything else comes with it.</h2>
            <p className="mt-4 text-lg leading-8 text-[#5f594f]">
              Every plan includes all {SELECTABLE_WEBSITE_TEMPLATE_IDS.length} templates, the complete website builder, custom domains, embeds, Lightroom and Smart Folder imports, guided help, sharing controls, and desktop and mobile presentation.
            </p>
            <p className="mt-4 rounded-md border border-[#ded8cc] bg-white p-4 text-base leading-7 text-[#5f594f] shadow-sm">
              PhotoView.io is not trying to run your whole photography business. It is a focused place to store, curate, display, and share the photographs and video you care about most.
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
                {["5 GB portfolio storage", "Photo and video portfolios", "Original files preserved securely", "Portfolio-first public site", "Visual website builder with one Hero video", "Guided AI help and campaign tutorial", "Social campaign designer and scheduler", "Mobile and desktop gallery viewing", "Public sharing links and embeds"].map((item) => (
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
              <p>Every plan includes photo and video portfolios, the visual website builder with one Hero video, mobile viewing, embeds, guided AI help, and public sharing. Choose a plan based on the storage your work needs.</p>
              <p>There is no separate PhotoView.io video-hosting charge. Original video files, web playback copies, and poster images use the storage included with the subscriber&apos;s plan.</p>
              <p>Subscribers receive a personal referral link. Each eligible trial that converts to paid access adds a permanent 1 GB storage bonus once. It never adds subscription time or recurring annual credit.</p>
              <p>Storage is metered with alerts and upgrade prompts as a subscriber approaches their plan limit. Public viewing traffic is monitored for abuse, performance, and reliability, but it is not sold as a separate plan allowance.</p>
            </div>
            <details className="mt-5 rounded-md border border-[#ded8cc] bg-[#fbfaf7] p-4 text-sm text-[#5f594f]">
              <summary className="cursor-pointer font-semibold text-[#1f211e]">Video specifications</summary>
              <div className="mt-3 grid gap-2 leading-6">
                <p>Upload MP4 files up to 5 GB. MOV files are converted to MP4 for reliable browser playback; MOV files larger than 750 MB should be exported as H.264 MP4 before upload.</p>
                <p>Videos never autoplay in a portfolio, remain available for full-screen viewing, and cannot replace the still photograph used as a portfolio cover.</p>
              </div>
            </details>
            <Link className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-[#1d2b22] px-4 text-sm font-semibold text-white hover:bg-[#26382d]" href="/register">
              Start 14-day trial
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[#d7e2dc] bg-[#f7f8f5] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9c6f1d]">Frequently asked questions</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">The practical details, before you begin.</h2>
          </div>
          <div className="mt-8 grid gap-3">
            {[
              ["Is PhotoView a photo editor?", "No. PhotoView is the presentation and publishing home for work you have already finished in Lightroom, Capture One, Photoshop, or another editor."],
              ["Can I use my own domain?", "Yes. Start with a PhotoView address, then connect a domain you already own. Guided setup covers both the root domain and www address."],
              ["Can I add PhotoView to my current website?", "Yes. Create separate embed profiles for one portfolio or your complete portfolio grid. When you update PhotoView, connected embeds update too."],
              ["Will my photographs look good on a phone?", "Yes. The mobile viewer is full-screen, swipeable, and designed specifically for vertical and landscape images rather than merely shrinking a desktop page."],
              ["Can I keep a portfolio private?", "Yes. Use private links, passwords, email verification, download controls, and watermarks according to the audience and purpose."],
              ["Can I import directly from Lightroom Classic?", "Yes. The Lightroom Plugin sends finished rendered files up to 50 MB into a new or existing PhotoView portfolio."],
              ["Does PhotoView support video?", "Yes. Photographs, MP4 files, and MOV files can live together in a portfolio, and the website Hero can use an uploaded looping MP4."],
              ["What happens if I change templates?", "Your portfolios, pages, and content stay in place. You can switch templates and then refine the controls that are relevant to the new design."],
            ].map(([question, answer]) => (
              <details className="rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm" key={question}>
                <summary className="cursor-pointer list-none pr-6 text-lg font-semibold">{question}</summary>
                <p className="mt-3 leading-7 text-[#5f594f]">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(115deg,#edf8f4_0%,#fff8f3_52%,#f4f1fa_100%)] px-6 py-20 text-center md:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9c6f1d]">Your finished photographs are ready</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">Give them the home and the audience they deserve.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#5f594f]">
            Start with the work you already love. Choose a template, shape the experience, connect your domain, and publish a presentation that finally feels worthy of the photographs.
          </p>
          <Link className="mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-[#1d2b22] px-6 text-sm font-semibold text-white hover:bg-[#26382d]" href="/register">
            Start your 14-day free trial
            <ArrowRight className="size-4" />
          </Link>
          <p className="mt-4 text-sm leading-6 text-[#6f685d]">
            A payment method starts the trial. You are not charged until day 14, and you can cancel before then.
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
