import { notFound } from "next/navigation"
import { PublicPortfolioGrid } from "@/components/portfolio/public-portfolio-grid"
import { getPublicWorkspacePortfolioGalleries } from "@/lib/portfolio-persistence"

type WorkspacePortfolioPageProps = {
  params: Promise<{ workspaceSlug: string }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: WorkspacePortfolioPageProps) {
  const { workspaceSlug } = await params
  return {
    title: `Photography portfolios | PhotoView.io`,
    description: `Photography portfolios published from ${workspaceSlug} on PhotoView.io.`,
  }
}

export default async function WorkspacePortfolioPage({ params }: WorkspacePortfolioPageProps) {
  const { workspaceSlug } = await params
  const galleries = await getPublicWorkspacePortfolioGalleries(workspaceSlug)
  if (!galleries) notFound()

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-10">
      <header className="mx-auto max-w-[1600px] border-b border-white/10 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d8a84f]">PhotoView.io</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Photography portfolios</h1>
      </header>
      {galleries.length > 0 ? (
        <PublicPortfolioGrid
          allowLocalOverrides={false}
          galleries={galleries}
          visibilityMode="shareable"
        />
      ) : (
        <p className="mx-auto mt-12 max-w-[1600px] text-sm text-white/55">No portfolios are published yet.</p>
      )}
    </main>
  )
}
