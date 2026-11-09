import { ShowcasePage } from "@/components/showcase/showcase-page"
import { SiteHeader } from "@/components/site/site-header"
import { getPrismaClient } from "@/lib/db"
import { SUBSCRIBER_SHOWCASE_ENABLED } from "@/lib/release-flags"
import type { ShowcasePhoto } from "@/lib/showcase-utils"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"
export const metadata = {
  alternates: { canonical: "/showcase" },
  description: "Discover photographs that PhotoView.io subscribers have chosen to share publicly.",
  title: "Subscriber Photography Showcase | PhotoView.io",
}

export default async function ShowcaseRoute() {
  if (!SUBSCRIBER_SHOWCASE_ENABLED) notFound()

  const prisma = getPrismaClient()
  const submissions = await prisma.showcaseSubmission.findMany({
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    take: 300,
    where: { status: { in: ["APPROVED", "FEATURED"] } },
  })
  const photos: ShowcasePhoto[] = submissions.map((submission) => ({
    category: submission.category as ShowcasePhoto["category"],
    comments: 0,
    id: submission.id,
    imageUrl: `/api/media/${encodeURIComponent(submission.gallerySlug)}/${encodeURIComponent(submission.photoId)}?variant=display`,
    location: submission.location ?? undefined,
    photographer: submission.photographer,
    portfolioId: submission.gallerySlug,
    portfolioName: submission.portfolioName,
    status: submission.status === "FEATURED" ? "Featured" : "Approved",
    submittedAt: submission.createdAt.toISOString(),
    tags: Array.isArray(submission.tags) ? submission.tags.filter((tag): tag is string => typeof tag === "string") : [],
    thumbnailUrl: `/api/media/${encodeURIComponent(submission.gallerySlug)}/${encodeURIComponent(submission.photoId)}?variant=thumbnail`,
    title: submission.title,
    votes: 0,
    workspaceSlug: submission.workspaceSlug,
  }))

  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader />
      <ShowcasePage photos={photos} />
    </main>
  )
}
