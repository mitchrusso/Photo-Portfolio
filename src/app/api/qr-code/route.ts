import QRCode from "qrcode"

import { isAllowedQrCodeTarget } from "@/lib/qr-code-target"
import { isPublishedCustomDomain } from "@/lib/website-publication"

export async function GET(request: Request) {
  const rawTarget = new URL(request.url).searchParams.get("target")?.trim() ?? ""

  if (!rawTarget || rawTarget.length > 4096) {
    return new Response("Invalid QR-code target.", { status: 400 })
  }

  let target: URL
  try {
    target = new URL(rawTarget)
  } catch {
    return new Response("Invalid QR-code target.", { status: 400 })
  }

  if (!await isAllowedQrCodeTarget(target, {
    isProduction: process.env.NODE_ENV === "production",
    isPublishedCustomDomain,
  })) {
    return new Response("QR codes are limited to PhotoView.io links.", { status: 400 })
  }

  const svg = await QRCode.toString(target.toString(), {
    color: { dark: "#17201b", light: "#ffffff" },
    errorCorrectionLevel: "M",
    margin: 2,
    type: "svg",
    width: 640,
  })

  return new Response(svg, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline; filename=photoview-qr-code.svg",
      "Content-Type": "image/svg+xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
