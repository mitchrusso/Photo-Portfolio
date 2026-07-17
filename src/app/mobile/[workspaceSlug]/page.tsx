import { notFound } from "next/navigation"
import { PublicPortfolioGrid } from "@/components/portfolio/public-portfolio-grid"
import { getPublicWorkspacePortfolioGalleries } from "@/lib/portfolio-persistence"

type MobilePortfolioPageProps = {
  params: Promise<{
    workspaceSlug: string
  }>
  searchParams: Promise<{
    galleries?: string | string[]
  }>
}

export const dynamic = "force-dynamic"

function selectedGallerySlugs(value: string | string[] | undefined) {
  if (value === undefined) return undefined
  const joined = Array.isArray(value) ? value.join(",") : value
  return Array.from(new Set(joined.split(",").map((slug) => slug.trim()).filter(Boolean))).slice(0, 100)
}

export default async function MobilePortfolioPage({ params, searchParams }: MobilePortfolioPageProps) {
  const [{ workspaceSlug }, query] = await Promise.all([params, searchParams])
  const galleries = await getPublicWorkspacePortfolioGalleries(
    workspaceSlug,
    selectedGallerySlugs(query.galleries),
  )
  if (galleries === null) notFound()

  return (
    <main className="min-h-screen bg-black px-3 py-5 text-white sm:px-5">
      <header className="mx-auto max-w-5xl border-b border-white/10 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d8a84f]">PhotoView.io</p>
        <h1 className="mt-2 text-2xl font-semibold">Mobile companion</h1>
        <p className="mt-2 text-sm text-white/60">A phone-friendly view of the portfolios selected by this photographer.</p>
      </header>

      <section className="mx-auto max-w-5xl">
        {galleries.length > 0 ? (
          <PublicPortfolioGrid
            allowLocalOverrides={false}
            galleries={galleries}
            visibilityMode="shareable"
          />
        ) : (
          <div className="mt-8 rounded-md border border-white/10 p-6 text-sm text-white/65">
            No portfolios were included in this mobile companion link.
          </div>
        )}
      </section>
    </main>
  )
}
