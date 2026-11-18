import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"
import { externalSupportWatchdogDispatchRequest } from "@/lib/support-external-watchdog-request"

const DISPATCH_FINGERPRINT = "support:external-watchdog-dispatch"

export async function dispatchExternalSupportWatchdog() {
  const token = process.env.GITHUB_REPAIR_DISPATCH_TOKEN?.trim()
  if (!token) {
    await recordOperationalEvent({
      category: "SYSTEM",
      fingerprint: DISPATCH_FINGERPRINT,
      message: "The external PhotoView support watchdog dispatch token is not configured.",
      severity: "CRITICAL",
      source: "support-watchdog-dispatch",
    })
    return "not_configured" as const
  }

  const request = externalSupportWatchdogDispatchRequest({
    repository: process.env.GITHUB_REPAIR_REPOSITORY,
    token,
  })
  const response = await fetch(request.url, request.init)
  if (!response.ok) {
    await recordOperationalEvent({
      category: "SYSTEM",
      fingerprint: DISPATCH_FINGERPRINT,
      message: `GitHub rejected the external PhotoView support watchdog dispatch with HTTP ${response.status}.`,
      severity: "CRITICAL",
      source: "support-watchdog-dispatch",
    })
    return "failed" as const
  }

  await resolveOperationalEventByFingerprint(DISPATCH_FINGERPRINT)
  return "dispatched" as const
}
