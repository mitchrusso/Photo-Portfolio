"use client"

import { ArrowLeft, ArrowRight, Grid3X3, Menu, Rows3 } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import type {
  StoryPortfolioItem,
  StoryPortfolioNavItem,
  StoryPortfolioPhoto,
} from "@/components/site/story-portfolio-experience"

export type InspiredPortfolioTemplate =
  | "acclaim-portfolio"
  | "atelier-split"
  | "commercial-casebook"
  | "kinetic-headline"
  | "object-stage"
  | "quiet-sequence"
  | "specimen-wall"
  | "studio-split"
  | "swiss-sequence"
  | "triptych-stage"

type InspiredPortfolioExperienceProps = {
  accentColor: string
  compact: boolean
  editing: boolean
  heroContentVerticalAlignment: "top" | "middle" | "bottom"
  heroEyebrow: string
  heroHeadline: string
  heroHeadlineScrollSlowdown: number
  heroHeadlineScrollDuration: number
  heroHeadlineStyle: CSSProperties
  heroMediaSource: string
  heroSubhead: string
  introBody: string
  navItems: StoryPortfolioNavItem[]
  onNavigate: (key: string, href: string) => void
  showHeroBody: boolean
  showHeroEyebrow: boolean
  showHeroHeadline: boolean
  siteName: string
  stories: StoryPortfolioItem[]
  template: InspiredPortfolioTemplate
  textAlign: "left" | "center" | "right"
}

function sequenceIndex(index: number) {
  return String(index + 1).padStart(2, "0")
}

function getStoryPhotos(story: StoryPortfolioItem | undefined): StoryPortfolioPhoto[] {
  if (!story) return []
  return story.photos.length > 0
    ? story.photos
    : [{ height: null, id: `${story.id}:cover`, source: story.cover, title: story.name, width: null }]
}

function CoverImage({
  alt,
  className = "",
  source,
}: {
  alt: string
  className?: string
  source: string
}) {
  return (
    <Image
      alt={alt}
      className={`object-contain ${className}`}
      fill
      sizes="100vw"
      src={source}
      unoptimized
    />
  )
}

function FullFrameStoryCover({ story }: { story: StoryPortfolioItem }) {
  const coverPhoto = getStoryPhotos(story).find((photo) => photo.source === story.cover)
    ?? getStoryPhotos(story)[0]
  const width = coverPhoto?.width && coverPhoto.width > 0 ? coverPhoto.width : 1600
  const height = coverPhoto?.height && coverPhoto.height > 0 ? coverPhoto.height : 1200

  return (
    <Image
      alt={story.name}
      className="h-auto w-full"
      height={height}
      sizes="(max-width: 767px) 100vw, 33vw"
      src={story.cover}
      unoptimized
      width={width}
    />
  )
}

function CompactNav({
  dark = false,
  navItems,
  onNavigate,
  siteName,
}: {
  dark?: boolean
  navItems: StoryPortfolioNavItem[]
  onNavigate: (key: string, href: string) => void
  siteName: string
}) {
  return (
    <header className={`flex items-center justify-between gap-5 border-b px-5 py-4 ${dark ? "border-white/15" : "border-current/15"}`}>
      <p className="truncate text-xs font-semibold uppercase tracking-[0.24em]">{siteName}</p>
      <nav aria-label="Website pages" className="flex items-center gap-4 text-[10px] uppercase tracking-[0.16em]">
        {navItems.slice(0, 3).map((item, index) => (
          <button className={index > 1 ? "hidden sm:inline" : ""} key={`${item.key}:${item.href}`} onClick={() => onNavigate(item.key, item.href)} type="button">
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  )
}

export function InspiredPortfolioExperience({
  accentColor,
  compact,
  editing,
  heroContentVerticalAlignment,
  heroEyebrow,
  heroHeadline,
  heroHeadlineScrollSlowdown,
  heroHeadlineScrollDuration,
  heroHeadlineStyle,
  heroMediaSource,
  heroSubhead,
  introBody,
  navItems,
  onNavigate,
  showHeroBody,
  showHeroEyebrow,
  showHeroHeadline,
  siteName,
  stories,
  template,
  textAlign,
}: InspiredPortfolioExperienceProps) {
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [kineticMetrics, setKineticMetrics] = useState({ distance: 0, duration: heroHeadlineScrollDuration, gap: 0 })
  const [showIndex, setShowIndex] = useState(false)
  const kineticContainerRef = useRef<HTMLDivElement>(null)
  const kineticHeadlineRef = useRef<HTMLSpanElement>(null)
  const storyCount = Math.max(stories.length, 1)
  const activeStory = stories[activeStoryIndex % storyCount]
  const activePhotos = getStoryPhotos(activeStory)
  const photoCount = Math.max(activePhotos.length, 1)
  const activePhoto = activePhotos[activePhotoIndex % photoCount]
  const allPhotos = useMemo(
    () => stories.flatMap((story) => getStoryPhotos(story).map((photo) => ({ photo, story }))),
    [stories],
  )
  const displayPhotos = allPhotos.length > 0
    ? allPhotos
    : activePhoto
      ? [{ photo: activePhoto, story: activeStory }]
      : []
  const heroSource = heroMediaSource || activePhoto?.source || activeStory?.cover || ""

  useEffect(() => {
    if (template !== "kinetic-headline") return

    const container = kineticContainerRef.current
    const headline = kineticHeadlineRef.current
    if (!container || !headline) return

    let active = true
    const updateMetrics = () => {
      const containerWidth = container.clientWidth
      const headlineWidth = headline.getBoundingClientRect().width
      if (!active || containerWidth <= 0 || headlineWidth <= 0) return

      const minimumGap = Math.min(96, Math.max(32, containerWidth * 0.06))
      const distance = Math.max(containerWidth, headlineWidth + minimumGap)
      const gap = Math.max(minimumGap, distance - headlineWidth)
      const duration = heroHeadlineScrollDuration * (distance / containerWidth)

      setKineticMetrics({ distance, duration, gap })
    }

    updateMetrics()
    if (typeof ResizeObserver === "undefined") return

    const resizeObserver = new ResizeObserver(updateMetrics)
    resizeObserver.observe(container)
    resizeObserver.observe(headline)
    void document.fonts?.ready?.then(updateMetrics)

    return () => {
      active = false
      resizeObserver.disconnect()
    }
  }, [activeStory?.name, heroHeadline, heroHeadlineScrollDuration, heroHeadlineStyle, template])

  const selectStory = (index: number) => {
    setActiveStoryIndex(index)
    setActivePhotoIndex(0)
  }
  const moveStory = (direction: -1 | 1) => {
    setActiveStoryIndex((current) => (current + direction + storyCount) % storyCount)
    setActivePhotoIndex(0)
  }
  const movePhoto = (direction: -1 | 1) => {
    setActivePhotoIndex((current) => (current + direction + photoCount) % photoCount)
  }

  if (template === "swiss-sequence") {
    return (
      <div className="min-h-screen bg-[#fbfbf8] text-[#111]" data-inspired-template="swiss-sequence">
        <CompactNav navItems={navItems} onNavigate={onNavigate} siteName={siteName} />
        <main className={`${compact ? "px-5 py-12" : "px-[4vw] py-[9vh]"}`}>
          <div className={`${compact ? "mb-16" : "mb-[22vh]"} flex items-start justify-between gap-8`}>
            <p className="max-w-md text-[10px] uppercase tracking-[0.24em]">{heroSubhead || "Selected photographic work"}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em]">{new Date().getFullYear()} — Portfolio</p>
          </div>
          <section className={`${compact ? "grid-cols-1 gap-10" : "grid-cols-12 gap-x-8 gap-y-28"} grid`}>
            {displayPhotos.slice(0, 9).map(({ photo, story }, index) => {
              const placement = index % 4 === 0
                ? "col-span-7"
                : index % 4 === 1
                  ? "col-span-4 col-start-9 mt-24"
                  : index % 4 === 2
                    ? "col-span-4 col-start-2"
                    : "col-span-6 col-start-7"
              return (
                <a className={compact ? "" : placement} href={story?.href || "#"} key={`${story?.id}:${photo.id}:${index}`}>
                  <div className={`relative bg-[#efefeb] ${index % 3 === 1 ? "aspect-[4/5]" : "aspect-[4/3]"}`}>
                    <CoverImage alt={photo.title} className="object-contain" source={photo.source} />
                  </div>
                  <div className="mt-3 flex justify-between text-[9px] uppercase tracking-[0.18em]">
                    <span>{story?.name}</span><span>{sequenceIndex(index)}</span>
                  </div>
                </a>
              )
            })}
          </section>
        </main>
      </div>
    )
  }

  if (template === "object-stage") {
    return (
      <div className="min-h-screen bg-[#f4f2ed] text-[#171717]" data-inspired-template="object-stage">
        <CompactNav navItems={navItems} onNavigate={onNavigate} siteName={siteName} />
        <main className={`${compact ? "px-5 py-10" : "px-[7vw] py-[10vh]"}`}>
          <p className="max-w-lg text-sm leading-6 opacity-65">{heroSubhead || introBody}</p>
          <div className={`${compact ? "mt-12 grid gap-9" : "relative mt-10 min-h-[165vh]"}`}>
            {displayPhotos.slice(0, 7).map(({ photo, story }, index) => {
              const positions = [
                "left-0 top-0 w-[55%]", "right-0 top-[14%] w-[34%]", "left-[18%] top-[38%] w-[38%]",
                "right-[8%] top-[55%] w-[46%]", "left-0 top-[72%] w-[31%]", "left-[38%] top-[88%] w-[43%]", "right-0 top-[112%] w-[28%]",
              ]
              return (
                <a className={compact ? "block" : `absolute ${positions[index]}`} href={story?.href || "#"} key={`${story?.id}:${photo.id}`}>
                  <div className={`relative bg-white shadow-[0_18px_60px_rgba(20,20,20,0.08)] ${index % 2 ? "aspect-[4/5]" : "aspect-[5/4]"}`}>
                    <CoverImage alt={photo.title} className="object-contain p-[2%]" source={photo.source} />
                  </div>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.18em]">{story?.name}</p>
                </a>
              )
            })}
          </div>
        </main>
      </div>
    )
  }

  if (template === "atelier-split") {
    const requestedHeadlineScale = Number(
      (heroHeadlineStyle as CSSProperties & { "--website-hero-headline-scale"?: number })["--website-hero-headline-scale"] ?? 1,
    )
    const atelierHeadlineScale = Math.min(1, Math.max(0.285, requestedHeadlineScale / 1.4))
    const atelierHeadlineStyle = {
      ...heroHeadlineStyle,
      fontSize: compact
        ? `clamp(${(3 * atelierHeadlineScale).toFixed(3)}rem, ${(11 * atelierHeadlineScale).toFixed(3)}vw, ${(5 * atelierHeadlineScale).toFixed(3)}rem)`
        : `clamp(${(3.5 * atelierHeadlineScale).toFixed(3)}rem, ${(6 * atelierHeadlineScale).toFixed(3)}vw, ${(7.5 * atelierHeadlineScale).toFixed(3)}rem)`,
    } as CSSProperties
    const atelierEyebrow = heroEyebrow.trim()
    const showAtelierEyebrow = showHeroEyebrow
      && atelierEyebrow.length > 0
      && atelierEyebrow.toLowerCase() !== "selected story"
    const atelierAlignmentClass = textAlign === "center"
      ? "items-center"
      : textAlign === "right"
        ? "items-end"
        : "items-start"
    const atelierVerticalClass = heroContentVerticalAlignment === "top"
      ? "justify-start"
      : heroContentVerticalAlignment === "bottom"
        ? "justify-end"
        : "justify-center"
    const atelierOpticalVerticalClass = heroContentVerticalAlignment === "middle"
      ? compact ? "translate-y-[0.6vh]" : "translate-y-[1.1vh]"
      : ""
    const atelierBuilderBottomInsetClass = editing
      && !compact
      && heroContentVerticalAlignment === "bottom"
        ? "-translate-y-8"
        : ""

    return (
      <div className="min-h-screen bg-[#efebe3] text-[#183c2e]" data-inspired-template="atelier-split">
        <header className={`${compact ? "grid-cols-2" : "grid-cols-5"} grid border-b border-[#183c2e]`}>
          {navItems.slice(0, compact ? 2 : 4).map((item) => (
            <button className="border-r border-[#183c2e] px-5 py-5 text-[10px] uppercase tracking-[0.24em]" key={item.key} onClick={() => onNavigate(item.key, item.href)} type="button">{item.label}</button>
          ))}
          {!compact ? <button className="px-5 py-5 text-[10px] uppercase tracking-[0.24em]" onClick={() => setShowIndex((value) => !value)} type="button">{showIndex ? "Close index" : "Projects"}</button> : null}
        </header>
        <main
          className={`${compact ? "grid-rows-[auto_1fr]" : "grid-cols-2"} grid ${
            editing && !compact
              ? "min-h-[calc(100vh-17rem)]"
              : "min-h-[calc(100vh-62px)]"
          }`}
        >
          <section
            className={`${compact ? "min-h-[38vh] px-8 py-12" : "px-[7vw] py-[13vh]"} ${atelierAlignmentClass} ${atelierVerticalClass} flex flex-col bg-[#183c2e] text-[#efebe3]`}
            style={{ textAlign }}
          >
            <div className={`${atelierOpticalVerticalClass} ${atelierBuilderBottomInsetClass} flex flex-col gap-7`}>
              {showAtelierEyebrow ? <p className="text-[10px] uppercase tracking-[0.34em]">{atelierEyebrow}</p> : null}
              {showHeroHeadline ? (
                <h1
                  className="break-words font-serif leading-[0.78] tracking-[-0.065em]"
                  style={atelierHeadlineStyle}
                >
                  {heroHeadline || siteName}
                </h1>
              ) : null}
              {showHeroBody ? <p className="max-w-sm text-sm leading-6 opacity-70">{heroSubhead || introBody}</p> : null}
            </div>
          </section>
          <section className={`${compact ? "p-6" : "p-[5vw]"} flex flex-col justify-center`}>
            {showIndex && !compact ? (
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {stories.slice(0, 8).map((story, index) => (
                  <button className="border-b border-[#183c2e]/30 py-4 text-left" key={story.id} onClick={() => { selectStory(index); setShowIndex(false) }} type="button">
                    <span className="text-[10px] tracking-[0.2em]">{sequenceIndex(index)}</span>
                    <span className="mt-2 block font-serif text-2xl">{story.name}</span>
                  </button>
                ))}
              </div>
            ) : activeStory ? (
              <>
                <a className="relative mx-auto aspect-[4/5] w-full max-w-md bg-[#ded8cb]" href={activeStory.href}>
                  <CoverImage alt={activeStory.name} source={activeStory.cover} />
                </a>
                <div className="mx-auto mt-5 flex w-full max-w-md items-end justify-between gap-5">
                  <div><p className="text-[10px] tracking-[0.25em]">{sequenceIndex(activeStoryIndex)} — {sequenceIndex(stories.length - 1)}</p><h2 className="mt-2 font-serif text-4xl">{activeStory.name}</h2></div>
                  <div className="flex gap-2"><button aria-label="Previous project" onClick={() => moveStory(-1)} type="button"><ArrowLeft /></button><button aria-label="Next project" onClick={() => moveStory(1)} type="button"><ArrowRight /></button></div>
                </div>
              </>
            ) : null}
          </section>
        </main>
      </div>
    )
  }

  if (template === "specimen-wall") {
    return (
      <div className="min-h-screen bg-white text-[#161616]" data-inspired-template="specimen-wall">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-5 text-[10px] uppercase tracking-[0.2em] opacity-45">
          <span className="min-w-0 truncate">{siteName}</span>
          <nav className={`flex min-w-0 ${compact ? "max-w-[48vw] gap-3" : "gap-5"}`}>
            {stories.slice(0, compact ? 2 : 5).map((story, index) => (
              <button className="min-w-0 truncate" key={story.id} onClick={() => selectStory(index)} type="button">{story.name}</button>
            ))}
          </nav>
        </header>
        <main className={`${compact ? "grid-cols-2 gap-5 p-5" : "grid-cols-4 gap-x-[5vw] gap-y-[12vh] p-[4vw]"} grid`}>
          {displayPhotos.slice(0, 16).map(({ photo, story }, index) => (
            <a className="group" href={story?.href || "#"} key={`${story?.id}:${photo.id}`}>
              <div className={`${index % 3 === 0 ? "aspect-square" : "aspect-[4/5]"} relative bg-[#fafafa]`}>
                <CoverImage alt={photo.title} className="object-contain p-[6%] transition duration-500 group-hover:scale-[1.035]" source={photo.source} />
              </div>
              <div className="mt-3 flex justify-between text-[9px] uppercase tracking-[0.16em] opacity-0 transition group-hover:opacity-55"><span>{story?.name}</span><span>{sequenceIndex(index)}</span></div>
            </a>
          ))}
        </main>
      </div>
    )
  }

  if (template === "quiet-sequence") {
    return (
      <div className={`${compact ? "" : "grid grid-cols-[minmax(280px,25%)_1fr]"} min-h-screen bg-white text-[#202020]`} data-inspired-template="quiet-sequence">
        <aside className={`${compact ? "flex items-center justify-between border-b p-5" : "flex h-screen min-w-0 flex-col p-8"} border-black/10`}>
          <h1 className="max-w-full text-xl font-light uppercase tracking-[0.18em] [overflow-wrap:anywhere]">{siteName}</h1>
          {!compact ? <nav className="mt-16 space-y-3 text-xs">{stories.slice(0, 9).map((story, index) => <button className="block" key={story.id} onClick={() => selectStory(index)} type="button">{story.name}</button>)}</nav> : null}
          <button className={`${compact ? "" : "mt-auto"} inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em]`} onClick={() => setShowIndex((value) => !value)} type="button">{showIndex ? <Rows3 className="size-4" /> : <Grid3X3 className="size-4" />}{showIndex ? "Sequence" : "Thumbnails"}</button>
        </aside>
        <main className="flex min-h-screen flex-col p-5 md:p-10">
          {showIndex ? (
            <div className={`${compact ? "grid-cols-2" : "grid-cols-4"} grid gap-3`}>
              {activePhotos.map((photo, index) => <button className="relative aspect-[4/3] bg-[#f5f5f3]" key={photo.id} onClick={() => { setActivePhotoIndex(index); setShowIndex(false) }} type="button"><CoverImage alt={photo.title} className="object-contain" source={photo.source} /></button>)}
            </div>
          ) : activePhoto ? (
            <div className="relative min-h-[65vh] flex-1 bg-[#fafafa]"><CoverImage alt={activePhoto.title} className="object-contain" source={activePhoto.source} /></div>
          ) : null}
          <div className="flex items-center justify-between gap-4 pt-5 text-[10px] uppercase tracking-[0.16em]">
            <button aria-label="Previous photograph" onClick={() => movePhoto(-1)} type="button">Prev</button>
            <span>{activeStory?.name} · {sequenceIndex(activePhotoIndex)} / {sequenceIndex(activePhotos.length - 1)}</span>
            <button aria-label="Next photograph" onClick={() => movePhoto(1)} type="button">Next</button>
          </div>
        </main>
      </div>
    )
  }

  if (template === "kinetic-headline") {
    const marquee = heroHeadline || activeStory?.name || "Photography in motion"
    const kineticVerticalStyle = heroContentVerticalAlignment === "top"
      ? { top: "28%" }
      : heroContentVerticalAlignment === "bottom"
        ? { bottom: "8%" }
        : { top: "58%", transform: "translateY(-50%)" }
    const slowdownStrength = Math.min(1, Math.max(0, heroHeadlineScrollSlowdown / 100))
    const centerTravel = 0.3 - (0.28 * slowdownStrength)
    const slowStart = 0.5 - (centerTravel / 2)
    const slowEnd = 0.5 + (centerTravel / 2)
    const kineticHeadlineStyle = {
      ...heroHeadlineStyle,
      "--kinetic-marquee-distance": `${kineticMetrics.distance}px`,
      "--kinetic-slow-end-distance": `${kineticMetrics.distance * slowEnd}px`,
      "--kinetic-slow-start-distance": `${kineticMetrics.distance * slowStart}px`,
      animationDuration: `${kineticMetrics.duration}s`,
      color: accentColor,
      fontSize: "clamp(calc(4.5rem * var(--website-hero-headline-scale, 1)), calc(12vw * var(--website-hero-headline-scale, 1)), calc(12rem * var(--website-hero-headline-scale, 1)))",
      gap: `${kineticMetrics.gap}px`,
      opacity: kineticMetrics.distance > 0 ? 1 : 0,
      wordSpacing: "0.22em",
    } as CSSProperties
    return (
      <div className="min-h-screen bg-[#101821] text-white" data-inspired-template="kinetic-headline">
        <div className="relative min-h-screen overflow-hidden">
          {heroSource ? <CoverImage alt={marquee} className="opacity-62" source={heroSource} /> : null}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/70" />
          <CompactNav dark navItems={navItems} onNavigate={onNavigate} siteName={siteName} />
          {showHeroHeadline ? <div aria-label={marquee} className="absolute inset-x-0 overflow-hidden" ref={kineticContainerRef} style={kineticVerticalStyle}>
            <div className="photoview-kinetic-marquee flex w-max whitespace-nowrap font-black uppercase leading-none tracking-[-0.025em]" style={kineticHeadlineStyle}>
              <span ref={kineticHeadlineRef}>{marquee}</span>
              <span aria-hidden="true">{marquee}</span>
            </div>
          </div> : null}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-8 p-6 md:p-10">
            {showHeroBody ? <p className="max-w-sm text-base leading-7">{heroSubhead || introBody}</p> : <span />}
            <div className="flex gap-3"><button aria-label="Previous project" className="border border-white/40 p-3" onClick={() => moveStory(-1)} type="button"><ArrowLeft /></button><button aria-label="Next project" className="border border-white/40 p-3" onClick={() => moveStory(1)} type="button"><ArrowRight /></button></div>
          </div>
        </div>
      </div>
    )
  }

  if (template === "commercial-casebook") {
    return (
      <div className="min-h-screen" data-inspired-template="commercial-casebook">
        <CompactNav navItems={navItems} onNavigate={onNavigate} siteName={siteName} />
        <main className="px-5 py-9 md:px-8 md:py-12">
          <p className={`${compact ? "text-2xl" : "max-w-3xl text-4xl"} leading-tight`}>{heroSubhead || introBody || "Photography and image-led stories for people, places, and brands."}</p>
          <div className="mt-14 grid grid-cols-1 items-start gap-x-10 gap-y-12 md:grid-cols-3">
            {stories.slice(0, 9).map((story) => (
              <a href={story.href} key={story.id}>
                <FullFrameStoryCover story={story} />
                <h3 className="mt-3 font-serif text-2xl">{story.name}</h3>
                <p className="mt-1 text-xs opacity-55">Photography · {story.imageCount} images</p>
              </a>
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (template === "studio-split") {
    const studioHeadlineStyle = {
      ...heroHeadlineStyle,
      color: accentColor,
      wordSpacing: "0.12em",
      fontSize: compact
        ? "clamp(calc(3rem * var(--website-hero-headline-scale, 1)), calc(11vw * var(--website-hero-headline-scale, 1)), calc(5rem * var(--website-hero-headline-scale, 1)))"
        : "clamp(calc(4rem * var(--website-hero-headline-scale, 1)), calc(8vw * var(--website-hero-headline-scale, 1)), calc(9rem * var(--website-hero-headline-scale, 1)))",
    } as CSSProperties
    const studioVerticalClass = heroContentVerticalAlignment === "top"
      ? "justify-start"
      : heroContentVerticalAlignment === "bottom"
        ? "justify-end"
        : "justify-center"
    const studioHorizontalClass = textAlign === "center"
      ? "items-center text-center"
      : textAlign === "right"
        ? "items-end text-right"
        : "items-start text-left"
    return (
      <div className={`${compact ? "" : "grid grid-cols-[36%_64%]"} min-h-screen bg-[#111] text-white`} data-inspired-template="studio-split">
        <aside className={`${compact ? "min-h-[34vh] p-6" : "h-screen justify-between p-[4vw]"} flex flex-col bg-[#111]`}>
          <div className="flex items-center justify-between">
            <Menu className="size-5" />
            {showHeroEyebrow && heroEyebrow.trim() ? <span className="text-[10px] uppercase tracking-[0.18em]">{heroEyebrow}</span> : null}
          </div>
          <div className={`${studioHorizontalClass} ${studioVerticalClass} flex flex-1 flex-col`}>
            {showHeroHeadline ? (
              <p
                className={`${compact ? "mt-16" : ""} font-light uppercase leading-[0.98] tracking-[-0.025em]`}
                style={studioHeadlineStyle}
              >
                {heroHeadline || siteName}
              </p>
            ) : null}
            {showHeroBody ? <p className="mt-6 max-w-xs text-sm leading-6 text-white/55">{heroSubhead || introBody}</p> : null}
          </div>
          {!compact ? <nav className="flex gap-5 text-[10px] uppercase tracking-[0.16em]">{navItems.slice(0, 3).map((item) => <button key={item.key} onClick={() => onNavigate(item.key, item.href)} type="button">{item.label}</button>)}</nav> : null}
        </aside>
        <main className={`${compact ? "min-h-[64vh] p-3" : "h-screen py-5 pr-5"} bg-[#111]`}>
          <div className="relative size-full overflow-hidden rounded-[2rem] bg-black">
            {heroSource ? <CoverImage alt={activeStory?.name || siteName} className="object-contain" source={heroSource} /> : null}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-7">
              <div><p className="text-[10px] uppercase tracking-[0.22em]">{sequenceIndex(activeStoryIndex)}</p><h2 className="mt-2 text-3xl">{activeStory?.name}</h2></div>
              <div className="flex gap-2"><button aria-label="Previous project" onClick={() => moveStory(-1)} type="button"><ArrowLeft /></button><button aria-label="Next project" onClick={() => moveStory(1)} type="button"><ArrowRight /></button></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (template === "triptych-stage") {
    const triptych = Array.from({ length: 3 }, (_, index) => displayPhotos[(activePhotoIndex + index) % Math.max(displayPhotos.length, 1)])
    return (
      <div className="min-h-screen bg-black text-white" data-inspired-template="triptych-stage">
        <CompactNav dark navItems={navItems} onNavigate={onNavigate} siteName={siteName} />
        <main className={`${compact ? "h-[64vh] min-h-[440px] max-h-[620px] grid-cols-1" : "h-[calc(100svh-61px)] grid-cols-3"} grid gap-px bg-white/10`}>
          {triptych.map((entry, index) => entry ? (
            <a className={`${compact && index > 0 ? "hidden" : ""} relative overflow-hidden bg-black`} href={entry.story?.href || "#"} key={`${entry.photo.id}:${index}`}>
              <CoverImage alt={entry.photo.title} className="object-center" source={entry.photo.source} />
            </a>
          ) : <div key={index} />)}
        </main>
        <button aria-label="Previous triptych" className="fixed left-4 top-1/2 z-20 rounded-full bg-black/50 p-3" onClick={() => setActivePhotoIndex((value) => (value - 1 + Math.max(displayPhotos.length, 1)) % Math.max(displayPhotos.length, 1))} type="button"><ArrowLeft /></button>
        <button aria-label="Next triptych" className="fixed right-4 top-1/2 z-20 rounded-full bg-black/50 p-3" onClick={() => setActivePhotoIndex((value) => (value + 1) % Math.max(displayPhotos.length, 1))} type="button"><ArrowRight /></button>
      </div>
    )
  }

  return (
    <div className={`${compact ? "" : "grid grid-cols-[minmax(290px,26%)_1fr]"} min-h-screen bg-white text-[#222]`} data-inspired-template="acclaim-portfolio">
      <aside className={`${compact ? "flex items-center justify-between border-b p-5" : "flex h-screen min-w-0 flex-col border-r p-8"} border-black/10`}>
        <h1 className="max-w-full text-2xl font-light uppercase tracking-[0.12em] [overflow-wrap:anywhere]">{siteName}</h1>
        {!compact ? <nav className="mt-16 space-y-3 text-xs uppercase">{stories.slice(0, 7).map((story, index) => <button className="block" key={story.id} onClick={() => selectStory(index)} type="button">{story.name}</button>)}</nav> : null}
        {!compact ? <div className="mt-auto text-[10px] uppercase tracking-[0.16em] opacity-55">Recognition · Contact</div> : null}
      </aside>
      <main className="flex min-h-screen flex-col p-5 md:p-10">
        <p className="text-center text-sm italic">{heroSubhead || "Photographs that feel honest, precise, and human."}</p>
        {activePhoto ? <div className="relative mx-auto mt-7 min-h-[58vh] w-full max-w-4xl flex-1 bg-[#fafafa]"><CoverImage alt={activePhoto.title} className="object-contain" source={activePhoto.source} /></div> : null}
        <div className={`${compact ? "grid-cols-1" : "grid-cols-3"} mt-6 grid border-t border-black/15 text-center text-xs`}>
          {["Selected photographer", "Published internationally", "Awarded portfolio"].map((claim, index) => <div className="border-b border-black/15 px-4 py-4 md:border-r" key={claim}><strong className="block text-sm">{claim}</strong><span className="mt-1 block opacity-50">Recognition {sequenceIndex(index)}</span></div>)}
        </div>
        <div className="mt-5 flex justify-center gap-8"><button aria-label="Previous project" onClick={() => moveStory(-1)} type="button"><ArrowLeft /></button><span className="text-xs uppercase tracking-[0.16em]">{activeStory?.name}</span><button aria-label="Next project" onClick={() => moveStory(1)} type="button"><ArrowRight /></button></div>
      </main>
    </div>
  )
}
