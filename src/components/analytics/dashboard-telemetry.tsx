"use client"

import { useEffect } from "react"

export function DashboardTelemetry({ workspaceId }: { workspaceId: string }) {
  useEffect(() => {
    fetch("/api/analytics/events", {
      body: JSON.stringify({
        eventType: "DASHBOARD_OPEN",
        metadata: { workspaceId },
        path: "/dashboard",
        title: document.title,
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    }).catch(() => undefined)
  }, [workspaceId])

  return null
}
