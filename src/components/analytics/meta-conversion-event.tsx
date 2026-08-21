"use client"

import { useEffect } from "react"
import { trackMetaConversionEvent } from "@/components/analytics/meta-pixel"
import type { MetaConversionEventName } from "@/components/analytics/meta-pixel"

export function MetaConversionEvent({
  dedupeKey,
  eventName,
}: {
  dedupeKey: string
  eventName: MetaConversionEventName
}) {
  useEffect(() => {
    const storageKey = `photoview:meta:${eventName}:${dedupeKey}`
    let attempts = 0

    try {
      if (window.sessionStorage.getItem(storageKey)) return
    } catch {
      // Tracking should still work when browser storage is unavailable.
    }

    const sendEvent = () => {
      attempts += 1
      if (!trackMetaConversionEvent(eventName)) return false

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
