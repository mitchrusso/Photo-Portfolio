"use client"

import type PsdType from "@webtoon/psd"
import { PHOTOSHOP_PREVIEW_SAFETY_BYTES } from "./photoshop-upload.ts"

const PREVIEW_MAX_EDGE = 2400

export async function createPhotoshopPreview(file: File): Promise<Blob> {
  let psd: PsdType
  try {
    const { default: Psd } = await import("@webtoon/psd")
    psd = Psd.parse(await file.arrayBuffer())
  } catch {
    throw new Error("This Photoshop document could not be read. Save it with a composite preview in Photoshop, then try again.")
  }

  if (!psd.width || !psd.height) throw new Error("This Photoshop document has invalid canvas dimensions.")

  let pixels: Uint8ClampedArray
  try {
    pixels = await psd.composite()
  } catch {
    throw new Error("PhotoView could not flatten this Photoshop document. Save it with Maximize Compatibility enabled, then try again.")
  }

  const scale = Math.min(1, PREVIEW_MAX_EDGE / Math.max(psd.width, psd.height))
  const width = Math.max(1, Math.round(psd.width * scale))
  const height = Math.max(1, Math.round(psd.height * scale))
  const sourceImage = new ImageData(new Uint8ClampedArray(pixels), psd.width, psd.height)
  const target = document.createElement("canvas")
  target.width = width
  target.height = height
  const targetContext = target.getContext("2d")
  if (!targetContext) throw new Error("This browser could not prepare the Photoshop display copy.")

  if (width === psd.width && height === psd.height) {
    targetContext.putImageData(sourceImage, 0, 0)
  } else {
    const bitmap = await createImageBitmap(sourceImage)
    targetContext.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
  }

  const preview = await new Promise<Blob | null>((resolve) => target.toBlob(resolve, "image/webp", 0.88))
  if (!preview) throw new Error("This browser could not create the Photoshop display copy.")
  if (preview.size > PHOTOSHOP_PREVIEW_SAFETY_BYTES) {
    throw new Error("The flattened Photoshop preview is too large. Reduce its pixel dimensions, then try again.")
  }
  return preview
}
