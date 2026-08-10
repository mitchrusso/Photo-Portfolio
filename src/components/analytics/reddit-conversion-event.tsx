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
    let attempts = 0

    try {
      if (window.sessionStorage.getItem(storageKey)) return
    } catch {
      // Tracking should still work when browser storage is unavailable.
    }

    const sendEvent = () => {
      attempts += 1
      if (!trackRedditConversionEvent(eventName)) return false

      try {
        window.sessionStorage.setItem(storageKey, "1")
      } catch {
        // The event was still sent when browser storage is unavailable.
      }

      return true
    }

    if (sendEvent()) return

    const retryTimer = window.setInterval(() => {
      if (sendEvent() || attempts >= 20) window.clearInterval(retryTimer)
    }, 250)

    return () => window.clearInterval(retryTimer)
  }, [dedupeKey, eventName])

  return null
}
