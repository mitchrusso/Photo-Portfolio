"use client"

import { useEffect } from "react"
import { trackRedditConversionEvent } from "@/components/analytics/reddit-pixel"
import type { RedditConversionEventName } from "@/components/analytics/reddit-pixel"

export function RedditConversionEvent({
  dedupeKey,
  eventName,
}: {
  dedupeKey: string
  eventName: RedditConversionEventName
}) {
  useEffect(() => {
    const storageKey = `photoview:reddit:${eventName}:${dedupeKey}`

    try {
      if (window.sessionStorage.getItem(storageKey)) return
      window.sessionStorage.setItem(storageKey, "1")
    } catch {
      // Tracking should still work when browser storage is unavailable.
    }

    trackRedditConversionEvent(eventName)
  }, [dedupeKey, eventName])

  return null
}
