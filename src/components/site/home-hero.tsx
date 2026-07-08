"use client"

import { ArrowRight, Bot, Code2, Images, MonitorSmartphone, Play, Smartphone } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const marketingImages = {
  hero: "/marketing-preview/myanmar-temple.png",
  phone: "/marketing-preview/portrait-scarf.png",
  thumbnails: [
    { alt: "Myanmar temple portfolio cover", label: "Myanmar", src: "/marketing-preview/myanmar-temple.png" },
    { alt: "Lofoten aurora portfolio cover", label: "Lofoten", src: "/marketing-preview/loften-aurora.png" },
    { alt: "Egypt Sphinx portfolio cover", label: "Egypt", src: "/marketing-preview/egypt-sphinx.png" },
    { alt: "Sunset panorama portfolio cover", label: "Panorama", src: "/marketing-preview/sunset-panorama.png" },
  ],
}

export function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-[#ded8cc] bg-[#fbfaf7]">
      <div className="mx-auto grid min-h-[78vh] max-w-7xl gap-10 px-6 py-14 md:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-16">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-[#d8a84f]">
            <MonitorSmartphone className="size-4" />
            Store. Curate. Display. Share.
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.08] text-[#1f211e] md:text-5xl xl:text-[3.25rem]">
            A beautiful home for the photography you care about most.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#5f594f] md:text-lg md:leading-8">
            PhotoViewPro helps serious photographers store their work, curate their best images, display them beautifully on desktop and mobile, and share polished portfolios anywhere.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex h-12 items-center gap-2 rounded-md bg-[#1d2b22] px-5 text-sm font-semibold text-white hover:bg-[#26382d]"
              data-analytics-event="SIGNUP_CLICK"
              data-analytics-label="Hero start 14-day trial"
              href="/register"
            >
              Start 14-day trial
              <ArrowRight className="size-4" />
            </Link>
            <Link className="inline-flex h-12 items-center gap-2 rounded-md border border-[#d7cec0] bg-white px-5 text-sm font-semibold text-[#1f211e] hover:bg-[#f1ece3]" href="/portfolio">
              <Play className="size-4" />
              View demo portfolio
            </Link>
          </div>
          <div className="mt-8 grid gap-3 text-sm text-[#6f685d] sm:grid-cols-3">
            {[
              [Images, "Multiple portfolios"],
              [MonitorSmartphone, "Beautiful display"],
              [Smartphone, "Phone imports"],
              [Code2, "Website embeds"],
              [Bot, "AI help"],
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
              <span>PhotoViewPro live portfolio preview</span>
              <span>Desktop + mobile ready</span>
            </div>
            <div className="grid gap-5 p-4 lg:grid-cols-[1fr_220px]">
              <div className="min-w-0">
                <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-[#d8a84f]/35 bg-black">
                  <Image alt="PhotoViewPro cinematic desktop portfolio preview" className="object-cover" fill priority sizes="760px" src={marketingImages.hero} />
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
                  <Image alt="PhotoViewPro mobile portrait lightbox preview" className="object-cover" fill sizes="220px" src={marketingImages.phone} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
