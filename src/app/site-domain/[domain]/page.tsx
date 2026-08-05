import { notFound, permanentRedirect } from "next/navigation"

import { WebsiteDraftPreview } from "@/components/site/website-draft-preview"
import { customDomainUrl, normalizeCustomDomain } from "@/lib/custom-domain"
import { getPublishedWebsiteByCustomDomain } from "@/lib/website-publication"

type CustomDomainWebsitePageProps = {
  params: Promise<{
    domain: string
  }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: CustomDomainWebsitePageProps) {
  const { domain: rawDomain } = await params
  const domain = normalizeCustomDomain(rawDomain)
  const website = domain ? await getPublishedWebsiteByCustomDomain(domain) : null

  return {
    description: website ? "A photography website published with PhotoView.io." : "Photography website not found.",
    title: website ? "Photography Website" : "Website not found | PhotoView.io",
  }
}

export default async function CustomDomainWebsitePage({ params }: CustomDomainWebsitePageProps) {
  const { domain: rawDomain } = await params
  const domain = normalizeCustomDomain(rawDomain)
  const website = domain ? await getPublishedWebsiteByCustomDomain(domain) : null
  if (!domain || !website) notFound()
  if (website.canonicalDomain !== domain) {
    permanentRedirect(customDomainUrl(website.canonicalDomain))
  }

  return (
    <WebsiteDraftPreview
      initialGalleries={website.galleries}
      initialSettings={website.settings}
      mode="published"
      publicUrl={customDomainUrl(domain)}
    />
  )
}
