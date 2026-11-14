import {
  getPortfolioPhotoDisplayLabel,
  type PortfolioGallery,
  type PortfolioPhoto,
} from "./gallery-utils.ts"

export function getWebsitePhotoDisplayLabel(
  gallery: Pick<PortfolioGallery, "photoLabelMode" | "showFileNames">,
  photo: PortfolioPhoto | undefined,
  hideWebsitePhotoFileNames: boolean,
) {
  if (!photo) return ""

  const labelMode = gallery.photoLabelMode ?? (gallery.showFileNames === false ? "none" : "file-name")
  if (hideWebsitePhotoFileNames && labelMode === "file-name") return ""

  return getPortfolioPhotoDisplayLabel(gallery, photo)
}
