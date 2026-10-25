const MAX_JPEG_XL_PIXELS = 100_000_000
const MAX_PREVIEW_EDGE = 2_400

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("PhotoView could not prepare the JPEG XL display copy.")),
      "image/webp",
      0.88,
    )
  })
}

export async function createJpegXlPreview(file: File) {
  const { default: decode } = await import("@jsquash/jxl/decode.js")
  let image: ImageData
  try {
    image = await decode(await file.arrayBuffer())
  } catch {
    throw new Error("The JPEG XL file could not be decoded. Confirm that it is a valid .jxl image and try again.")
  }

  if (!image.width || !image.height || image.width * image.height > MAX_JPEG_XL_PIXELS) {
    throw new Error("The JPEG XL image dimensions exceed the safe processing limit.")
  }

  const scale = Math.min(1, MAX_PREVIEW_EDGE / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const source = document.createElement("canvas")
  source.width = image.width
  source.height = image.height
  const sourceContext = source.getContext("2d")
  if (!sourceContext) throw new Error("PhotoView could not prepare the JPEG XL display copy.")
  sourceContext.putImageData(image, 0, 0)

  const output = document.createElement("canvas")
  output.width = width
  output.height = height
  const outputContext = output.getContext("2d")
  if (!outputContext) throw new Error("PhotoView could not prepare the JPEG XL display copy.")
  outputContext.drawImage(source, 0, 0, width, height)

  return canvasBlob(output)
}
