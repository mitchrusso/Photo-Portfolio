"use client"

import { ArrowLeft, ArrowRight, Grid3X3, Menu, Rows3 } from "lucide-react"
import Image from "next/image"
import { useMemo, useState } from "react"
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
  heroHeadline: string
  heroMediaSource: string
  heroSubhead: string
  introBody: string
  navItems: StoryPortfolioNavItem[]
  onNavigate: (key: string, href: string) => void
  siteName: string
  stories: StoryPortfolioItem[]
  template: InspiredPortfolioTemplate
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
      className={`object-cover ${className}`}
      fill
      sizes="100vw"
      src={source}
      unoptimized
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
  heroHeadline,
  heroMediaSource,
  heroSubhead,
  introBody,
  navItems,
  onNavigate,
  siteName,
  stories,
  template,
}: InspiredPortfolioExperienceProps) {
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [showIndex, setShowIndex] = useState(false)
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
    return (
      <div className="min-h-screen bg-[#efebe3] text-[#183c2e]" data-inspired-template="atelier-split">
        <header className={`${compact ? "grid-cols-2" : "grid-cols-5"} grid border-b border-[#183c2e]`}>
          {navItems.slice(0, compact ? 2 : 4).map((item) => (
            <button className="border-r border-[#183c2e] px-5 py-5 text-[10px] uppercase tracking-[0.24em]" key={item.key} onClick={() => onNavigate(item.key, item.href)} type="button">{item.label}</button>
          ))}
          {!compact ? <button className="px-5 py-5 text-[10px] uppercase tracking-[0.24em]" onClick={() => setShowIndex((value) => !value)} type="button">{showIndex ? "Close index" : "Projects"}</button> : null}
        </header>
        <main className={`${compact ? "grid-rows-[auto_1fr]" : "grid-cols-2"} grid min-h-[calc(100vh-62px)]`}>
          <section className={`${compact ? "min-h-[38vh] px-8 py-12" : "px-[7vw] py-[13vh]"} flex flex-col justify-between bg-[#183c2e] text-[#efebe3]`}>
            <p className="text-[10px] uppercase tracking-[0.34em]">The studio of</p>
            <h1 className={`${compact ? "text-5xl" : "text-[clamp(3.5rem,6vw,7.5rem)]"} break-words font-serif leading-[0.78] tracking-[-0.065em]`}>{siteName}</h1>
            <p className="max-w-sm text-sm leading-6 opacity-70">{heroSubhead || introBody}</p>
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
        <header className="flex items-center justify-between px-6 py-5 text-[10px] uppercase tracking-[0.2em] opacity-45">
          <span>{siteName}</span>
          <nav className="flex gap-5">{stories.slice(0, 5).map((story, index) => <button key={story.id} onClick={() => selectStory(index)} type="button">{story.name}</button>)}</nav>
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
      <div className={`${compact ? "" : "grid grid-cols-[240px_1fr]"} min-h-screen bg-white text-[#202020]`} data-inspired-template="quiet-sequence">
        <aside className={`${compact ? "flex items-center justify-between border-b p-5" : "flex h-screen flex-col p-10"} border-black/10`}>
          <h1 className="text-xl font-light uppercase tracking-[0.18em]">{siteName}</h1>
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
    return (
      <div className="min-h-screen bg-[#101821] text-white" data-inspired-template="kinetic-headline">
        <div className="relative min-h-screen overflow-hidden">
          {heroSource ? <CoverImage alt={marquee} className="opacity-62" source={heroSource} /> : null}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/70" />
          <CompactNav dark navItems={navItems} onNavigate={onNavigate} siteName={siteName} />
          <div aria-label={marquee} className="absolute inset-x-0 top-[42%] overflow-hidden">
            <div className="photoview-kinetic-marquee flex w-max whitespace-nowrap text-[clamp(4.5rem,12vw,12rem)] font-black uppercase leading-none tracking-[-0.065em]" style={{ color: accentColor }}>
              <span className="pr-[0.4em]">{marquee}</span><span aria-hidden="true" className="pr-[0.4em]">{marquee}</span>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-8 p-6 md:p-10">
            <p className="max-w-sm text-base leading-7">{heroSubhead || introBody}</p>
            <div className="flex gap-3"><button aria-label="Previous project" className="border border-white/40 p-3" onClick={() => moveStory(-1)} type="button"><ArrowLeft /></button><button aria-label="Next project" className="border border-white/40 p-3" onClick={() => moveStory(1)} type="button"><ArrowRight /></button></div>
          </div>
        </div>
      </div>
    )
  }

  if (template === "commercial-casebook") {
    return (
      <div className="min-h-screen bg-[#f3f3f0] text-[#171717]" data-inspired-template="commercial-casebook">
        <CompactNav navItems={navItems} onNavigate={onNavigate} siteName={siteName} />
        <main className="px-5 py-9 md:px-8 md:py-12">
          <p className={`${compact ? "text-2xl" : "max-w-3xl text-4xl"} leading-tight`}>{heroSubhead || introBody || "Photography and image-led stories for people, places, and brands."}</p>
          <h2 className="mt-14 border-b border-black pb-4 text-xl font-bold">Featured projects</h2>
          <div className={`${compact ? "grid-cols-1" : "grid-cols-3"} mt-7 grid items-start gap-x-10 gap-y-12`}>
            {stories.slice(0, 9).map((story, index) => (
              <a className={index % 5 === 2 && !compact ? "row-span-2" : ""} href={story.href} key={story.id}>
                <div className={`relative bg-[#ddd] ${index % 5 === 2 ? "aspect-[3/4]" : "aspect-[4/3]"}`}><CoverImage alt={story.name} source={story.cover} /></div>
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
    return (
      <div className={`${compact ? "" : "grid grid-cols-[36%_64%]"} min-h-screen bg-[#111] text-white`} data-inspired-template="studio-split">
        <aside className={`${compact ? "min-h-[34vh] p-6" : "flex h-screen flex-col justify-between p-[4vw]"} bg-[#111]`}>
          <div className="flex items-center justify-between"><Menu className="size-5" /><span className="text-[10px] uppercase tracking-[0.18em]">Portfolio</span></div>
          <div><p className={`${compact ? "mt-16 text-5xl" : "text-[clamp(4rem,8vw,9rem)]"} font-light uppercase leading-[0.8] tracking-[-0.06em]`}>{siteName}</p><p className="mt-6 max-w-xs text-sm leading-6 text-white/55">{heroSubhead || introBody}</p></div>
          {!compact ? <nav className="flex gap-5 text-[10px] uppercase tracking-[0.16em]">{navItems.slice(0, 3).map((item) => <button key={item.key} onClick={() => onNavigate(item.key, item.href)} type="button">{item.label}</button>)}</nav> : null}
        </aside>
        <main className={`${compact ? "min-h-[64vh] p-3" : "h-screen py-5 pr-5"} bg-[#111]`}>
          <div className="relative size-full overflow-hidden rounded-[2rem] bg-[#222]">
            {heroSource ? <CoverImage alt={activeStory?.name || siteName} source={heroSource} /> : null}
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
        <main className={`${compact ? "grid-cols-1" : "grid-cols-3"} grid h-[calc(100svh-61px)] gap-px bg-white/10`}>
          {triptych.map((entry, index) => entry ? (
            <a className={`${compact && index > 0 ? "hidden" : ""} group relative overflow-hidden bg-black`} href={entry.story?.href || "#"} key={`${entry.photo.id}:${index}`}>
              <CoverImage alt={entry.photo.title} className="grayscale transition duration-700 group-hover:grayscale-0" source={entry.photo.source} />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-5 pt-16 text-xs uppercase tracking-[0.18em] opacity-0 transition group-hover:opacity-100">{entry.story?.name}</span>
            </a>
          ) : <div key={index} />)}
        </main>
        <button aria-label="Previous triptych" className="fixed left-4 top-1/2 z-20 rounded-full bg-black/50 p-3" onClick={() => setActivePhotoIndex((value) => (value - 1 + Math.max(displayPhotos.length, 1)) % Math.max(displayPhotos.length, 1))} type="button"><ArrowLeft /></button>
        <button aria-label="Next triptych" className="fixed right-4 top-1/2 z-20 rounded-full bg-black/50 p-3" onClick={() => setActivePhotoIndex((value) => (value + 1) % Math.max(displayPhotos.length, 1))} type="button"><ArrowRight /></button>
      </div>
    )
  }

  return (
    <div className={`${compact ? "" : "grid grid-cols-[250px_1fr]"} min-h-screen bg-white text-[#222]`} data-inspired-template="acclaim-portfolio">
      <aside className={`${compact ? "flex items-center justify-between border-b p-5" : "flex h-screen flex-col border-r p-10"} border-black/10`}>
        <h1 className="text-2xl font-light uppercase tracking-[0.12em]">{siteName}</h1>
        {!compact ? <nav className="mt-16 space-y-3 text-xs uppercase">{stories.slice(0, 7).map((story, index) => <button className="block" key={story.id} onClick={() => selectStory(index)} type="button">{story.name}</button>)}</nav> : null}
        {!compact ? <div className="mt-auto text-[10px] uppercase tracking-[0.16em] opacity-55">Selected work · Recognition · Contact</div> : null}
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
