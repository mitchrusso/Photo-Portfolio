import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db"
import { normalizeSocialCampaignDesign } from "@/lib/social-campaign-design"
import { renderSocialCampaignImage } from "@/lib/social-campaign-renderer"
import { verifySocialRender } from "@/lib/social-render-signing"
import { getPhotoDeliveryUrl } from "@/lib/photo-storage"
import { readResponseBytesLimited } from "@/lib/limited-response"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(
  request: Request,
  context: { params: Promise<{ deliveryId: string }> },
) {
  const { deliveryId } = await context.params
  const url = new URL(request.url)
  const expires = Number(url.searchParams.get("expires"))
  const signature = url.searchParams.get("signature") ?? ""
  if (!verifySocialRender(deliveryId, expires, signature)) {
    return NextResponse.json({ error: "This social image link is invalid or expired." }, { status: 403 })
  }

  const delivery = await getPrismaClient().socialDelivery.findUnique({
    select: {
      design: true,
      photo: { select: { displayUrl: true, originalUrl: true } },
    },
    where: { id: deliveryId },
  })
  if (!delivery) return NextResponse.json({ error: "Social image not found." }, { status: 404 })

  const sourceUrl = await getPhotoDeliveryUrl(delivery.photo.displayUrl ?? delivery.photo.originalUrl, { expiresIn: 10 * 60 })
  const sourceResponse = await fetch(sourceUrl, { cache: "no-store" })
  if (!sourceResponse.ok) return NextResponse.json({ error: "The source photograph could not be loaded." }, { status: 502 })
  let sourceBytes: Uint8Array
  try {
    sourceBytes = await readResponseBytesLimited(sourceResponse, 40 * 1024 * 1024)
  } catch {
    return NextResponse.json({ error: "The source photograph is too large." }, { status: 413 })
  }

  const rendered = await renderSocialCampaignImage(
    Buffer.from(sourceBytes),
    normalizeSocialCampaignDesign(delivery.design),
  )
  return new Response(new Uint8Array(rendered), {
    headers: {
      "Cache-Control": "public, max-age=900, s-maxage=900",
      "Content-Disposition": `inline; filename="photoview-social-${deliveryId}.jpg"`,
      "Content-Type": "image/jpeg",
    },
  })
}
