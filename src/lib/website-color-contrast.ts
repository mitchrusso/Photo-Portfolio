const MINIMUM_NORMAL_TEXT_CONTRAST = 4.5

type RgbColor = { blue: number; green: number; red: number }

function parseHexColor(value: string): RgbColor | null {
  const normalized = value.trim().replace(/^#/, "")
  const expanded = normalized.length === 3
    ? normalized.split("").map((character) => `${character}${character}`).join("")
    : normalized

  if (!/^[0-9a-f]{6}$/i.test(expanded)) return null

  return {
    blue: Number.parseInt(expanded.slice(4, 6), 16),
    green: Number.parseInt(expanded.slice(2, 4), 16),
    red: Number.parseInt(expanded.slice(0, 2), 16),
  }
}

function relativeLuminance(color: RgbColor) {
  const channel = (value: number) => {
    const normalized = value / 255
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4
  }

  return (0.2126 * channel(color.red))
    + (0.7152 * channel(color.green))
    + (0.0722 * channel(color.blue))
}

function contrastRatio(first: RgbColor, second: RgbColor) {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second))
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second))
  return (lighter + 0.05) / (darker + 0.05)
}

export function getAccessibleWebsiteTextColor(backgroundColor: string, requestedTextColor: string) {
  const background = parseHexColor(backgroundColor)
  const requested = parseHexColor(requestedTextColor)
  if (!background || !requested) return requestedTextColor
  if (contrastRatio(background, requested) >= MINIMUM_NORMAL_TEXT_CONTRAST) return requestedTextColor

  const lightText = parseHexColor("#ffffff") as RgbColor
  const darkText = parseHexColor("#171814") as RgbColor
  return contrastRatio(background, lightText) >= contrastRatio(background, darkText)
    ? "#ffffff"
    : "#171814"
}
