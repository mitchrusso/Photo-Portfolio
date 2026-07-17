import sharp from "sharp"
import { normalizeSocialCampaignDesign, type SocialCampaignDesign } from "@/lib/social-campaign-design"

const canvasSize = 1200

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]!)
}

function wrapText(value: string, maximumCharacters: number, maximumLines: number) {
  const words = value.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ""
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (candidate.length <= maximumCharacters || !line) {
      line = candidate
      continue
    }
    lines.push(line)
    line = word
    if (lines.length >= maximumLines - 1) break
  }
  if (line && lines.length < maximumLines) lines.push(line)
  if (words.join(" ").length > lines.join(" ").length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:!?]?$/, "")}…`
  }
  return lines
}

function textLines(lines: string[], x: number, y: number, lineHeight: number, attributes: string) {
  return lines.map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" ${attributes}>${escapeXml(line)}</text>`).join("")
}

function overlaySvg(designInput: SocialCampaignDesign) {
  const design = normalizeSocialCampaignDesign(designInput)
  const headline = wrapText(design.headline, 28, 3)
  const supporting = wrapText(design.supportingText, 46, 3)
  const brand = design.showBrand
    ? `<text x="70" y="1120" fill="#ffffff" font-family="Arial, sans-serif" font-size="28" font-weight="700">PhotoView.io</text>`
    : ""
  const cta = design.ctaLabel
    ? `<rect x="70" y="1000" width="${Math.min(500, 70 + design.ctaLabel.length * 19)}" height="70" rx="10" fill="#d8a84f"/><text x="100" y="1047" fill="#172019" font-family="Arial, sans-serif" font-size="30" font-weight="700">${escapeXml(design.ctaLabel)}</text>`
    : ""

  if (design.templateId === "gallery-spotlight") {
    return `<svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="760" width="1200" height="440" fill="#111713" fill-opacity="0.94"/>${textLines(headline, 70, 850, 72, 'fill="#ffffff" font-family="Arial, sans-serif" font-size="64" font-weight="700"')}${textLines(supporting, 70, 930 + Math.max(0, headline.length - 1) * 44, 44, 'fill="#e8e3d9" font-family="Arial, sans-serif" font-size="32"')}${cta}${brand}</svg>`
  }

  if (design.templateId === "editorial-story") {
    return `<svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="420" height="1200" fill="#f6f1e8"/><rect x="54" y="70" width="8" height="170" fill="#b58835"/>${textLines(headline, 92, 150, 70, 'fill="#182019" font-family="Georgia, serif" font-size="58" font-weight="700"')}${textLines(supporting, 92, 430, 45, 'fill="#514b42" font-family="Arial, sans-serif" font-size="31"')}${design.ctaLabel ? `<text x="92" y="1010" fill="#8a6428" font-family="Arial, sans-serif" font-size="29" font-weight="700">${escapeXml(design.ctaLabel)} →</text>` : ""}${design.showBrand ? `<text x="92" y="1110" fill="#182019" font-family="Arial, sans-serif" font-size="26" font-weight="700">PhotoView.io</text>` : ""}</svg>`
  }

  if (design.templateId === "client-invitation") {
    return `<svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg"><rect x="80" y="120" width="1040" height="960" rx="20" fill="#131a16" fill-opacity="0.86" stroke="#d8a84f" stroke-width="4"/>${textLines(headline, 150, 360, 88, 'fill="#ffffff" font-family="Georgia, serif" font-size="76" font-weight="700" text-anchor="start"')}${textLines(supporting, 150, 650, 52, 'fill="#ebe6dc" font-family="Arial, sans-serif" font-size="38"')}${cta}${brand}</svg>`
  }

  if (design.templateId === "print-launch") {
    return `<svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="1200" height="170" fill="#d8a84f"/><text x="70" y="105" fill="#172019" font-family="Arial, sans-serif" font-size="32" font-weight="700" letter-spacing="6">NEW RELEASE</text><rect x="0" y="845" width="1200" height="355" fill="#f7f3eb"/>${textLines(headline, 70, 940, 70, 'fill="#172019" font-family="Arial, sans-serif" font-size="62" font-weight="700"')}${textLines(supporting, 70, 1090, 42, 'fill="#5d564b" font-family="Arial, sans-serif" font-size="30"')}${design.ctaLabel ? `<rect x="780" y="1000" width="350" height="76" rx="10" fill="#172019"/><text x="955" y="1049" fill="#ffffff" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700">${escapeXml(design.ctaLabel)}</text>` : ""}</svg>`
  }

  return ""
}

export async function renderSocialCampaignImage(source: Buffer, designInput: SocialCampaignDesign) {
  const design = normalizeSocialCampaignDesign(designInput)
  const base = sharp(source, { limitInputPixels: 80_000_000 })
    .rotate()
    .resize(canvasSize, canvasSize, { fit: "cover", position: "attention" })
  if (design.templateId === "original") return base.jpeg({ quality: 90, mozjpeg: true }).toBuffer()

  const overlay = Buffer.from(overlaySvg(design))
  if (design.templateId === "editorial-story") {
    const photo = await base.resize(780, 1200, { fit: "cover", position: "attention" }).toBuffer()
    return sharp({ create: { background: "#f6f1e8", channels: 3, height: canvasSize, width: canvasSize } })
      .composite([{ input: photo, left: 420, top: 0 }, { input: overlay, left: 0, top: 0 }])
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer()
  }
  return base.composite([{ input: overlay, left: 0, top: 0 }]).jpeg({ quality: 90, mozjpeg: true }).toBuffer()
}
