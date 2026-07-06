export type ClientPhotoUploadResult = {
  ok: boolean
  provider: string
  pathname: string
  url: string
  downloadUrl: string
  size: number
}

export async function uploadPhotoFromClient(pathname: string, file: File): Promise<ClientPhotoUploadResult> {
  const formData = new FormData()
  formData.set("pathname", pathname)
  formData.set("file", file)

  const response = await fetch("/api/storage/upload", {
    method: "POST",
    body: formData,
  })

  const payload = (await response.json()) as ClientPhotoUploadResult | { error?: string }

  if (!response.ok) {
    throw new Error("error" in payload && payload.error ? payload.error : "Upload failed")
  }

  return payload as ClientPhotoUploadResult
}
