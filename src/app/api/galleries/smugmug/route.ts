import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    error: "The public-page SmugMug scanner has been retired. Connect SmugMug from Settings > Imports to use the official API.",
  }, { status: 410 })
}
