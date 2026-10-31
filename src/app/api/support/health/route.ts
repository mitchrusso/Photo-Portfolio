import { getSupportEngineHealth } from "@/lib/support-watchdog"

export const dynamic = "force-dynamic"

export async function GET() {
  const health = await getSupportEngineHealth()
  return Response.json(health, {
    headers: { "Cache-Control": "no-store, max-age=0" },
    status: health.ok ? 200 : 503,
  })
}
