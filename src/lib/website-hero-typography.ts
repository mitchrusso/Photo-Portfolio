import type { CSSProperties } from "react"

export const DEFAULT_WEBSITE_HERO_HEADLINE_SIZE = 100
export const MIN_WEBSITE_HERO_HEADLINE_SIZE = 20
export const MAX_WEBSITE_HERO_HEADLINE_SIZE = 140
export const DEFAULT_WEBSITE_HERO_SCROLL_SPEED = 100
export const MIN_WEBSITE_HERO_SCROLL_SPEED = 50
export const MAX_WEBSITE_HERO_SCROLL_SPEED = 200
export const DEFAULT_WEBSITE_HERO_SCROLL_SLOWDOWN = 50
export const MIN_WEBSITE_HERO_SCROLL_SLOWDOWN = 0
export const MAX_WEBSITE_HERO_SCROLL_SLOWDOWN = 100

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
    "--website-hero-headline-scale": scale,
    fontSize: `clamp(${minimumRem}rem, ${preferredContainerWidth}cqw, ${maximumRem}rem)`,
  } as CSSProperties
}

export function normalizeWebsiteHeroScrollSpeed(
  value: unknown,
  fallback = DEFAULT_WEBSITE_HERO_SCROLL_SPEED,
) {
  const numericValue = typeof value === "number" ? value : Number(value)
  const normalizedFallback = Math.min(
    MAX_WEBSITE_HERO_SCROLL_SPEED,
    Math.max(MIN_WEBSITE_HERO_SCROLL_SPEED, Math.round(fallback)),
  )

  if (!Number.isFinite(numericValue)) return normalizedFallback

  return Math.min(
    MAX_WEBSITE_HERO_SCROLL_SPEED,
    Math.max(MIN_WEBSITE_HERO_SCROLL_SPEED, Math.round(numericValue)),
  )
}

export function getWebsiteHeroScrollDuration(value: unknown) {
  return 18 / (normalizeWebsiteHeroScrollSpeed(value) / 100)
}

export function normalizeWebsiteHeroScrollSlowdown(
  value: unknown,
  fallback = DEFAULT_WEBSITE_HERO_SCROLL_SLOWDOWN,
) {
  const numericValue = typeof value === "number" ? value : Number(value)
  const normalizedFallback = Math.min(
    MAX_WEBSITE_HERO_SCROLL_SLOWDOWN,
    Math.max(MIN_WEBSITE_HERO_SCROLL_SLOWDOWN, Math.round(fallback)),
  )

  if (!Number.isFinite(numericValue)) return normalizedFallback

  return Math.min(
    MAX_WEBSITE_HERO_SCROLL_SLOWDOWN,
    Math.max(MIN_WEBSITE_HERO_SCROLL_SLOWDOWN, Math.round(numericValue)),
  )
}
