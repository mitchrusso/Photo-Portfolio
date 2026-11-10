import { ExternalLink, Radio } from "lucide-react"

const F64_FEATURE_URL = "https://www.youtube.com/watch?v=E9KcX6vF2-g"

type ThirdPartyValidationStripProps = {
  placement: "hero" | "pricing"
}

export function ThirdPartyValidationStrip({ placement }: ThirdPartyValidationStripProps) {
  const isHero = placement === "hero"

  return (
    <aside
      aria-label="Independent PhotoView feature"
      className={isHero ? "border-b border-[#d7e2dc] bg-white px-6 py-4 md:px-10" : "border-t border-[#d7e2dc] bg-[#f5f3fa] px-6 py-8 md:px-10"}
      data-testid={`third-party-validation-${placement}`}
      id={`third-party-validation-${placement}`}
    >
      <a
        className={`group flex flex-col gap-3 rounded-md border border-[#d8c28f] bg-[#fffaf0] px-5 py-4 text-[#1f211e] transition-colors hover:bg-[#fff5dc] sm:flex-row sm:items-center sm:justify-between ${
          isHero ? "mx-auto max-w-7xl" : "mx-auto max-w-6xl"
        }`}
        href={F64_FEATURE_URL}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="flex min-w-0 items-start gap-3 sm:items-center">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#17241d] text-[#ffd86a]">
            <Radio aria-hidden="true" className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold uppercase tracking-[0.16em] text-[#76500b]">
              Featured by f.64 Academy · October 2026
            </span>
            <span className="mt-1 block text-base font-semibold sm:text-lg">
              “A new way to share photos!”
            </span>
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#59400f] underline decoration-[#d8a84f] underline-offset-4">
          Watch the conversation and walkthrough
          <ExternalLink aria-hidden="true" className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </a>
    </aside>
  )
}
