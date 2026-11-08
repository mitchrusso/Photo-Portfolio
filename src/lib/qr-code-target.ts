type PublishedCustomDomainLookup = (hostname: string) => boolean | Promise<boolean>

type QrCodeTargetOptions = {
  isProduction: boolean
  isPublishedCustomDomain: PublishedCustomDomainLookup
}

export async function isAllowedQrCodeTarget(target: URL, options: QrCodeTargetOptions) {
  const hostname = target.hostname.toLowerCase().replace(/\.$/, "")
  const isPhotoViewHost = hostname === "photoview.io" || hostname.endsWith(".photoview.io")
  if (target.protocol === "https:" && isPhotoViewHost) return true

  const isLocalDevelopment = !options.isProduction
    && (hostname === "localhost" || hostname === "127.0.0.1")
  if (isLocalDevelopment && (target.protocol === "http:" || target.protocol === "https:")) return true

  if (target.protocol !== "https:") return false
  return options.isPublishedCustomDomain(hostname)
}
