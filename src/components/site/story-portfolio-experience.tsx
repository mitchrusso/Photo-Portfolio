"use client"

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Grid3X3,
  Menu,
  Rows3,
  X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, type CSSProperties } from "react"

export type StoryPortfolioTemplate = "editorial-story" | "cinematic-chapters" | "museum-index"

export type StoryPortfolioItem = {
  cover: string
  href: string
  id: string
  imageCount: number
  name: string
  photos: Array<{
    id: string
    source: string
    title: string
  }>
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
  heroEyebrow: string
  heroHeadline: string
  heroHeadlineStyle: CSSProperties
  heroImageFit: "contain" | "cover"
  heroImagePosition: "left" | "center" | "right"
  heroLayout: "overlay" | "split" | "stacked"
  heroMediaSource: string
  heroOverlayStrength: number
  heroSubhead: string
  heroVideoUrl: string
  introBody: string
  introHeadline: string
  navItems: StoryPortfolioNavItem[]
  onNavigate: (key: string, href: string) => void
  showHero: boolean
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
      className={`object-cover ${className}`}
      fill
      priority={priority}
      sizes="100vw"
      src={source}
      unoptimized
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
}) {
  const isOverlay = layout === "overlay"
  const isStacked = layout === "stacked"
  const isCinematic = template === "cinematic-chapters"
  const textPanel = (
    <div
      className={`relative z-10 ${isOverlay ? "max-w-4xl text-white" : ""} ${
        compact ? "p-5" : isOverlay ? "p-7 md:p-10" : "p-7 md:p-12"
      }`}
      style={{ textAlign }}
    >
      {showEyebrow ? (
        <p
          className={`text-xs font-semibold uppercase tracking-[0.24em] ${isOverlay ? "text-white/75" : ""}`}
          style={isOverlay ? undefined : { color: accentColor }}
        >
          {eyebrow || "Selected story"}
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
            className={`absolute inset-x-0 bottom-0 ${compact ? "px-4" : "px-8"}`}
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
  heroEyebrow,
  heroHeadline,
  heroHeadlineStyle,
  heroImageFit,
  heroImagePosition,
  heroLayout,
  heroMediaSource,
  heroOverlayStrength,
  heroSubhead,
  heroVideoUrl,
  introBody,
  introHeadline,
  navItems,
  onNavigate,
  showHero,
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
  const [isIndexOpen, setIsIndexOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"single" | "grid">("single")
  const storyCount = stories.length
  const normalizedStoryIndex = storyCount > 0 ? activeStoryIndex % storyCount : 0
  const activeStory = stories[normalizedStoryIndex]
  const activePhotos = activeStory?.photos.length ? activeStory.photos : activeStory
    ? [{ id: `${activeStory.id}:cover`, source: activeStory.cover, title: activeStory.name }]
    : []
  const activeImage = activePhotos[0]
  const activeHeroSource = heroMediaSource || activeImage?.source || activeStory?.cover || ""
  const isEditorial = template === "editorial-story"
  const isCinematic = template === "cinematic-chapters"

  const moveStory = (direction: -1 | 1) => {
    if (storyCount < 2) return
    setActiveStoryIndex((current) => (current + direction + storyCount) % storyCount)
  }

  const chooseStory = (index: number) => {
    setActiveStoryIndex(index)
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
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: accentColor }}>
                    Selected story
                  </p>
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

      {!isEditorial && !isCinematic ? (
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
