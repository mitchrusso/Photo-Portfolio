import { NextResponse } from "next/server"
import {
  LATEST_LIGHTROOM_PLUGIN_VERSION,
  LIGHTROOM_PLUGIN_DOWNLOAD_PATH,
} from "@/lib/lightroom-plugin-version"

export async function GET() {
  return NextResponse.json(
    {
      downloadUrl: `https://photoview.io${LIGHTROOM_PLUGIN_DOWNLOAD_PATH}`,
      version: LATEST_LIGHTROOM_PLUGIN_VERSION,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  )
}
