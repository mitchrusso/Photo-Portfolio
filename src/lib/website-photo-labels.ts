import {
  getPortfolioPhotoDisplayLabel,
  isVisibleRenderableImage,
  photoMatchesCover,
  type PortfolioGallery,
  type PortfolioPhoto,
} from "./gallery-utils.ts"

export function getWebsitePortfolioSummaryPhoto(
  gallery: Pick<PortfolioGallery, "cover" | "coverPhotoId" | "photos">,
) {
  const photos = gallery.photos ?? []
  return photos.find((photo) => isVisibleRenderableImage(photo) && photoMatchesCover(photo, gallery.cover, gallery.coverPhotoId))
    ?? photos.find(isVisibleRenderableImage)
}

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
