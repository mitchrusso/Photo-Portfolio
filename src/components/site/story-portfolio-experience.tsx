"use client"

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Grid3X3,
  Lock,
  Maximize2,
  Menu,
  Rows3,
  X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, type CSSProperties } from "react"
import {
  InspiredPortfolioExperience,
  type InspiredPortfolioTemplate,
} from "@/components/site/inspired-portfolio-experience"

export type StoryPortfolioTemplate =
  | "editorial-story"
  | "cinematic-chapters"
  | "museum-index"
  | "editorial-rail"
  | "masonry-journal"
  | "dark-filmstrip"
  | "coral-panorama"
  | "scroll-stack"
  | InspiredPortfolioTemplate

export type StoryPortfolioPhoto = {
  height: number | null
  id: string
  source: string
  title: string
  width: number | null
}

export type StoryPortfolioItem = {
  cover: string
  href: string
  id: string
  imageCount: number
  name: string
  photos: StoryPortfolioPhoto[]
}

export type StoryPortfolioNavItem = {
  href: string
  key: string
  label: string
}

type StoryPortfolioExperienceProps = {
  accentColor: string
  backgroundColor: string
  compact?: boolean
  editing?: boolean
  heroButtonHref: string
  heroButtonLabel: string
  heroContentVerticalAlignment: "top" | "middle" | "bottom"
  heroEyebrow: string
  heroHeadline: string
  heroHeadlineScrollSlowdown: number
  heroHeadlineScrollDuration: number
  heroHeadlineStyle: CSSProperties
  heroImageFit: "contain" | "cover"
  heroImagePosition: "left" | "center" | "right"
  heroLayout: "overlay" | "split" | "stacked"
  heroMediaSource: string
  heroOverlayStrength: number
  heroSubhead: string
  heroVideoUrl: string
  filmStripPhotos: StoryPortfolioPhoto[]
  introBody: string
  introHeadline: string
  navItems: StoryPortfolioNavItem[]
  onNavigate: (key: string, href: string) => void
  showHero: boolean
  showFilmStrip: boolean
  showHeroBody: boolean
  showHeroButton: boolean
  showHeroEyebrow: boolean
  showHeroHeadline: boolean
  siteName: string
  stories: StoryPortfolioItem[]
  template: StoryPortfolioTemplate
  textColor: string
  textAlign: "left" | "center" | "right"
}

function ScrollStackExperience({
  accentColor,
  compact = false,
  editing = false,
  filmStripPhotos,
  heroButtonHref,
  heroButtonLabel,
  heroContentVerticalAlignment,
  heroEyebrow,
  heroHeadline,
  heroImageFit,
  heroImagePosition,
  heroMediaSource,
  heroOverlayStrength,
  heroSubhead,
  heroVideoUrl,
  introBody,
  introHeadline,
  navItems,
  onNavigate,
  showFilmStrip,
  showHero,
  showHeroBody,
  showHeroButton,
  showHeroEyebrow,
  showHeroHeadline,
  siteName,
  stories,
  textAlign,
}: StoryPortfolioExperienceProps) {
  const featuredStories = stories.slice(0, 3)
  const marqueePhotos = (filmStripPhotos.length > 0
    ? filmStripPhotos
    : stories.flatMap((story) => story.photos.length > 0
      ? story.photos
      : [{ height: null, id: `${story.id}:cover`, source: story.cover, title: story.name, width: null }])
  ).slice(0, 12)
  const heroSource = heroMediaSource || featuredStories[0]?.cover || marqueePhotos[0]?.source || ""
  const heroVerticalClass = heroContentVerticalAlignment === "top"
    ? "justify-start"
    : heroContentVerticalAlignment === "bottom"
      ? "justify-end"
      : "justify-center"
  const heroHorizontalClass = textAlign === "center"
    ? "items-center"
    : textAlign === "right"
      ? "items-end"
      : "items-start"
  const objectPosition = heroImagePosition === "left"
    ? "left center"
    : heroImagePosition === "right"
      ? "right center"
      : "center"

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#eef0e7] text-[#11140f]" data-scroll-stack-experience data-story-template="scroll-stack">
      {showHero ? (
        <section className={`relative isolate overflow-hidden bg-[#0c110e] text-white ${compact ? "min-h-[560px]" : "min-h-screen"}`}>
          {heroSource || heroVideoUrl ? (
            <div className="absolute inset-0">
              <StoryHeroMedia
                alt={heroHeadline || siteName}
                editing={editing}
                imageFit={heroImageFit}
                imagePosition={heroImagePosition}
                overlayStrength={Math.max(heroOverlayStrength, 48)}
                source={heroSource}
                videoUrl={heroVideoUrl}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#0c110e]/80" />
            </div>
          ) : null}
          <header className={`relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-5 ${compact ? "px-5 py-5" : "px-7 py-7 md:px-12"}`}>
            <button
              className="text-left text-sm font-semibold uppercase tracking-[0.2em]"
              onClick={() => onNavigate("home", "#home")}
              type="button"
            >
              {siteName}
            </button>
            <nav aria-label="Website pages" className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.16em] md:gap-7">
              {navItems.slice(0, compact ? 2 : 4).map((item) => (
                <button
                  className="transition-opacity hover:opacity-60"
                  key={`${item.key}:${item.href}`}
                  onClick={() => onNavigate(item.key, item.href)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </header>
          <div
            className={`relative z-10 mx-auto flex w-full max-w-[1440px] flex-col ${heroHorizontalClass} ${heroVerticalClass} ${compact ? "min-h-[475px] px-6 py-12" : "min-h-[calc(100vh-92px)] px-8 py-20"}`}
            style={{ textAlign }}
          >
            {showHeroEyebrow && heroEyebrow ? (
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: accentColor }}>
                {heroEyebrow}
              </p>
            ) : null}
            {showHeroHeadline ? (
              <h1 className={`max-w-6xl font-semibold leading-[0.92] tracking-[-0.055em] text-balance ${compact ? "text-5xl" : "text-6xl sm:text-7xl lg:text-[7.6rem]"}`}>
                {heroHeadline || siteName}
              </h1>
            ) : null}
            {showHeroBody && heroSubhead ? (
              <p className={`mt-7 max-w-2xl leading-relaxed text-white/72 ${compact ? "text-sm" : "text-lg md:text-xl"}`}>
                {heroSubhead}
              </p>
            ) : null}
            {showHeroButton && heroButtonLabel ? (
              <a
                className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur-sm transition hover:bg-white hover:text-black"
                href={heroButtonHref}
                onClick={(event) => {
                  if (editing) event.preventDefault()
                }}
              >
                {heroButtonLabel}
                <ArrowDown aria-hidden="true" className="size-4" />
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className={`${compact ? "px-4 py-16" : "px-5 py-24 md:px-8 md:py-36"}`}>
        <div className="mx-auto max-w-[1320px]">
          <div className={`${compact ? "mb-12" : "mb-12 md:sticky md:top-0 md:z-10 md:mb-20 md:flex md:min-h-[72vh] md:items-center md:justify-center"}`}>
            <div className="max-w-5xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] opacity-55">Portfolio</p>
              <h2 className={`mt-6 font-semibold leading-[0.94] tracking-[-0.055em] text-balance ${compact ? "text-4xl" : "text-4xl sm:text-6xl md:text-8xl"}`}>
                {introHeadline || "Stories made to stay with you."}
              </h2>
              {introBody ? (
                <p className={`mx-auto mt-7 max-w-2xl leading-relaxed opacity-65 ${compact ? "text-sm" : "text-lg"}`}>
                  {introBody}
                </p>
              ) : null}
            </div>
          </div>

          <div className={compact ? "space-y-7" : "relative space-y-7 md:space-y-[18vh] md:pb-[14vh]"}>
            {featuredStories.map((story, index) => (
              <article
                className={`group overflow-hidden rounded-[28px] border border-black/10 bg-[#fbfcf7] shadow-[0_25px_80px_rgba(30,35,24,0.13)] ${compact ? "" : "md:sticky md:min-h-[70vh]"}`}
                data-scroll-stack-card
                key={story.id}
                style={compact ? undefined : { top: `${48 + index * 24}px`, zIndex: index + 20 }}
              >
                <div className={`${compact ? "flex flex-col" : "flex flex-col md:grid md:min-h-[70vh] md:grid-cols-[1.08fr_0.92fr]"}`}>
                  <div className={`relative overflow-hidden bg-[#d6d9cf] ${compact ? "aspect-[4/3]" : "aspect-[4/3] md:aspect-auto md:min-h-[70vh]"}`}>
                    <Image
                      alt={story.name}
                      className={`transition duration-700 group-hover:scale-[1.025] ${heroImageFit === "contain" ? "object-contain" : "object-cover"}`}
                      fill
                      sizes={compact ? "100vw" : "(max-width: 767px) 100vw, 55vw"}
                      src={story.cover}
                      style={{ objectPosition }}
                      unoptimized
                    />
                    <span className="absolute left-5 top-5 rounded-full bg-black/58 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className={`flex flex-col justify-between ${compact ? "gap-8 p-6" : "gap-8 p-6 sm:p-10 md:p-14 lg:p-16"}`}>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-50">Portfolio</p>
                      <h3 className={`mt-5 font-semibold leading-[0.96] tracking-[-0.045em] ${compact ? "text-4xl" : "text-4xl sm:text-5xl lg:text-7xl"}`}>
                        {story.name}
                      </h3>
                      <p className={`mt-6 max-w-lg leading-relaxed opacity-65 ${compact ? "text-sm" : "text-base lg:text-lg"}`}>
                        {story.photos[0]?.title && story.photos[0].title !== story.name
                          ? story.photos[0].title
                          : `A focused collection of ${story.imageCount} photographs, presented as a complete visual story.`}
                      </p>
                    </div>
                    <div className="mt-10 border-t border-black/12 pt-5">
                      <a
                        className="flex items-center justify-between gap-4 text-sm font-semibold"
                        href={story.href}
                        onClick={(event) => {
                          if (editing) event.preventDefault()
                        }}
                      >
                        <span>Open portfolio</span>
                        <span aria-hidden="true" className="text-xl transition-transform group-hover:translate-x-1">→</span>
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {showFilmStrip && marqueePhotos.length > 0 ? (
        <section className={`${compact ? "pb-16 pt-8" : "pb-28 pt-16"}`}>
          <div className="mx-auto mb-8 max-w-[1320px] px-5 md:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-50">More from the archive</p>
            <h2 className={`mt-3 font-semibold leading-none tracking-[-0.045em] ${compact ? "text-4xl" : "text-4xl sm:text-6xl md:text-7xl"}`}>
              Keep exploring.
            </h2>
          </div>
          <div className="overflow-hidden" data-scroll-stack-filmstrip>
            <div className="photoview-scroll-stack-marquee flex w-max gap-4 px-2">
              {[0, 1].map((copy) => (
                <div aria-hidden={copy === 1} className="flex shrink-0 gap-4" key={copy}>
                  {marqueePhotos.map((photo, index) => (
                    <div
                      className={`relative shrink-0 overflow-hidden rounded-[20px] bg-[#ccd0c5] ${compact ? "h-48 w-72" : "h-48 w-72 md:h-80 md:w-[30rem]"}`}
                      key={`${copy}:${photo.id}:${index}`}
                    >
                      <Image
                        alt={copy === 0 ? photo.title : ""}
                        className="object-cover"
                        fill
                        sizes={compact ? "288px" : "(max-width: 767px) 288px, 480px"}
                        src={photo.source}
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <footer className="border-t border-black/10 px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-5 text-xs font-semibold uppercase tracking-[0.16em]">
          <span>{siteName}</span>
          <button onClick={() => onNavigate("contact", "#contact")} type="button">Contact</button>
        </div>
      </footer>
    </div>
  )
}

function formatStoryIndex(index: number) {
  return String(index + 1).padStart(2, "0")
}

function StoryImage({
  alt,
  className = "",
  priority = false,
  source,
}: {
  alt: string
  className?: string
  priority?: boolean
  source: string
}) {
  return (
    <Image
      alt={alt}
      className={`object-contain ${className}`}
      fill
      priority={priority}
      sizes="100vw"
      src={source}
      unoptimized
    />
  )
}

function FullFrameStoryImage({
  photo,
  sizes,
}: {
  photo: StoryPortfolioPhoto
  sizes: string
}) {
  return (
    <Image
      alt={photo.title}
      className="h-auto max-h-full w-auto max-w-full object-contain"
      height={photo.height || 900}
      sizes={sizes}
      src={photo.source}
      unoptimized
      width={photo.width || 1200}
    />
  )
}

function StoryHeroMedia({
  alt,
  editing,
  imageFit,
  imagePosition,
  overlayStrength,
  source,
  videoUrl,
}: {
  alt: string
  editing: boolean
  imageFit: "contain" | "cover"
  imagePosition: "left" | "center" | "right"
  overlayStrength: number
  source: string
  videoUrl: string
}) {
  const [failedVideoUrl, setFailedVideoUrl] = useState("")
  const objectPosition = imagePosition === "left" ? "left center" : imagePosition === "right" ? "right center" : "center"
  const showVideo = Boolean(videoUrl) && !editing && failedVideoUrl !== videoUrl

  return (
    <>
      {showVideo ? (
        <video
          aria-label={alt}
          autoPlay
          className={`absolute inset-0 size-full ${imageFit === "contain" ? "object-contain" : "object-cover"}`}
          loop
          muted
          onError={() => setFailedVideoUrl(videoUrl)}
          playsInline
          src={videoUrl}
          style={{ objectPosition }}
        />
      ) : source ? (
        <Image
          alt={alt}
          className={imageFit === "contain" ? "object-contain" : "object-cover"}
          fill
          priority
          sizes="100vw"
          src={source}
          style={{ objectPosition }}
          unoptimized
        />
      ) : null}
      {editing && videoUrl ? (
        <div className="absolute inset-0 grid place-items-center bg-black/35 p-5 text-center text-white">
          <span className="rounded-md border border-white/25 bg-black/65 px-4 py-3 text-xs font-semibold shadow-lg">
            Hero video paused while editing<br />Use Preview to play it
          </span>
        </div>
      ) : null}
      {overlayStrength > 0 ? (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: Math.max(0, Math.min(80, overlayStrength)) / 100 }}
        />
      ) : null}
    </>
  )
}

function StoryHero({
  activeStoryName,
  accentColor,
  compact,
  editing,
  eyebrow,
  headline,
  headlineStyle,
  imageFit,
  imagePosition,
  layout,
  mediaSource,
  overlayStrength,
  showBody,
  showButton,
  showEyebrow,
  showHeadline,
  subhead,
  template,
  textAlign,
  videoUrl,
  buttonHref,
  buttonLabel,
  verticalAlignment,
}: {
  activeStoryName: string
  accentColor: string
  compact: boolean
  editing: boolean
  eyebrow: string
  headline: string
  headlineStyle: CSSProperties
  imageFit: "contain" | "cover"
  imagePosition: "left" | "center" | "right"
  layout: "overlay" | "split" | "stacked"
  mediaSource: string
  overlayStrength: number
  showBody: boolean
  showButton: boolean
  showEyebrow: boolean
  showHeadline: boolean
  subhead: string
  template: StoryPortfolioTemplate
  textAlign: "left" | "center" | "right"
  videoUrl: string
  buttonHref: string
  buttonLabel: string
  verticalAlignment: "top" | "middle" | "bottom"
}) {
  const isOverlay = layout === "overlay"
  const isStacked = layout === "stacked"
  const isCinematic = template === "cinematic-chapters"
  const verticalClass = verticalAlignment === "top"
    ? "justify-start"
    : verticalAlignment === "bottom"
      ? "justify-end"
      : "justify-center"
  const horizontalClass = textAlign === "center"
    ? "items-center"
    : textAlign === "right"
      ? "items-end"
      : "items-start"
  const textPanel = (
    <div
      className={`relative z-10 flex flex-col ${horizontalClass} ${verticalClass} ${isOverlay ? "max-w-4xl text-white" : ""} ${
        compact ? "p-5" : isOverlay ? "p-7 md:p-10" : "p-7 md:p-12"
      }`}
      style={{ textAlign }}
    >
      {showEyebrow && eyebrow.trim() ? (
        <p
          className={`text-xs font-semibold uppercase tracking-[0.24em] ${isOverlay ? "text-white/75" : ""}`}
          style={isOverlay ? undefined : { color: accentColor }}
        >
          {eyebrow}
        </p>
      ) : null}
      {showHeadline && headline ? (
        <h1
          className={`mt-4 font-serif font-normal leading-[0.9] ${isCinematic ? "uppercase" : ""}`}
          style={headlineStyle}
        >
          {headline}
        </h1>
      ) : null}
      {showBody && subhead ? (
        <p className={`mt-5 max-w-2xl text-base leading-7 ${isOverlay ? "text-white/82" : "opacity-65"}`}>{subhead}</p>
      ) : null}
      {showButton && buttonLabel ? (
        <a
          className={`mt-6 inline-flex border px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] ${
            isOverlay ? "border-white/55 bg-black/20 text-white backdrop-blur-sm" : "border-current/25"
          }`}
          href={buttonHref}
        >
          {buttonLabel}
        </a>
      ) : null}
    </div>
  )

  return (
    <section
      className={`relative overflow-hidden ${
        isOverlay
          ? compact ? "min-h-[58svh]" : "min-h-[70svh]"
          : isStacked
            ? "flex flex-col"
            : compact ? "grid grid-cols-1" : "grid min-h-[70svh] md:grid-cols-[0.58fr_1.42fr] md:items-stretch"
      } ${isCinematic ? "border border-white/12 bg-[#080808]" : "border-b border-current/15"}`}
      data-story-hero-layout={layout}
    >
      {isOverlay ? (
        <>
          <div className="absolute inset-0">
            <StoryHeroMedia
              alt={headline || activeStoryName}
              editing={editing}
              imageFit={imageFit}
              imagePosition={imagePosition}
              overlayStrength={overlayStrength}
              source={mediaSource}
              videoUrl={videoUrl}
            />
          </div>
          <div
            className={`absolute inset-0 flex flex-col ${horizontalClass} ${verticalClass} ${compact ? "px-4" : "px-8"}`}
            data-story-hero-copy
          >
            {textPanel}
          </div>
        </>
      ) : (
        <>
          {textPanel}
          <div className={`relative min-h-[360px] ${isStacked ? compact ? "aspect-[4/3]" : "aspect-[16/8]" : ""}`}>
            <StoryHeroMedia
              alt={headline || activeStoryName}
              editing={editing}
              imageFit={imageFit}
              imagePosition={imagePosition}
              overlayStrength={0}
              source={mediaSource}
              videoUrl={videoUrl}
            />
          </div>
        </>
      )}
    </section>
  )
}

export function StoryPortfolioExperience({
  accentColor,
  backgroundColor,
  compact = false,
  editing = false,
  heroButtonHref,
  heroButtonLabel,
  heroContentVerticalAlignment,
  heroEyebrow,
  heroHeadline,
  heroHeadlineScrollSlowdown,
  heroHeadlineScrollDuration,
  heroHeadlineStyle,
  heroImageFit,
  heroImagePosition,
  heroLayout,
  heroMediaSource,
  heroOverlayStrength,
  heroSubhead,
  heroVideoUrl,
  filmStripPhotos,
  introBody,
  introHeadline,
  navItems,
  onNavigate,
  showHero,
  showFilmStrip,
  showHeroBody,
  showHeroButton,
  showHeroEyebrow,
  showHeroHeadline,
  siteName,
  stories,
  template,
  textColor,
  textAlign,
}: StoryPortfolioExperienceProps) {
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [coralMenu, setCoralMenu] = useState<"info" | "portfolio" | null>(null)
  const [coralPhotoIndex, setCoralPhotoIndex] = useState(0)
  const [coralViewMode, setCoralViewMode] = useState<"sheet" | "viewer">("sheet")
  const [isIndexOpen, setIsIndexOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"single" | "grid">("single")
  const storyCount = stories.length
  const normalizedStoryIndex = storyCount > 0 ? activeStoryIndex % storyCount : 0
  const activeStory = stories[normalizedStoryIndex]
  const activePhotos = activeStory?.photos.length ? activeStory.photos : activeStory
    ? [{ height: null, id: `${activeStory.id}:cover`, source: activeStory.cover, title: activeStory.name, width: null }]
    : []
  const normalizedPhotoIndex = activePhotos.length > 0 ? activePhotoIndex % activePhotos.length : 0
  const activeImage = activePhotos[normalizedPhotoIndex]
  const activeHeroSource = heroMediaSource || activeImage?.source || activeStory?.cover || ""
  const isEditorial = template === "editorial-story"
  const isCinematic = template === "cinematic-chapters"
  const isEditorialRail = template === "editorial-rail"
  const isMasonryJournal = template === "masonry-journal"
  const isDarkFilmstrip = template === "dark-filmstrip"
  const isCoralPanorama = template === "coral-panorama"
  const allStoryPhotos = stories.flatMap((story) => story.photos.map((photo) => ({ photo, story })))
  const visibleFilmStripPhotos = filmStripPhotos.length > 0 ? filmStripPhotos : activePhotos
  const coralPhotos = allStoryPhotos.length > 0
    ? allStoryPhotos.map(({ photo }) => photo)
    : visibleFilmStripPhotos
  const normalizedCoralPhotoIndex = coralPhotos.length > 0 ? coralPhotoIndex % coralPhotos.length : 0
  const coralPhotoRows = [0, 1].map((row) =>
    coralPhotos
      .map((photo, index) => ({ index, photo }))
      .filter(({ index }) => index % 2 === row),
  )
  const coralContactNavItem = navItems.find((item) => item.key === "contact")

  if (template === "scroll-stack") {
    return (
      <ScrollStackExperience
        accentColor={accentColor}
        backgroundColor={backgroundColor}
        compact={compact}
        editing={editing}
        filmStripPhotos={filmStripPhotos}
        heroButtonHref={heroButtonHref}
        heroButtonLabel={heroButtonLabel}
        heroContentVerticalAlignment={heroContentVerticalAlignment}
        heroEyebrow={heroEyebrow}
        heroHeadline={heroHeadline}
        heroHeadlineScrollSlowdown={heroHeadlineScrollSlowdown}
        heroHeadlineScrollDuration={heroHeadlineScrollDuration}
        heroHeadlineStyle={heroHeadlineStyle}
        heroImageFit={heroImageFit}
        heroImagePosition={heroImagePosition}
        heroLayout={heroLayout}
        heroMediaSource={heroMediaSource}
        heroOverlayStrength={heroOverlayStrength}
        heroSubhead={heroSubhead}
        heroVideoUrl={heroVideoUrl}
        introBody={introBody}
        introHeadline={introHeadline}
        navItems={navItems}
        onNavigate={onNavigate}
        showFilmStrip={showFilmStrip}
        showHero={showHero}
        showHeroBody={showHeroBody}
        showHeroButton={showHeroButton}
        showHeroEyebrow={showHeroEyebrow}
        showHeroHeadline={showHeroHeadline}
        siteName={siteName}
        stories={stories}
        template={template}
        textAlign={textAlign}
        textColor={textColor}
      />
    )
  }

  if (
    template === "acclaim-portfolio"
    || template === "atelier-split"
    || template === "commercial-casebook"
    || template === "kinetic-headline"
    || template === "object-stage"
    || template === "quiet-sequence"
    || template === "specimen-wall"
    || template === "studio-split"
    || template === "swiss-sequence"
    || template === "triptych-stage"
  ) {
    return (
      <InspiredPortfolioExperience
        accentColor={accentColor}
        compact={compact}
        editing={editing}
        heroContentVerticalAlignment={heroContentVerticalAlignment}
        heroEyebrow={heroEyebrow}
        heroHeadline={heroHeadline}
        heroHeadlineScrollSlowdown={heroHeadlineScrollSlowdown}
        heroHeadlineScrollDuration={heroHeadlineScrollDuration}
        heroHeadlineStyle={heroHeadlineStyle}
        heroMediaSource={activeHeroSource}
        heroSubhead={heroSubhead}
        introBody={introBody}
        navItems={navItems}
        onNavigate={onNavigate}
        showHeroBody={showHeroBody}
        showHeroEyebrow={showHeroEyebrow}
        showHeroHeadline={showHeroHeadline}
        siteName={siteName}
        stories={stories}
        template={template}
        textAlign={textAlign}
      />
    )
  }

  const moveStory = (direction: -1 | 1) => {
    if (storyCount < 2) return
    setActivePhotoIndex(0)
    setActiveStoryIndex((current) => (current + direction + storyCount) % storyCount)
  }

  const chooseStory = (index: number) => {
    setActiveStoryIndex(index)
    setActivePhotoIndex(0)
    setIsIndexOpen(false)
    setViewMode("single")
  }

  const menuButton = (
    <button
      aria-expanded={isIndexOpen}
      aria-label={isIndexOpen ? "Close story index" : "Open story index"}
      className="inline-flex size-11 items-center justify-center rounded-full border border-current/30 bg-black/20 text-current shadow-sm backdrop-blur-md transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2"
      onClick={() => setIsIndexOpen((current) => !current)}
      type="button"
    >
      {isIndexOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
    </button>
  )

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      data-story-template={template}
      style={{ backgroundColor, color: textColor }}
    >
      {isIndexOpen ? (
        <div
          className="fixed inset-0 z-[70] overflow-y-auto px-6 py-7 backdrop-blur-xl md:px-12 md:py-10"
          style={{ backgroundColor: `${backgroundColor}ee`, color: textColor }}
        >
          <div className="mx-auto max-w-[1320px]">
            <div className="flex items-center justify-between gap-5 border-b border-current/15 pb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em]">{siteName}</p>
              {menuButton}
            </div>
            <div className="grid gap-12 py-10 lg:grid-cols-[1.55fr_0.75fr] lg:py-16">
              <section aria-labelledby="story-index-heading">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-55">Selected stories</p>
                <h2 className="sr-only" id="story-index-heading">Story index</h2>
                <ol className="mt-6 border-t border-current/15">
                  {stories.map((story, index) => (
                    <li className="border-b border-current/15" key={story.id}>
                      <button
                        className="group flex w-full items-baseline gap-5 py-4 text-left md:py-5"
                        onClick={() => chooseStory(index)}
                        type="button"
                      >
                        <span className="text-xs tabular-nums opacity-45">{formatStoryIndex(index)}</span>
                        <span className="font-serif text-2xl leading-tight transition group-hover:translate-x-1 md:text-4xl">
                          {story.name}
                        </span>
                        <span className="ml-auto text-xs opacity-45">{story.imageCount} images</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </section>
              <nav aria-label="Website pages" className="lg:border-l lg:border-current/15 lg:pl-10">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-55">Website</p>
                <ul className="mt-6 space-y-3">
                  {navItems.map((item) => (
                    <li key={`${item.key}:${item.href}`}>
                      <button
                        className="text-left text-lg opacity-75 transition hover:opacity-100"
                        onClick={() => {
                          setIsIndexOpen(false)
                          onNavigate(item.key, item.href)
                        }}
                        type="button"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      ) : null}

      {isEditorialRail ? (
        <div className={`min-h-screen bg-[#f6f5f1] text-[#202224] ${compact ? "" : "md:grid md:grid-cols-[248px_1fr]"}`}>
          <aside className={`${compact ? "border-b px-5 py-4" : "flex min-h-screen flex-col border-r px-8 py-10"} border-black/10`}>
            <button className="text-left" onClick={() => setIsIndexOpen(true)} type="button">
              <span className="block text-xl font-semibold uppercase tracking-[0.3em]">{siteName}</span>
              <span className="mt-2 block text-[10px] uppercase tracking-[0.28em]" style={{ color: accentColor }}>Photography</span>
            </button>
            <nav aria-label="Portfolio categories" className={`${compact ? "mt-4 flex gap-4 overflow-x-auto" : "mt-20 space-y-3"} text-[11px] font-semibold uppercase tracking-[0.12em]`}>
              {stories.slice(0, compact ? 6 : 8).map((story, index) => (
                <button
                  className={`block whitespace-nowrap text-left transition ${index === normalizedStoryIndex ? "opacity-100" : "opacity-55 hover:opacity-100"}`}
                  key={story.id}
                  onClick={() => chooseStory(index)}
                  type="button"
                >
                  {story.name}
                </button>
              ))}
            </nav>
            {!compact ? (
              <div className="mt-auto space-y-2 border-t border-black/10 pt-6 text-[10px] uppercase tracking-[0.14em] opacity-60">
                {navItems.slice(0, 3).map((item) => (
                  <button className="block" key={item.key} onClick={() => onNavigate(item.key, item.href)} type="button">{item.label}</button>
                ))}
              </div>
            ) : null}
          </aside>
          <main className={`${compact ? "p-4" : "flex min-h-screen flex-col px-10 py-9"}`}>
            {showHero && activeImage ? (
              <div className="flex min-h-0 flex-1 items-center justify-center bg-white">
                <FullFrameStoryImage photo={activeImage} sizes={compact ? "100vw" : "calc(100vw - 330px)"} />
              </div>
            ) : null}
            <div className="flex items-center justify-center gap-9 py-5 text-[11px] uppercase tracking-[0.18em]">
              <button aria-label="Previous portfolio" disabled={storyCount < 2} onClick={() => moveStory(-1)} type="button"><ArrowLeft className="size-4" /></button>
              <span>{formatStoryIndex(normalizedStoryIndex)} / {formatStoryIndex(Math.max(storyCount - 1, 0))}</span>
              <button aria-label="Next portfolio" disabled={storyCount < 2} onClick={() => moveStory(1)} type="button"><ArrowRight className="size-4" /></button>
            </div>
            {showFilmStrip ? (
              <div className="flex gap-2 overflow-x-auto border-t border-black/10 pt-3">
                {visibleFilmStripPhotos.map((photo, index) => (
                  <button className="flex h-16 min-w-20 shrink-0 items-center justify-center bg-black/5 p-1" key={`${photo.id}:${index}`} onClick={() => setActivePhotoIndex(index % Math.max(activePhotos.length, 1))} type="button">
                    <FullFrameStoryImage photo={photo} sizes="112px" />
                  </button>
                ))}
              </div>
            ) : null}
          </main>
        </div>
      ) : null}

      {isMasonryJournal ? (
        <div className={`min-h-screen bg-[#f4f1eb] text-[#171717] ${compact ? "" : "md:grid md:grid-cols-[190px_1fr]"}`}>
          <aside className={`${compact ? "flex items-center justify-between px-5 py-4" : "sticky top-0 flex h-screen flex-col bg-[#151515] px-6 py-9 text-white"} `}>
            <div>
              <p className="text-2xl font-light uppercase tracking-[0.2em]">{siteName}</p>
              <p className="mt-2 text-[9px] uppercase tracking-[0.3em] opacity-55">Visual stories</p>
            </div>
            {compact ? menuButton : (
              <>
                <nav aria-label="Portfolio categories" className="mt-20 space-y-4 text-[10px] uppercase tracking-[0.12em]">
                  {stories.slice(0, 9).map((story, index) => (
                    <button className={`block text-left ${index === normalizedStoryIndex ? "opacity-100" : "opacity-58"}`} key={story.id} onClick={() => chooseStory(index)} type="button">{story.name}</button>
                  ))}
                </nav>
                <div className="mt-auto space-y-3 border-t border-white/16 pt-6 text-[9px] uppercase tracking-[0.14em] opacity-60">
                  {navItems.slice(0, 4).map((item) => (
                    <button className="block" key={item.key} onClick={() => onNavigate(item.key, item.href)} type="button">{item.label}</button>
                  ))}
                </div>
              </>
            )}
          </aside>
          <main className={compact ? "p-2" : "p-3"}>
            <header className="flex flex-wrap items-center justify-between gap-4 px-1 pb-3 text-[10px] uppercase tracking-[0.16em]">
              <span>Journal</span>
              <button className="inline-flex items-center gap-2 opacity-65" onClick={() => setIsIndexOpen(true)} type="button">
                All projects <Grid3X3 className="size-3.5" />
              </button>
            </header>
            <div className={`${compact ? "columns-2" : "columns-2 lg:columns-4"} gap-2`}>
              {allStoryPhotos.map(({ photo, story }, index) => (
                <a className="group relative mb-2 block break-inside-avoid overflow-hidden bg-black/5" href={story.href} key={`${story.id}:${photo.id}:${index}`}>
                  <Image
                    alt={photo.title}
                    className="h-auto w-full object-contain"
                    height={photo.height || 900}
                    sizes={compact ? "50vw" : "25vw"}
                    src={photo.source}
                    unoptimized
                    width={photo.width || 1200}
                  />
                  <span className="absolute inset-x-0 bottom-0 translate-y-full bg-black/72 px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-white transition-transform group-hover:translate-y-0">{story.name}</span>
                </a>
              ))}
            </div>
          </main>
        </div>
      ) : null}

      {isDarkFilmstrip ? (
        <div className="min-h-screen bg-[#101010] text-[#f4f1eb]">
          <header className={`flex items-center justify-between gap-5 border-b border-white/10 ${compact ? "px-4 py-4" : "px-8 py-5"}`}>
            <button className="text-left text-sm font-semibold uppercase tracking-[0.32em]" onClick={() => setIsIndexOpen(true)} type="button">{siteName}</button>
            <nav aria-label="Primary" className={`${compact ? "hidden" : "flex"} items-center gap-7 text-[10px] uppercase tracking-[0.18em] text-white/70`}>
              {stories.slice(0, 4).map((story, index) => (
                <button key={story.id} onClick={() => chooseStory(index)} type="button">{story.name}</button>
              ))}
              <button className="inline-flex items-center gap-2" onClick={() => setIsIndexOpen(true)} type="button">Client galleries <Lock className="size-3" /></button>
            </nav>
          </header>
          <main className={compact ? "px-4 py-5" : "px-8 py-7"}>
            <div className={`${compact ? "flex flex-col gap-5" : "grid min-h-[65vh] grid-cols-[210px_1fr] gap-8"}`}>
              <aside
                className={`${compact ? "order-2" : `flex flex-col ${heroContentVerticalAlignment === "top" ? "justify-start" : heroContentVerticalAlignment === "bottom" ? "justify-end" : "justify-center"}`} ${
                  textAlign === "center" ? "items-center" : textAlign === "right" ? "items-end" : "items-start"
                }`}
                style={{ textAlign }}
              >
                {showHeroEyebrow && heroEyebrow.trim() ? <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">{heroEyebrow}</p> : null}
                {showHeroHeadline ? <h1 className="mt-4 font-serif text-4xl font-normal leading-tight">{activeStory?.name || heroHeadline}</h1> : null}
                <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-white/45">{formatStoryIndex(normalizedStoryIndex)} / {formatStoryIndex(Math.max(storyCount - 1, 0))}</p>
                {showHeroBody ? <p className="mt-7 text-sm leading-6 text-white/68">{heroSubhead || introBody}</p> : null}
                {showHeroButton ? <a className="mt-8 w-fit border-b border-white/55 pb-2 text-[10px] uppercase tracking-[0.16em]" href={heroButtonHref}>{heroButtonLabel || "View project"}</a> : null}
              </aside>
              {showHero && activeImage ? (
                <div className="flex min-h-[420px] items-center justify-center bg-[#151515]">
                  <FullFrameStoryImage photo={activeImage} sizes={compact ? "100vw" : "calc(100vw - 320px)"} />
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-center gap-8 py-5 text-[10px] uppercase tracking-[0.18em] text-white/70">
              <button aria-label="Previous image" onClick={() => setActivePhotoIndex((current) => (current - 1 + Math.max(activePhotos.length, 1)) % Math.max(activePhotos.length, 1))} type="button"><ArrowLeft className="size-5" /></button>
              <span>{formatStoryIndex(normalizedPhotoIndex)} / {formatStoryIndex(Math.max(activePhotos.length - 1, 0))}</span>
              <button aria-label="Open contact sheet" onClick={() => setViewMode("grid")} type="button"><Grid3X3 className="size-4" /></button>
              <button aria-label="Next image" onClick={() => setActivePhotoIndex((current) => (current + 1) % Math.max(activePhotos.length, 1))} type="button"><ArrowRight className="size-5" /></button>
            </div>
            {viewMode === "grid" ? (
              <div className={`${compact ? "columns-2" : "columns-3 lg:columns-4"} mb-5 gap-2 border-y border-white/10 py-3`}>
                {activePhotos.map((photo, index) => (
                  <button
                    className="mb-2 block w-full break-inside-avoid bg-[#151515]"
                    key={`${photo.id}:${index}`}
                    onClick={() => {
                      setActivePhotoIndex(index)
                      setViewMode("single")
                    }}
                    type="button"
                  >
                    <Image
                      alt={photo.title}
                      className="h-auto w-full object-contain"
                      height={photo.height || 900}
                      sizes={compact ? "50vw" : "25vw"}
                      src={photo.source}
                      unoptimized
                      width={photo.width || 1200}
                    />
                  </button>
                ))}
              </div>
            ) : null}
            {showFilmStrip ? (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {visibleFilmStripPhotos.map((photo, index) => (
                  <button
                    aria-label={`Show ${photo.title}`}
                    className={`flex h-24 min-w-28 shrink-0 items-center justify-center border bg-[#151515] p-1 ${index === normalizedPhotoIndex ? "border-white" : "border-white/10"}`}
                    key={`${photo.id}:${index}`}
                    onClick={() => setActivePhotoIndex(index % Math.max(activePhotos.length, 1))}
                    type="button"
                  >
                    <FullFrameStoryImage photo={photo} sizes="160px" />
                  </button>
                ))}
              </div>
            ) : null}
          </main>
        </div>
      ) : null}

      {isCoralPanorama ? (
        <div className="flex min-h-screen flex-col bg-white text-[#eb5b43]">
          <header className={`${compact ? "px-4 py-5" : "px-7 py-7 md:min-h-[210px] md:px-9"} relative z-30 shrink-0 bg-white`}>
            <div className={`${compact ? "flex flex-col gap-5" : "grid items-center gap-6 md:grid-cols-[minmax(0,1.25fr)_auto_minmax(0,0.75fr)]"}`}>
              <button
                className={`${
                  compact
                    ? "text-5xl"
                    : siteName.length > 20
                      ? "text-[clamp(2.75rem,4vw,4.25rem)]"
                      : "text-[clamp(4.5rem,8vw,9.25rem)]"
                } min-w-0 whitespace-normal text-left font-light leading-[0.82] tracking-[-0.065em]`}
                onClick={() => {
                  setCoralMenu(null)
                  setCoralViewMode("sheet")
                }}
                type="button"
              >
                {siteName}
              </button>
              <nav aria-label="Primary" className="relative flex items-center gap-6 text-xs font-medium">
                <button
                  aria-expanded={coralMenu === "portfolio"}
                  className="inline-flex items-center gap-1"
                  onClick={() => setCoralMenu((current) => current === "portfolio" ? null : "portfolio")}
                  type="button"
                >
                  Portfolios <ChevronDown aria-hidden="true" className="size-3" />
                </button>
                <button
                  onClick={() => {
                    setCoralMenu(null)
                    setCoralViewMode("sheet")
                  }}
                  type="button"
                >
                  All work
                </button>
                <button
                  aria-expanded={coralMenu === "info"}
                  className="inline-flex items-center gap-1"
                  onClick={() => setCoralMenu((current) => current === "info" ? null : "info")}
                  type="button"
                >
                  Info <ChevronDown aria-hidden="true" className="size-3" />
                </button>
                {coralMenu ? (
                  <div className="absolute left-0 top-full z-40 mt-3 min-w-48 bg-white py-2 shadow-[0_12px_24px_rgba(0,0,0,0.06)]">
                    {coralMenu === "portfolio"
                      ? stories.slice(0, 6).map((story, index) => (
                          <button
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-[#fff4f0]"
                            key={story.id}
                            onClick={() => {
                              chooseStory(index)
                              setCoralMenu(null)
                              setCoralViewMode("sheet")
                            }}
                            type="button"
                          >
                            {story.name}
                          </button>
                        ))
                      : navItems.slice(0, 6).map((item) => (
                          <button
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-[#fff4f0]"
                            key={`${item.key}:${item.href}`}
                            onClick={() => {
                              setCoralMenu(null)
                              onNavigate(item.key, item.href)
                            }}
                            type="button"
                          >
                            {item.label}
                          </button>
                        ))}
                  </div>
                ) : null}
              </nav>
              <div className={`${compact ? "hidden" : "hidden md:flex"} justify-end text-xs`}>
                {coralContactNavItem ? (
                  <button
                    onClick={() => onNavigate(coralContactNavItem.key, coralContactNavItem.href)}
                    type="button"
                  >
                    Contact
                  </button>
                ) : (
                  <button onClick={() => setIsIndexOpen(true)} type="button">Portfolio index</button>
                )}
              </div>
            </div>
          </header>
          <main className={`${compact ? "h-[58svh] min-h-[390px]" : "h-[calc(100svh-270px)] min-h-[470px]"} relative min-w-0 flex-1 overflow-hidden bg-[#f6f6f4]`}>
            {coralViewMode === "sheet" ? (
              <div className="absolute inset-0 overflow-x-auto overscroll-x-contain" data-coral-contact-sheet>
                <div className="grid h-full min-w-max grid-rows-2 gap-2 p-0.5">
                  {coralPhotoRows.map((row, rowIndex) => (
                    <div className="flex min-h-0 gap-2" key={rowIndex}>
                      {row.map(({ index, photo }) => {
                        const aspectRatio = photo.width && photo.height ? photo.width / photo.height : 4 / 3
                        const tileWidth = Math.round(Math.max(190, Math.min(560, (compact ? 210 : 315) * aspectRatio)))

                        return (
                          <button
                            aria-label={`Open ${photo.title}`}
                            className="relative h-full shrink-0 overflow-hidden bg-[#ececea]"
                            key={`${photo.id}:${index}`}
                            onClick={() => {
                              setCoralPhotoIndex(index)
                              setCoralViewMode("viewer")
                            }}
                            style={{ width: tileWidth }}
                            type="button"
                          >
                            <StoryImage alt={photo.title} className="transition duration-500 hover:scale-[1.015]" source={photo.source} />
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`${compact ? "grid grid-rows-2" : "grid md:grid-cols-2"} absolute inset-0 gap-1 bg-white`} data-coral-two-up-viewer>
                {[0, 1].map((offset) => {
                  const photo = coralPhotos[(normalizedCoralPhotoIndex + offset) % Math.max(coralPhotos.length, 1)]
                  if (!photo) return <div className="bg-[#f6f6f4]" key={offset} />

                  return (
                    <button
                      aria-label={`Show ${photo.title} in the contact sheet`}
                      className="relative min-h-0 overflow-hidden bg-[#f6f6f4]"
                      key={`${photo.id}:${offset}`}
                      onClick={() => setCoralViewMode("sheet")}
                      type="button"
                    >
                      <StoryImage alt={photo.title} source={photo.source} />
                    </button>
                  )
                })}
              </div>
            )}
          </main>
          <footer className={`${compact ? "px-4" : "px-5"} flex h-14 shrink-0 items-center justify-between gap-5 bg-white`}>
            <div className="flex items-center gap-5">
              <button
                aria-label="Open contact sheet"
                className={coralViewMode === "sheet" ? "opacity-100" : "opacity-45"}
                onClick={() => setCoralViewMode("sheet")}
                type="button"
              >
                <Grid3X3 className="size-4" />
              </button>
              <button
                aria-label="Open two-image viewer"
                className={coralViewMode === "viewer" ? "opacity-100" : "opacity-45"}
                disabled={coralPhotos.length === 0}
                onClick={() => setCoralViewMode("viewer")}
                type="button"
              >
                <Maximize2 className="size-4" />
              </button>
              <button
                aria-label="Previous photograph"
                disabled={coralPhotos.length === 0}
                onClick={() => {
                  setCoralViewMode("viewer")
                  setCoralPhotoIndex((current) => (current - 1 + Math.max(coralPhotos.length, 1)) % Math.max(coralPhotos.length, 1))
                }}
                type="button"
              >
                <ArrowLeft className="size-4" />
              </button>
              <button
                aria-label="Next photograph"
                disabled={coralPhotos.length === 0}
                onClick={() => {
                  setCoralViewMode("viewer")
                  setCoralPhotoIndex((current) => (current + 1) % Math.max(coralPhotos.length, 1))
                }}
                type="button"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
            <nav aria-label="Website links" className={`${compact ? "hidden" : "hidden sm:flex"} items-center gap-5 text-[10px] uppercase tracking-[0.12em]`}>
              {navItems.slice(0, 4).map((item) => (
                <button key={`${item.key}:${item.href}`} onClick={() => onNavigate(item.key, item.href)} type="button">{item.label}</button>
              ))}
            </nav>
          </footer>
        </div>
      ) : null}

      {isEditorial ? (
        <>
          <div className="relative">
            <div className={`absolute inset-x-0 top-0 z-20 flex items-start justify-between text-white ${compact ? "p-4" : "p-5 md:p-8"}`}>
              <p className={`max-w-[55%] truncate font-semibold uppercase tracking-[0.24em] ${compact ? "text-xs" : "text-sm md:text-base"}`}>{siteName}</p>
              <div className="absolute left-1/2 -translate-x-1/2">{isIndexOpen ? null : menuButton}</div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/75">
                {formatStoryIndex(normalizedStoryIndex)} / {formatStoryIndex(Math.max(storyCount - 1, 0))}
              </p>
            </div>
            {showHero ? (
              <>
                <StoryHero
                  activeStoryName={activeStory?.name ?? introHeadline}
                  accentColor={accentColor}
                  buttonHref={heroButtonHref}
                  buttonLabel={heroButtonLabel}
                  compact={compact}
                  editing={editing}
                  eyebrow={heroEyebrow}
                  headline={heroHeadline}
                  headlineStyle={heroHeadlineStyle}
                  imageFit={heroImageFit}
                  imagePosition={heroImagePosition}
                  layout={heroLayout}
                  mediaSource={activeHeroSource}
                  overlayStrength={heroOverlayStrength}
                  showBody={showHeroBody}
                  showButton={showHeroButton}
                  showEyebrow={showHeroEyebrow}
                  showHeadline={showHeroHeadline}
                  subhead={heroSubhead}
                  template={template}
                  textAlign={textAlign}
                  verticalAlignment={heroContentVerticalAlignment}
                  videoUrl={heroVideoUrl}
                />
                <button
                  aria-label="Previous story"
                  className="absolute left-4 top-1/2 z-20 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/65 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/45 disabled:opacity-35 md:left-8"
                  disabled={storyCount < 2}
                  onClick={() => moveStory(-1)}
                  type="button"
                >
                  <ArrowLeft aria-hidden="true" className="size-5" />
                </button>
                <button
                  aria-label="Next story"
                  className="absolute right-4 top-1/2 z-20 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/65 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/45 disabled:opacity-35 md:right-8"
                  disabled={storyCount < 2}
                  onClick={() => moveStory(1)}
                  type="button"
                >
                  <ArrowRight aria-hidden="true" className="size-5" />
                </button>
                <a
                  aria-label="Continue to story"
                  className="absolute bottom-5 left-1/2 z-20 inline-flex size-11 -translate-x-1/2 items-center justify-center rounded-full border border-white/70 bg-black/25 text-white backdrop-blur-sm"
                  href="#story-content"
                >
                  <ArrowDown aria-hidden="true" className="size-5" />
                </a>
              </>
            ) : null}
          </div>
          <section className={compact ? "px-5 py-8" : "px-6 py-10 md:px-10 md:py-14"} id="story-content">
            <div className="mx-auto max-w-[1320px]">
              <div className={`flex gap-7 border-b border-current/15 pb-9 ${compact ? "flex-col" : "flex-col md:flex-row md:items-start md:justify-between"}`}>
                <div>
                  <h1 className={`mt-3 max-w-5xl font-serif font-normal leading-[0.92] ${compact ? "text-5xl" : "text-5xl md:text-8xl"}`}>
                    {activeStory?.name ?? introHeadline}
                  </h1>
                </div>
                <div className="flex shrink-0 gap-4 pt-2 text-xs font-semibold uppercase tracking-[0.2em]">
                  <button className={viewMode === "grid" ? "opacity-100" : "opacity-45"} onClick={() => setViewMode("grid")} type="button">
                    Grid
                  </button>
                  <button className={viewMode === "single" ? "opacity-100" : "opacity-45"} onClick={() => setViewMode("single")} type="button">
                    Story
                  </button>
                </div>
              </div>
              <div className={`grid gap-7 py-8 text-base leading-7 ${compact ? "" : "md:grid-cols-2 md:text-lg md:leading-8"}`}>
                <p>{introBody}</p>
                <p className="opacity-62">{introHeadline}</p>
              </div>
              {viewMode === "grid" ? (
                <div className={`grid gap-3 pb-8 ${compact ? "grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                  {activePhotos.map((photo) => (
                    <Link className="group relative aspect-[4/3] overflow-hidden bg-black" href={activeStory?.href ?? "#"} key={photo.id}>
                      <StoryImage alt={photo.title} className="transition duration-500 group-hover:scale-[1.025]" source={photo.source} />
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        </>
      ) : null}

      {isCinematic ? (
        <div className={`min-h-screen bg-[#080808] text-[#f3f0e9] ${compact ? "p-3" : "p-3 md:p-7"}`}>
          <header className="flex items-center justify-between gap-4 px-2 pb-5">
            <p className={`max-w-[38%] truncate font-semibold uppercase tracking-[0.34em] ${compact ? "text-[10px]" : "text-sm"}`}>{siteName}</p>
            <div className="absolute left-1/2 -translate-x-1/2">{isIndexOpen ? null : menuButton}</div>
            <div className="flex items-center gap-2">
              <span className="mr-2 text-xs tabular-nums opacity-70">
                {formatStoryIndex(normalizedStoryIndex)} / {formatStoryIndex(Math.max(storyCount - 1, 0))}
              </span>
              <button aria-label="Previous chapter" className="inline-flex size-11 items-center justify-center border border-white/20" disabled={storyCount < 2} onClick={() => moveStory(-1)} type="button">
                <ArrowLeft aria-hidden="true" className="size-5" />
              </button>
              <button aria-label="Next chapter" className="inline-flex size-11 items-center justify-center border border-white/20" disabled={storyCount < 2} onClick={() => moveStory(1)} type="button">
                <ArrowRight aria-hidden="true" className="size-5" />
              </button>
            </div>
          </header>
          {showHero ? (
            <StoryHero
              activeStoryName={activeStory?.name ?? introHeadline}
              accentColor={accentColor}
              buttonHref={heroButtonHref}
              buttonLabel={heroButtonLabel}
              compact={compact}
              editing={editing}
              eyebrow={heroEyebrow}
              headline={heroHeadline}
              headlineStyle={heroHeadlineStyle}
              imageFit={heroImageFit}
              imagePosition={heroImagePosition}
              layout={heroLayout}
              mediaSource={activeHeroSource}
              overlayStrength={heroOverlayStrength}
              showBody={showHeroBody}
              showButton={showHeroButton}
              showEyebrow={showHeroEyebrow}
              showHeadline={showHeroHeadline}
              subhead={heroSubhead}
              template={template}
              textAlign={textAlign}
              verticalAlignment={heroContentVerticalAlignment}
              videoUrl={heroVideoUrl}
            />
          ) : null}
          <div className="flex items-center gap-5 border-x border-b border-white/12 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em]">
            <button className={`inline-flex items-center gap-2 ${viewMode === "single" ? "text-[#b88945]" : "text-white/55"}`} onClick={() => setViewMode("single")} type="button">
              <Rows3 aria-hidden="true" className="size-4" />
              Frame
            </button>
            <button className={`inline-flex items-center gap-2 ${viewMode === "grid" ? "text-[#b88945]" : "text-white/55"}`} onClick={() => setViewMode("grid")} type="button">
              <Grid3X3 aria-hidden="true" className="size-4" />
              Contact sheet
            </button>
          </div>
          {viewMode === "grid" ? (
            <div className="grid gap-2 border-x border-b border-white/12 p-3 sm:grid-cols-2 lg:grid-cols-4">
              {activePhotos.map((photo) => (
                <Link className="group relative aspect-[4/3] overflow-hidden bg-black" href={activeStory?.href ?? "#"} key={photo.id}>
                  <StoryImage alt={photo.title} className="transition duration-500 group-hover:scale-[1.025]" source={photo.source} />
                </Link>
              ))}
            </div>
          ) : (
            <div className={`grid gap-px border-x border-b border-white/12 bg-white/12 ${compact ? "" : "md:grid-cols-3"}`}>
              {stories.slice(0, 3).map((story, index) => (
                <button className="grid grid-cols-[92px_1fr] gap-4 bg-[#0d0d0d] p-4 text-left" key={story.id} onClick={() => chooseStory(index)} type="button">
                  <span className="relative aspect-[4/3] overflow-hidden bg-black">
                    <StoryImage alt="" source={story.cover} />
                  </span>
                  <span>
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-white/45">Chapter {formatStoryIndex(index)}</span>
                    <span className="mt-2 block text-sm uppercase tracking-[0.12em]">{story.name}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {!isEditorial && !isCinematic && !isEditorialRail && !isMasonryJournal && !isDarkFilmstrip && !isCoralPanorama ? (
        <>
          <header className={`flex items-center justify-between gap-4 border-b border-current/15 px-5 py-4 ${compact ? "" : "md:px-8"}`}>
            <p className={`max-w-[42%] truncate font-semibold uppercase tracking-[0.28em] ${compact ? "text-[10px]" : "text-sm"}`}>{siteName}</p>
            <div className="absolute left-1/2 -translate-x-1/2">{isIndexOpen ? null : menuButton}</div>
            <nav aria-label="Primary" className={`${compact ? "hidden" : "hidden sm:flex"} gap-5 text-xs uppercase tracking-[0.18em] opacity-65`}>
              {navItems.slice(0, 2).map((item) => (
                <button key={`${item.key}:${item.href}`} onClick={() => onNavigate(item.key, item.href)} type="button">{item.label}</button>
              ))}
            </nav>
          </header>
          {showHero ? (
            <StoryHero
              activeStoryName={activeStory?.name ?? introHeadline}
              accentColor={accentColor}
              buttonHref={heroButtonHref}
              buttonLabel={heroButtonLabel}
              compact={compact}
              editing={editing}
              eyebrow={heroEyebrow}
              headline={heroHeadline}
              headlineStyle={heroHeadlineStyle}
              imageFit={heroImageFit}
              imagePosition={heroImagePosition}
              layout={heroLayout}
              mediaSource={activeHeroSource}
              overlayStrength={heroOverlayStrength}
              showBody={showHeroBody}
              showButton={showHeroButton}
              showEyebrow={showHeroEyebrow}
              showHeadline={showHeroHeadline}
              subhead={heroSubhead}
              template={template}
              textAlign={textAlign}
              verticalAlignment={heroContentVerticalAlignment}
              videoUrl={heroVideoUrl}
            />
          ) : null}
          <section className={compact ? "px-5 py-6" : "px-7 py-8 md:px-12"}>
            <div className={`flex gap-6 ${compact ? "flex-col" : "items-center justify-between"}`}>
              <div className="flex items-center gap-5">
                <button aria-label="Previous story" className="inline-flex size-11 items-center justify-center rounded-full border border-current/25" disabled={storyCount < 2} onClick={() => moveStory(-1)} type="button">
                  <ArrowLeft aria-hidden="true" className="size-5" />
                </button>
                <span className="font-serif text-3xl tabular-nums">
                  <span style={{ color: accentColor }}>{formatStoryIndex(normalizedStoryIndex)}</span>
                  <span className="opacity-30">—</span>
                  {formatStoryIndex(Math.max(storyCount - 1, 0))}
                </span>
                <button aria-label="Next story" className="inline-flex size-11 items-center justify-center rounded-full border border-current/25" disabled={storyCount < 2} onClick={() => moveStory(1)} type="button">
                  <ArrowRight aria-hidden="true" className="size-5" />
                </button>
              </div>
              <div className="flex gap-5 text-xs font-semibold uppercase tracking-[0.18em]">
                <button className={viewMode === "grid" ? "opacity-100" : "opacity-42"} onClick={() => setViewMode("grid")} type="button">Grid</button>
                <button className={viewMode === "single" ? "opacity-100" : "opacity-42"} onClick={() => setViewMode("single")} type="button">Single</button>
              </div>
            </div>
            {viewMode === "grid" ? (
              <div className="mt-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {activePhotos.slice(0, 6).map((photo) => (
                  <Link className="group relative aspect-[4/3] overflow-hidden bg-black" href={activeStory?.href ?? "#"} key={photo.id}>
                    <StoryImage alt={photo.title} className="transition duration-500 group-hover:scale-[1.02]" source={photo.source} />
                  </Link>
                ))}
              </div>
            ) : null}
          </section>
          <nav aria-label="Project index" className="grid border-t border-current/15 sm:grid-cols-2 lg:grid-cols-4">
            {stories.slice(0, 4).map((story, index) => (
              <button
                className="border-b border-current/15 px-6 py-6 text-left text-xs font-semibold uppercase tracking-[0.2em] sm:border-r"
                key={story.id}
                onClick={() => chooseStory(index)}
                style={index === normalizedStoryIndex ? { color: accentColor } : undefined}
                type="button"
              >
                {story.name}
              </button>
            ))}
          </nav>
        </>
      ) : null}
    </div>
  )
}
