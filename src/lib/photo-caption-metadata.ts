const PHOTO_CAPTION_MAX_LENGTH = 240

export type EmbeddedPhotoMetadata = {
  comments?: Array<{ keyword?: string; text?: string }>
  iptc?: Buffer
  xmp?: Buffer
  xmpAsString?: string
}

function normalizeEmbeddedCaption(value: string | undefined | null): string {
  if (!value) return ""
  return value.replace(/\0/g, "").replace(/\s+/g, " ").trim().slice(0, PHOTO_CAPTION_MAX_LENGTH)
}

function decodeXmlText(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
}

function extractXmpValue(xmp: string, tagName: string): string {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const element = xmp.match(new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i"))?.[1]
  if (element) {
    const alternate = element.match(/<rdf:li\b[^>]*>([\s\S]*?)<\/rdf:li>/i)?.[1]
    return normalizeEmbeddedCaption(decodeXmlText(alternate ?? element))
  }
  const attribute = xmp.match(new RegExp(`\\b${escaped}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"))?.[2]
  return attribute ? normalizeEmbeddedCaption(decodeXmlText(attribute)) : ""
}

export function extractIptcCaption(iptc: Uint8Array): string {
  for (let offset = 0; offset + 5 <= iptc.byteLength;) {
    if (iptc[offset] !== 0x1c) {
      offset += 1
      continue
    }
    const record = iptc[offset + 1]
    const dataset = iptc[offset + 2]
    let length = (iptc[offset + 3] << 8) | iptc[offset + 4]
    let valueOffset = offset + 5
    if ((length & 0x8000) !== 0) {
      const lengthBytes = length & 0x7fff
      if (lengthBytes < 1 || lengthBytes > 4 || valueOffset + lengthBytes > iptc.byteLength) break
      length = 0
      for (let index = 0; index < lengthBytes; index += 1) length = (length << 8) | iptc[valueOffset + index]
      valueOffset += lengthBytes
    }
    const nextOffset = valueOffset + length
    if (nextOffset > iptc.byteLength) break
    if (record === 2 && dataset === 120) {
      return normalizeEmbeddedCaption(Buffer.from(iptc.subarray(valueOffset, nextOffset)).toString("utf8"))
    }
    offset = nextOffset
  }
  return ""
}

export function extractEmbeddedPhotoCaption(metadata: EmbeddedPhotoMetadata): string {
  const xmp = metadata.xmpAsString || metadata.xmp?.toString("utf8") || ""
  for (const tagName of ["dc:description", "photoshop:Headline", "dc:title"]) {
    const value = extractXmpValue(xmp, tagName)
    if (value) return value
  }

  const iptcCaption = metadata.iptc ? extractIptcCaption(metadata.iptc) : ""
  if (iptcCaption) return iptcCaption

  const comment = metadata.comments?.find((entry) => /^(description|caption|comment)$/i.test(entry.keyword?.trim() ?? ""))
  return normalizeEmbeddedCaption(comment?.text)
}

export function resolveImportedCaption(explicitCaption: string, embeddedCaption: string, source: string): string {
  const explicit = explicitCaption.trim()
  if (explicit) return explicit
  return source === "bridge" ? normalizeEmbeddedCaption(embeddedCaption) : ""
}
