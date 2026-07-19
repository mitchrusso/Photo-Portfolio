import QRCode from "qrcode"

function isAllowedTarget(target: URL) {
  const isPhotoViewHost = target.hostname === "photoview.io" || target.hostname.endsWith(".photoview.io")
  const isLocalDevelopment = process.env.NODE_ENV !== "production"
    && (target.hostname === "localhost" || target.hostname === "127.0.0.1")

  return (target.protocol === "https:" && isPhotoViewHost)
    || (isLocalDevelopment && (target.protocol === "http:" || target.protocol === "https:"))
}

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

  if (!isAllowedTarget(target)) {
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
