import type { CSSProperties } from "react"

const DEFAULT_BACKGROUND_COLOR = "#ffffff"
export const MAX_SAVED_WEBSITE_BACKGROUNDS = 12

export function normalizeWebsiteBackgroundImageLibrary(
  value: unknown,
  activeImageUrl = "",
) {
  const candidates = [
    activeImageUrl,
    ...(Array.isArray(value) ? value : []),
  ]

  return [...new Set(
    candidates
      .filter((candidate): candidate is string => typeof candidate === "string")
      .map((candidate) => candidate.trim())
      .filter(Boolean),
  )].slice(0, MAX_SAVED_WEBSITE_BACKGROUNDS)
}

export function normalizeWebsiteBackgroundScreenBack(value: unknown, fallback = 0) {
  const numericValue = typeof value === "number" ? value : Number(value)
  const safeFallback = Number.isFinite(fallback) ? fallback : 0

  return Math.round(Math.max(0, Math.min(100, Number.isFinite(numericValue) ? numericValue : safeFallback)))
}

export function normalizeWebsiteBackgroundBrightness(value: unknown, fallback = 100) {
  const numericValue = typeof value === "number" ? value : Number(value)
  const safeFallback = Number.isFinite(fallback) ? fallback : 100

  return Math.round(Math.max(25, Math.min(175, Number.isFinite(numericValue) ? numericValue : safeFallback)))
}

function getBackgroundRgb(backgroundColor: string) {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(backgroundColor)
    ?? /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(backgroundColor)

  if (!match) return { blue: 255, green: 255, red: 255 }

  const [, red, green, blue] = match
  const expand = (channel: string) => channel.length === 1 ? `${channel}${channel}` : channel

  return {
    blue: Number.parseInt(expand(blue), 16),
    green: Number.parseInt(expand(green), 16),
    red: Number.parseInt(expand(red), 16),
  }
}

export function getWebsiteBackgroundStyle({
  backgroundColor,
  brightnessPercent,
  fixed = false,
  imageUrl,
  screenBackPercent,
}: {
  backgroundColor: string
  brightnessPercent: number
  fixed?: boolean
  imageUrl: string
  screenBackPercent: number
}): CSSProperties {
  const safeBackgroundColor = backgroundColor || DEFAULT_BACKGROUND_COLOR
  if (!imageUrl) return { backgroundColor: safeBackgroundColor }

  const { blue, green, red } = getBackgroundRgb(safeBackgroundColor)
  const overlayOpacity = normalizeWebsiteBackgroundScreenBack(screenBackPercent) / 100
  const brightness = normalizeWebsiteBackgroundBrightness(brightnessPercent)
  const brightnessOverlayColor = brightness < 100 ? "0, 0, 0" : "255, 255, 255"
  const brightnessOverlayOpacity = brightness < 100
    ? 1 - brightness / 100
    : (brightness - 100) / 100
  const escapedImageUrl = imageUrl.replaceAll("\\", "\\\\").replaceAll('"', '\\"')
  const screenBackOverlay = `linear-gradient(rgba(${red}, ${green}, ${blue}, ${overlayOpacity}), rgba(${red}, ${green}, ${blue}, ${overlayOpacity}))`
  const brightnessOverlay = `linear-gradient(rgba(${brightnessOverlayColor}, ${brightnessOverlayOpacity}), rgba(${brightnessOverlayColor}, ${brightnessOverlayOpacity}))`

  return {
    backgroundAttachment: fixed ? "fixed" : undefined,
    backgroundColor: safeBackgroundColor,
    backgroundImage: `${brightnessOverlay}, ${screenBackOverlay}, url("${escapedImageUrl}")`,
    backgroundPosition: "center top",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
  }
}
