"use client"

import { ArrowRight, Images, MonitorSmartphone, Play, ShieldCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { PortfolioGallery } from "@/lib/gallery-utils"

type HomeHeroProps = {
  galleries: PortfolioGallery[]
}

export function HomeHero({ galleries }: HomeHeroProps) {
  const allPhotos = galleries.flatMap((gallery) => gallery.photos ?? [])
  const heroImage =
    allPhotos.find((photo) => photo.width && photo.height && photo.width > photo.height * 1.6)?.displayUrl ??
    galleries.find((gallery) => gallery.id === "greenland")?.cover ??
    galleries[0]?.cover
  const phonePortraitImage =
    allPhotos.find((photo) => photo.width && photo.height && photo.height > photo.width * 1.15)?.displayUrl ??
    galleries[0]?.cover
  const phoneLandscapeImage =
    allPhotos.find((photo) => photo.width && photo.height && photo.width > photo.height * 1.6)?.displayUrl ??
    galleries[1]?.cover
  const previewGalleries = galleries.slice(0, 6)

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-black">
      <div className="mx-auto grid min-h-[82vh] max-w-7xl gap-10 px-6 py-14 md:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-20">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-[#d8a84f]">
            <MonitorSmartphone className="size-4" />
            Portfolio-first gallery software
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight md:text-7xl">
            Publish cinematic photo portfolios without the platform clutter.
          </h1>
          <p className="mt-6 text-lg leading-8 text-white/68">
            PhotoViewPro helps photographers turn curated work into fast, beautiful galleries that feel intentional on desktop and effortless on mobile.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex h-12 items-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-black hover:bg-white/88"
              data-analytics-event="SIGNUP_CLICK"
              data-analytics-label="Hero start 14-day trial"
              href="/register"
            >
              Start 14-day trial
              <ArrowRight className="size-4" />
            </Link>
            <Link className="inline-flex h-12 items-center gap-2 rounded-md border border-white/18 px-5 text-sm font-semibold text-white hover:bg-white/10" href="/portfolio">
              <Play className="size-4" />
              View demo portfolio
            </Link>
          </div>
          <div className="mt-8 grid gap-3 text-sm text-white/62 sm:grid-cols-3">
            {[
              [Images, "Gallery grids"],
              [ShieldCheck, "Privacy controls"],
              [MonitorSmartphone, "Mobile lightbox"],
            ].map(([Icon, label]) => (
              <div className="flex items-center gap-2" key={label as string}>
                <Icon className="size-4 text-[#d8a84f]" />
                <span>{label as string}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-md border border-white/12 bg-[#070707] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-white/46">
              <span>PhotoViewPro live portfolio preview</span>
              <span>Desktop + mobile ready</span>
            </div>
            <div className="grid gap-3 p-3 md:grid-cols-[1.25fr_0.75fr]">
              <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-black">
                {heroImage && <Image alt="PhotoViewPro cinematic gallery preview" className="object-contain" fill priority sizes="760px" src={heroImage} />}
                <div className="absolute inset-x-0 bottom-0 bg-black/64 px-4 py-3">
                  <p className="text-sm font-semibold">Showcase presentation</p>
                  <p className="mt-1 text-xs text-white/55">Centered image, filmstrip navigation, clean controls</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
                {previewGalleries.slice(0, 3).map((gallery) => (
                  <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-white/10 bg-black" key={gallery.id}>
                    {gallery.cover && <Image alt={`${gallery.name} gallery cover preview`} className="object-cover" fill sizes="260px" src={gallery.cover} />}
                    <div className="absolute inset-x-0 bottom-0 bg-black/58 px-3 py-2">
                      <p className="truncate text-xs font-semibold">{gallery.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-8 right-6 hidden w-52 rounded-[1.75rem] border border-white/14 bg-black p-3 shadow-2xl xl:block">
            <div className="relative aspect-[9/16] overflow-hidden rounded-[1.25rem] bg-black">
              {phonePortraitImage && <Image alt="PhotoViewPro portrait mobile preview" className="object-cover" fill sizes="208px" src={phonePortraitImage} />}
              <div className="absolute inset-x-0 top-0 flex justify-between bg-black/45 px-3 py-3 text-xs">
                <span>Grid</span>
                <span>×</span>
              </div>
              <div className="absolute inset-x-3 bottom-3 overflow-hidden rounded-md border border-white/18 bg-black">
                <div className="relative aspect-[16/9]">
                  {phoneLandscapeImage && <Image alt="PhotoViewPro landscape mobile preview" className="object-cover" fill sizes="180px" src={phoneLandscapeImage} />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
