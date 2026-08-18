import { SELECTABLE_WEBSITE_TEMPLATE_IDS } from "@/lib/website-builder-rules"
import { Aperture, AppWindow, ArrowRight, LayoutTemplate, MonitorSmartphone } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const marketingImages = {
  hero: "/marketing-preview/myanmar-temple.webp",
  phone: "/marketing-preview/portrait-scarf.webp",
  thumbnails: [
    { alt: "Myanmar temple portfolio cover", label: "Myanmar", src: "/marketing-preview/myanmar-temple-thumbnail.webp" },
    { alt: "Lofoten aurora portfolio cover", label: "Lofoten", src: "/marketing-preview/lofoten-aurora-thumbnail.webp" },
    { alt: "Egypt Sphinx portfolio cover", label: "Egypt", src: "/marketing-preview/egypt-sphinx-thumbnail.webp" },
    { alt: "Sunset panorama portfolio cover", label: "Panorama", src: "/marketing-preview/sunset-panorama-thumbnail.webp" },
  ],
}

export function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-[#d9ddd8] bg-[linear-gradient(115deg,#edf8f4_0%,#fff8f3_52%,#f4f1fa_100%)]">
      <div className="mx-auto grid min-h-[78vh] max-w-7xl gap-10 px-6 py-14 md:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-16">
        <div className="max-w-2xl">
          <p className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-[#f0bd3b] bg-[#17241d] px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-[#ffd86a] shadow-lg shadow-[#d8a84f]/20 ring-2 ring-[#f6cb58]/20">
            <MonitorSmartphone className="size-4 text-white" />
            <span>Shoot</span>
            <span className="text-white/60">.</span>
            <span>Process</span>
            <span className="text-white/60">.</span>
            <span>Show</span>
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.08] text-[#1f211e] md:text-5xl xl:text-[3.25rem]">
            Your photography, beautifully displayed.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#5f594f] md:text-lg md:leading-8">
            Turn finished photographs into a gorgeous website, mobile portfolio, and live embeds. Update your work once in PhotoView and every presentation stays current.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex h-12 items-center gap-2 rounded-md bg-[#1d2b22] px-5 text-sm font-semibold text-white hover:bg-[#26382d]"
              data-analytics-event="SIGNUP_CLICK"
              data-analytics-label="Hero build your portfolio"
              href="/register"
            >
              Build your portfolio
              <ArrowRight className="size-4" />
            </Link>
            <Link
              className="inline-flex h-12 items-center gap-2 rounded-md border border-[#b9b0a1] bg-white/70 px-5 text-sm font-semibold text-[#1d2b22] hover:bg-white"
              href="/#templates"
            >
              Explore {SELECTABLE_WEBSITE_TEMPLATE_IDS.length} designs
            </Link>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6f685d]">
            Build and publish free for 14 days. Payment method required. Cancel before day 14 and pay nothing.
          </p>
          <p className="sr-only">
            PhotoView.io helps photographers securely store, curate, and showcase photographs and video. Photos, MP4, and MOV files are supported, along with the Lightroom Plugin.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-[#6f685d] sm:grid-cols-3 sm:text-[13px]">
            {[
              [Aperture, "Shoot more. Manage less."],
              [AppWindow, "Finish in the tools you love."],
              [LayoutTemplate, "Publish once."],
              [MonitorSmartphone, "Show everywhere."],
            ].map(([Icon, label]) => (
              <div className="flex items-center gap-2" key={label as string}>
                <Icon className="size-4 text-[#d8a84f]" />
                <span>{label as string}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-md border border-[#d8a84f]/70 bg-[#070707] shadow-2xl shadow-[#d8a84f]/10 ring-1 ring-[#d8a84f]/25">
            <div className="flex items-center justify-between border-b border-[#d8a84f]/45 bg-[#fbfaf7] px-4 py-3 text-xs text-[#1f211e]">
              <span>PhotoView.io live portfolio preview</span>
              <span>Desktop + mobile ready</span>
            </div>
            <div className="grid gap-5 p-4 lg:grid-cols-[1fr_220px]">
              <div className="min-w-0">
                <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-[#d8a84f]/35 bg-black">
                  <Image alt="PhotoView.io cinematic desktop portfolio preview" className="object-cover" fill priority sizes="760px" src={marketingImages.hero} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {marketingImages.thumbnails.map((image) => (
                    <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-[#d8a84f]/35 bg-black" key={image.src}>
                      <Image alt={image.alt} className="object-cover" fill sizes="180px" src={image.src} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mx-auto w-full max-w-[220px] self-center rounded-[1.75rem] border border-[#d8a84f]/45 bg-black p-3 shadow-2xl shadow-[#d8a84f]/10">
                <div className="relative aspect-[9/16] overflow-hidden rounded-[1.2rem] bg-black">
                  <Image alt="PhotoView.io mobile portrait lightbox preview" className="object-cover" fill sizes="220px" src={marketingImages.phone} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
