const MP4_MIME_TYPE = "video/mp4"

export function isMovVideo(file: Pick<File, "name" | "type">) {
  return file.type.toLowerCase() === "video/quicktime" || file.name.toLowerCase().endsWith(".mov")
}

export function isSupportedHeroVideo(file: Pick<File, "name" | "type">) {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return type === MP4_MIME_TYPE || type === "video/quicktime" || name.endsWith(".mp4") || name.endsWith(".mov")
}

function mp4FileName(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "").trim() || "hero-video"
  return `${baseName}.mp4`
}

export async function prepareHeroVideoForUpload(
  file: File,
  onProgress?: (progress: number) => void,
) {
  if (!isMovVideo(file)) return file

  const {
    ALL_FORMATS,
    BlobSource,
    BufferTarget,
    Conversion,
    Input,
    Mp4OutputFormat,
    Output,
  } = await import("mediabunny")

  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file),
  })
  const target = new BufferTarget()
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: "in-memory" }),
    target,
  })
  const conversion = await Conversion.init({ input, output, showWarnings: false })

  if (!conversion.isValid || conversion.utilizedTracks.length === 0) {
    throw new Error("This MOV uses a video format that this browser cannot convert. Try exporting it as H.264 MP4.")
  }

  conversion.onProgress = (progress) => onProgress?.(Math.max(0, Math.min(1, progress)))
  await conversion.execute()

  if (!target.buffer) throw new Error("The MOV conversion did not produce a playable video.")
  onProgress?.(1)

  return new File([target.buffer], mp4FileName(file.name), {
    lastModified: file.lastModified,
    type: MP4_MIME_TYPE,
  })
}
