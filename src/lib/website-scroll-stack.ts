export const DEFAULT_SCROLL_STACK_CARD_HEIGHT = 70
export const MIN_SCROLL_STACK_CARD_HEIGHT = 40
export const MAX_SCROLL_STACK_CARD_HEIGHT = 90

export function normalizeScrollStackCardHeight(
  value: unknown,
  fallback = DEFAULT_SCROLL_STACK_CARD_HEIGHT,
) {
  const numericValue = Number(value)
  const normalizedFallback = Number.isFinite(fallback)
    ? Math.min(MAX_SCROLL_STACK_CARD_HEIGHT, Math.max(MIN_SCROLL_STACK_CARD_HEIGHT, Math.round(fallback)))
    : DEFAULT_SCROLL_STACK_CARD_HEIGHT

  if (!Number.isFinite(numericValue)) return normalizedFallback

  return Math.min(
    MAX_SCROLL_STACK_CARD_HEIGHT,
    Math.max(MIN_SCROLL_STACK_CARD_HEIGHT, Math.round(numericValue)),
  )
}
