import { Film, Maximize2, Play, ShieldCheck } from "lucide-react"
import Image from "next/image"

const videoShowcaseThumbnails = [
  { alt: "Myanmar temple photograph", src: "/marketing-preview/myanmar-temple.png", type: "Photo" },
  { alt: "Night landscape video poster", src: "/marketing-preview/loften-aurora.png", type: "Video" },
  { alt: "Egypt Sphinx photograph", src: "/marketing-preview/egypt-sphinx.png", type: "Photo" },
  { alt: "Panoramic landscape photograph", src: "/marketing-preview/sunset-panorama.png", type: "Photo" },
] as const

export function HomeVideoShowcase() {
  return (
    <section
      className="mt-10 overflow-hidden rounded-md border border-[#d8c79f] bg-[#fffdf8] shadow-[0_18px_46px_rgba(80,65,45,0.09)]"
      data-testid="homepage-video-showcase"
    >
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <div className="flex flex-col justify-center p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9c6f1d]">Photography in motion</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight md:text-4xl">
            Your work doesn&apos;t stop when the picture moves.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#5f594f] md:text-lg">
            Combine photographs and video in the same curated portfolio. PhotoView.io creates a poster image, provides a clean full-screen player, preserves the original file, and presents everything as one cohesive body of work.
          </p>
          <div className="mt-6 grid gap-3 text-sm text-[#4f4a42] sm:grid-cols-2">
            {[
              "MP4 and MOV support",
              "Photos and video together",
              "Full-screen mobile playback",
              "No ads or suggested videos",
            ].map((item) => (
              <div className="flex items-center gap-2" key={item}>
                <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-[#b58835]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#d8c79f] bg-[#11130f] p-4 text-white lg:border-l lg:border-t-0 md:p-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs text-white/55">
            <span className="flex items-center gap-2">
              <Film aria-hidden="true" className="size-4 text-[#d8a84f]" />
              Mixed-media portfolio
            </span>
            <span className="flex items-center gap-1.5">
              <Maximize2 aria-hidden="true" className="size-3.5" />
              Full screen
            </span>
          </div>

          <div className="relative mt-4 aspect-video overflow-hidden rounded-sm border border-[#d8a84f]/40 bg-black">
            <Image
              alt="Video poster inside a PhotoView.io portfolio"
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              src="/marketing-preview/loften-aurora.png"
            />
            <div className="absolute inset-0 bg-black/16" />
            <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
              Video
            </span>
            <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/65 bg-black/65 shadow-xl backdrop-blur-sm" aria-hidden="true">
              <Play className="ml-1 size-7 fill-white text-white" />
            </span>
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/90 to-transparent px-4 pb-3 pt-8" aria-hidden="true">
              <Play className="size-4 fill-white" />
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/35">
                <span className="block h-full w-1/3 rounded-full bg-[#d8a84f]" />
              </span>
              <span className="text-[11px] text-white/75">0:18 / 0:54</span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2" aria-label="Portfolio containing photographs and video">
            {videoShowcaseThumbnails.map((item) => (
              <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-white/10 bg-black" key={`${item.type}-${item.src}`}>
                <Image alt={item.alt} className="object-cover" fill sizes="140px" src={item.src} />
                {item.type === "Video" ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/18" aria-label="Video thumbnail">
                    <span className="flex size-7 items-center justify-center rounded-full bg-black/70">
                      <Play aria-hidden="true" className="ml-0.5 size-3.5 fill-white" />
                    </span>
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
