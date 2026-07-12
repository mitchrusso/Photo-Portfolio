export function sumStoredPhotoBytes(photo: {
  bytes: bigint | number | null | undefined
  displayBytes: bigint | number | null | undefined
  thumbnailBytes: bigint | number | null | undefined
}) {
  return BigInt(photo.bytes ?? 0) + BigInt(photo.displayBytes ?? 0) + BigInt(photo.thumbnailBytes ?? 0)
}
