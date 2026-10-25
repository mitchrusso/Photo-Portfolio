import type { CSSProperties } from "react"

export const DEFAULT_WEBSITE_FONT_SIZE = 100
export const MIN_WEBSITE_FONT_SIZE = 75
export const MAX_WEBSITE_FONT_SIZE = 140
export const DEFAULT_WEBSITE_ABOUT_BODY_FONT_SIZE = 100
export const MIN_WEBSITE_ABOUT_BODY_FONT_SIZE = 60
export const MAX_WEBSITE_ABOUT_BODY_FONT_SIZE = 140
export const DEFAULT_WEBSITE_SECTION_HEADLINE_SIZE = 100
export const MIN_WEBSITE_SECTION_HEADLINE_SIZE = 50
export const MAX_WEBSITE_SECTION_HEADLINE_SIZE = 150

export function normalizeWebsiteFontSize(
  value: unknown,
  fallback = DEFAULT_WEBSITE_FONT_SIZE,
) {
  const fallbackNumber = Number(fallback)
  const normalizedFallback = Number.isFinite(fallbackNumber)
    ? Math.max(MIN_WEBSITE_FONT_SIZE, Math.min(MAX_WEBSITE_FONT_SIZE, Math.round(fallbackNumber)))
    : DEFAULT_WEBSITE_FONT_SIZE
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) return normalizedFallback

  return Math.max(MIN_WEBSITE_FONT_SIZE, Math.min(MAX_WEBSITE_FONT_SIZE, Math.round(numericValue)))
}

export function normalizeWebsiteAboutBodyFontSize(
  value: unknown,
  fallback = DEFAULT_WEBSITE_ABOUT_BODY_FONT_SIZE,
) {
  const fallbackNumber = Number(fallback)
  const normalizedFallback = Number.isFinite(fallbackNumber)
    ? Math.max(MIN_WEBSITE_ABOUT_BODY_FONT_SIZE, Math.min(MAX_WEBSITE_ABOUT_BODY_FONT_SIZE, Math.round(fallbackNumber)))
    : DEFAULT_WEBSITE_ABOUT_BODY_FONT_SIZE
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) return normalizedFallback

  return Math.max(MIN_WEBSITE_ABOUT_BODY_FONT_SIZE, Math.min(MAX_WEBSITE_ABOUT_BODY_FONT_SIZE, Math.round(numericValue)))
}

export function normalizeWebsiteSectionHeadlineSize(
  value: unknown,
  fallback = DEFAULT_WEBSITE_SECTION_HEADLINE_SIZE,
) {
  const fallbackNumber = Number(fallback)
  const normalizedFallback = Number.isFinite(fallbackNumber)
    ? Math.max(MIN_WEBSITE_SECTION_HEADLINE_SIZE, Math.min(MAX_WEBSITE_SECTION_HEADLINE_SIZE, Math.round(fallbackNumber)))
    : DEFAULT_WEBSITE_SECTION_HEADLINE_SIZE
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) return normalizedFallback

  return Math.max(MIN_WEBSITE_SECTION_HEADLINE_SIZE, Math.min(MAX_WEBSITE_SECTION_HEADLINE_SIZE, Math.round(numericValue)))
}

export function normalizeWebsiteSectionHeadlineSizes<Key extends string>(
  value: unknown,
  keys: readonly Key[],
): Record<Key, number> {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {}

  return Object.fromEntries(
    keys.map((key) => [key, normalizeWebsiteSectionHeadlineSize(source[key])]),
  ) as Record<Key, number>
}

type WebsiteFontSizeStyle = CSSProperties & Record<`--${string}`, string | number>

function getWebsiteTextSizeVariables(scale: number): WebsiteFontSizeStyle {
  const rem = (base: number) => `${Number((base * scale).toFixed(4))}rem`

  return {
    "--website-font-scale": scale,
    "--text-xs": rem(0.75),
    "--text-sm": rem(0.875),
    "--text-base": rem(1),
    "--text-lg": rem(1.125),
    "--text-xl": rem(1.25),
    "--text-2xl": rem(1.5),
    "--text-3xl": rem(1.875),
    "--text-4xl": rem(2.25),
    "--text-5xl": rem(3),
    "--text-6xl": rem(3.75),
    "--text-7xl": rem(4.5),
    "--text-8xl": rem(6),
  }
}

export function getWebsiteFontSizeStyle(value: unknown): WebsiteFontSizeStyle {
  const scale = normalizeWebsiteFontSize(value) / 100

  return {
    ...getWebsiteTextSizeVariables(scale),
    fontSize: `${Number(scale.toFixed(4))}rem`,
  }
}

export function getWebsiteSectionHeadlineSizeStyle(
  headlineSize: unknown,
  siteFontSize: unknown = DEFAULT_WEBSITE_FONT_SIZE,
): WebsiteFontSizeStyle {
  const scale = (normalizeWebsiteFontSize(siteFontSize) / 100)
    * (normalizeWebsiteSectionHeadlineSize(headlineSize) / 100)

  return getWebsiteTextSizeVariables(scale)
}

export function getWebsiteAboutBodyFontSizeStyle(
  aboutBodyFontSize: unknown,
  siteFontSize: unknown = DEFAULT_WEBSITE_FONT_SIZE,
): WebsiteFontSizeStyle {
  const scale = (normalizeWebsiteFontSize(siteFontSize) / 100)
    * (normalizeWebsiteAboutBodyFontSize(aboutBodyFontSize) / 100)

  return getWebsiteTextSizeVariables(scale)
}
