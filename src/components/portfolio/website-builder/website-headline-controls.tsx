"use client"

import {
  MAX_WEBSITE_HERO_HEADLINE_SIZE,
  MAX_WEBSITE_HERO_SCROLL_SLOWDOWN,
  MAX_WEBSITE_HERO_SCROLL_SPEED,
  MIN_WEBSITE_HERO_HEADLINE_SIZE,
  MIN_WEBSITE_HERO_SCROLL_SLOWDOWN,
  MIN_WEBSITE_HERO_SCROLL_SPEED,
} from "@/lib/website-hero-typography"
import type {
  WebsiteHeadlineAlignment,
  WebsiteTemplate,
} from "@/lib/website-builder-rules"
import {
  websiteFontOptions,
  type WebsiteFontStyle,
} from "@/components/portfolio/website-builder/website-template-controls"

type WebsiteHeroVerticalAlignment = "top" | "middle" | "bottom"

type WebsiteHeadlineControlsProps = {
  accentColor: string
  alignment: WebsiteHeadlineAlignment
  fieldClass: string
  headline: string
  heroHeadlineScrollSlowdown: number
  heroHeadlineScrollSpeed: number
  heroHeadlineSize: number
  heroVerticalAlignment: WebsiteHeroVerticalAlignment
  isDark: boolean
  isHero: boolean
  isStoryPortfolio: boolean
  mutedTextClass: string
  onSetAccentColor: (accentColor: string) => void
  onSetAlignment: (alignment: WebsiteHeadlineAlignment) => void
  onSetFontStyle: (fontStyle: WebsiteFontStyle) => void
  onSetHeroHeadlineSize: (heroHeadlineSize: number) => void
  onSetHeroScrollSlowdown: (heroHeadlineScrollSlowdown: number) => void
  onSetHeroScrollSpeed: (heroHeadlineScrollSpeed: number) => void
  onSetHeroVerticalAlignment: (alignment: WebsiteHeroVerticalAlignment) => void
  onSetShowHeadline: (showHeadline: boolean) => void
  onUpdateHeadline: (headline: string) => void
  sectionLabel: string
  showHeadline: boolean
  siteFontStyle: WebsiteFontStyle
  template: WebsiteTemplate
  templateHasPositionableHeroCopy: boolean
}

export function WebsiteHeadlineControls({
  accentColor,
  alignment,
  fieldClass,
  headline,
  heroHeadlineScrollSlowdown,
  heroHeadlineScrollSpeed,
  heroHeadlineSize,
  heroVerticalAlignment,
  isDark,
  isHero,
  isStoryPortfolio,
  mutedTextClass,
  onSetAccentColor,
  onSetAlignment,
  onSetFontStyle,
  onSetHeroHeadlineSize,
  onSetHeroScrollSlowdown,
  onSetHeroScrollSpeed,
  onSetHeroVerticalAlignment,
  onSetShowHeadline,
  onUpdateHeadline,
  sectionLabel,
  showHeadline,
  siteFontStyle,
  template,
  templateHasPositionableHeroCopy,
}: WebsiteHeadlineControlsProps) {
  const isKineticHero = isHero && template === "kinetic-headline"
  const hasTemplateHeadlineStyle = template === "kinetic-headline" || template === "studio-split"
  const canPositionHeadline = !isHero || templateHasPositionableHeroCopy

  return (
    <>
      <label className={`flex items-center justify-between gap-3 rounded-md border p-3 text-sm ${isDark ? "border-white/10 bg-black/20" : "border-[#e3d3af] bg-white"}`}>
        <span>
          <span className="block font-semibold">Show headline</span>
          <span className={`mt-0.5 block text-xs ${mutedTextClass}`}>Hide the heading without deleting its text.</span>
        </span>
        <input
          checked={showHeadline}
          className="size-4 shrink-0 accent-[#d8a84f]"
          onChange={(event) => onSetShowHeadline(event.target.checked)}
          type="checkbox"
        />
      </label>

      {isHero && !templateHasPositionableHeroCopy ? (
        <div className={`rounded-md border p-3 text-xs leading-5 ${isDark ? "border-white/10 bg-black/20" : "border-[#e3d3af] bg-[#fffaf0]"}`}>
          This template uses an image-led Home stage without positioned Hero copy, so headline placement controls do not apply.
        </div>
      ) : null}

      {showHeadline && canPositionHeadline ? (
        <>
          <label className="grid gap-1 text-xs font-medium" data-website-editor-field="headline">
            {isStoryPortfolio ? "Left heading" : "Headline"}
            <input
              className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
              onChange={(event) => onUpdateHeadline(event.target.value)}
              placeholder={isStoryPortfolio ? "Add the heading beside the hero image" : "Add a headline"}
              value={headline}
            />
            {isStoryPortfolio && isHero ? (
              <span className={`text-[11px] font-normal leading-4 ${mutedTextClass}`}>
                This website-only heading replaces the portfolio name beside the Hero image.
              </span>
            ) : null}
          </label>

          <div className="grid gap-2" data-website-editor-field="headline-alignment">
            <span className="text-xs font-medium">{isKineticHero ? "Headline position" : "Headline alignment"}</span>
            {!isKineticHero ? (
              <div aria-label={`${sectionLabel} headline alignment`} className="grid grid-cols-3 gap-2" role="group">
                {(["left", "center", "right"] as const).map((headlineAlignment) => (
                  <button
                    aria-pressed={alignment === headlineAlignment}
                    className={`h-10 rounded-md border px-2 text-xs font-semibold capitalize ${
                      alignment === headlineAlignment
                        ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]"
                        : isDark ? "border-white/10" : "border-[#ded8cc] bg-white"
                    }`}
                    key={headlineAlignment}
                    onClick={() => onSetAlignment(headlineAlignment)}
                    type="button"
                  >
                    {headlineAlignment}
                  </button>
                ))}
              </div>
            ) : null}

            {isHero ? (
              <div className="grid gap-2">
                <span className="text-xs font-semibold">Vertical position</span>
                <div className="grid grid-cols-3 gap-2">
                  {(["top", "middle", "bottom"] as const).map((verticalAlignment) => (
                    <button
                      aria-pressed={heroVerticalAlignment === verticalAlignment}
                      className={`h-10 rounded-md border px-2 text-xs font-semibold capitalize ${
                        heroVerticalAlignment === verticalAlignment
                          ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]"
                          : isDark ? "border-white/10" : "border-[#ded8cc] bg-white"
                      }`}
                      key={verticalAlignment}
                      onClick={() => onSetHeroVerticalAlignment(verticalAlignment)}
                      type="button"
                    >
                      {verticalAlignment}
                    </button>
                  ))}
                </div>
                <span className={`text-[11px] leading-4 ${mutedTextClass}`}>Moves the complete Hero text group within the template panel.</span>
              </div>
            ) : null}

            <span className={`text-[11px] leading-4 ${mutedTextClass}`}>
              {isKineticHero
                ? "The moving headline uses vertical position; horizontal alignment does not apply while it scrolls."
                : "Applies to the Live Canvas, Preview, and published website."}
            </span>
          </div>

          {isHero ? (
            <>
              <label className={`grid gap-2 rounded-md border p-3 text-xs font-semibold ${isDark ? "border-white/10 bg-black/20" : "border-[#e3d3af] bg-white"}`}>
                <span className="flex items-center justify-between gap-3">
                  <span>Headline size</span>
                  <span className={`font-mono ${mutedTextClass}`}>{heroHeadlineSize}%</span>
                </span>
                <input
                  aria-label="Hero headline size"
                  className="accent-[#d8a84f]"
                  max={MAX_WEBSITE_HERO_HEADLINE_SIZE}
                  min={MIN_WEBSITE_HERO_HEADLINE_SIZE}
                  onChange={(event) => {
                    const heroHeadlineSize = Number(event.currentTarget.value)
                    onSetHeroHeadlineSize(heroHeadlineSize)
                  }}
                  onInput={(event) => {
                    const heroHeadlineSize = Number(event.currentTarget.value)
                    onSetHeroHeadlineSize(heroHeadlineSize)
                  }}
                  step="5"
                  type="range"
                  value={heroHeadlineSize}
                />
                <span className={`text-[11px] font-normal leading-4 ${mutedTextClass}`}>Move left to shrink the headline or right to enlarge it. The same size appears in Live Canvas, Preview, and the published website.</span>
              </label>

              {hasTemplateHeadlineStyle ? (
                <label className={`flex items-center justify-between gap-3 rounded-md border p-3 text-xs font-semibold ${isDark ? "border-white/10 bg-black/20" : "border-[#e3d3af] bg-white"}`}>
                  <span>
                    <span className="block">Headline color</span>
                    <span className={`mt-0.5 block text-[11px] font-normal ${mutedTextClass}`}>Also updates the template accent color.</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <input
                      aria-label="Hero headline color"
                      className="size-8 cursor-pointer rounded border border-current/20 bg-transparent p-0"
                      onChange={(event) => onSetAccentColor(event.target.value)}
                      type="color"
                      value={accentColor}
                    />
                    <span className={`font-mono text-[11px] uppercase ${mutedTextClass}`}>{accentColor}</span>
                  </span>
                </label>
              ) : null}

              {hasTemplateHeadlineStyle ? (
                <div className={`grid gap-2 rounded-md border p-3 text-xs font-semibold ${isDark ? "border-white/10 bg-black/20" : "border-[#e3d3af] bg-white"}`}>
                  <span>Headline font</span>
                  <div className="grid grid-cols-2 gap-2">
                    {websiteFontOptions.map((option) => (
                      <button
                        aria-pressed={siteFontStyle === option.key}
                        className={`rounded-md border px-2 py-2 text-left text-xs ${
                          siteFontStyle === option.key
                            ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]"
                            : isDark ? "border-white/10" : "border-[#ded8cc]"
                        }`}
                        key={option.key}
                        onClick={() => onSetFontStyle(option.key)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <span className={`text-[11px] font-normal leading-4 ${mutedTextClass}`}>Uses the same font family throughout the website for a consistent design.</span>
                </div>
              ) : null}

              {isKineticHero ? (
                <>
                  <label className={`grid gap-2 rounded-md border p-3 text-xs font-semibold ${isDark ? "border-white/10 bg-black/20" : "border-[#e3d3af] bg-white"}`}>
                    <span className="flex items-center justify-between gap-3">
                      <span>Scroll speed</span>
                      <span className={`font-mono ${mutedTextClass}`}>{heroHeadlineScrollSpeed}%</span>
                    </span>
                    <input
                      aria-label="Kinetic headline scroll speed"
                      className="accent-[#d8a84f]"
                      max={MAX_WEBSITE_HERO_SCROLL_SPEED}
                      min={MIN_WEBSITE_HERO_SCROLL_SPEED}
                      onChange={(event) => {
                        const heroHeadlineScrollSpeed = Number(event.currentTarget.value)
                        onSetHeroScrollSpeed(heroHeadlineScrollSpeed)
                      }}
                      onInput={(event) => {
                        const heroHeadlineScrollSpeed = Number(event.currentTarget.value)
                        onSetHeroScrollSpeed(heroHeadlineScrollSpeed)
                      }}
                      step="10"
                      type="range"
                      value={heroHeadlineScrollSpeed}
                    />
                    <span className={`text-[11px] font-normal leading-4 ${mutedTextClass}`}>Move left for a slower crawl or right for a faster headline.</span>
                  </label>

                  <label className={`grid gap-2 rounded-md border p-3 text-xs font-semibold ${isDark ? "border-white/10 bg-black/20" : "border-[#e3d3af] bg-white"}`}>
                    <span className="flex items-center justify-between gap-3">
                      <span>Center slowdown</span>
                      <span className={`font-mono ${mutedTextClass}`}>{heroHeadlineScrollSlowdown}%</span>
                    </span>
                    <input
                      aria-label="Kinetic headline center slowdown"
                      className="accent-[#d8a84f]"
                      max={MAX_WEBSITE_HERO_SCROLL_SLOWDOWN}
                      min={MIN_WEBSITE_HERO_SCROLL_SLOWDOWN}
                      onChange={(event) => {
                        const heroHeadlineScrollSlowdown = Number(event.currentTarget.value)
                        onSetHeroScrollSlowdown(heroHeadlineScrollSlowdown)
                      }}
                      onInput={(event) => {
                        const heroHeadlineScrollSlowdown = Number(event.currentTarget.value)
                        onSetHeroScrollSlowdown(heroHeadlineScrollSlowdown)
                      }}
                      step="5"
                      type="range"
                      value={heroHeadlineScrollSlowdown}
                    />
                    <span className={`text-[11px] font-normal leading-4 ${mutedTextClass}`}>0% keeps a constant speed. Higher values create a stronger slow zone through the center.</span>
                  </label>
                </>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </>
  )
}
