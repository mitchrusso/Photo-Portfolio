export const DEFAULT_WEBSITE_HERO_HEADLINE_SIZE = 100
export const MIN_WEBSITE_HERO_HEADLINE_SIZE = 40
export const MAX_WEBSITE_HERO_HEADLINE_SIZE = 140

export function normalizeWebsiteHeroHeadlineSize(
  value: unknown,
  fallback = DEFAULT_WEBSITE_HERO_HEADLINE_SIZE,
) {
  const numericValue = typeof value === "number" ? value : Number(value)
  const normalizedFallback = Math.min(
    MAX_WEBSITE_HERO_HEADLINE_SIZE,
    Math.max(MIN_WEBSITE_HERO_HEADLINE_SIZE, Math.round(fallback)),
  )

  if (!Number.isFinite(numericValue)) return normalizedFallback

  return Math.min(
    MAX_WEBSITE_HERO_HEADLINE_SIZE,
    Math.max(MIN_WEBSITE_HERO_HEADLINE_SIZE, Math.round(numericValue)),
  )
}

export function getWebsiteHeroHeadlineStyle(value: unknown) {
  const scale = normalizeWebsiteHeroHeadlineSize(value) / 100
  const minimumRem = (2.25 * scale).toFixed(3)
  const preferredContainerWidth = (5.5 * scale).toFixed(3)
  const maximumRem = (4.5 * scale).toFixed(3)

  return {
    fontSize: `clamp(${minimumRem}rem, ${preferredContainerWidth}cqw, ${maximumRem}rem)`,
  }
}
