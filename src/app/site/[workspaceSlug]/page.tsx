import { notFound } from "next/navigation"

import { WebsiteDraftPreview } from "@/components/site/website-draft-preview"
import { getPublicSiteUrl } from "@/lib/site-domain"
import { getPublishedWebsite } from "@/lib/website-publication"

type PublishedWebsitePageProps = {
  params: Promise<{
    workspaceSlug: string
  }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PublishedWebsitePageProps) {
  const { workspaceSlug } = await params
  const website = await getPublishedWebsite(workspaceSlug)

  return {
    description: website ? "A photography website published with PhotoView.io." : "Photography website not found.",
    title: website ? "Photography Website | PhotoView.io" : "Website not found | PhotoView.io",
  }
}

export default async function PublishedWebsitePage({ params }: PublishedWebsitePageProps) {
  const { workspaceSlug } = await params
  const website = await getPublishedWebsite(workspaceSlug)
  if (!website) notFound()

  return (
    <WebsiteDraftPreview
      initialGalleries={website.galleries}
      initialSettings={website.settings}
      mode="published"
      publicUrl={getPublicSiteUrl(workspaceSlug) || `/site/${encodeURIComponent(workspaceSlug)}`}
    />
  )
}
