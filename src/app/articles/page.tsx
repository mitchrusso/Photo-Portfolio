import { SiteHeader } from "@/components/site/site-header"

const articleSeeds = [
  ["How to Prepare for Cold Weather Photography", "A working checklist for batteries, gloves, lenses, and keeping the camera operating."],
  ["Why I Build the Frame Before I Touch the Settings", "Composition-first field habits for travel and landscape photography."],
  ["Backing Up Photos While Traveling", "A practical workflow for cards, SSDs, cloud storage, and keeping originals safe."],
]

export const metadata = {
  title: "Articles | Mitch Russo Photography",
  description: "Photography articles, gear notes, and travel workflow essays.",
}

export default function ArticlesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader />
      <section className="px-6 py-10 md:px-10">
        <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Articles</p>
        <h1 className="mt-3 text-4xl font-semibold">Photography Writing</h1>
        <p className="mt-3 max-w-2xl text-white/60">This section is structured for daily publishing from the content database.</p>
        <div className="mt-8 grid gap-3">
          {articleSeeds.map(([title, excerpt]) => (
            <article className="rounded-md border border-white/10 bg-white/[0.03] p-5" key={title}>
              <p className="text-xs uppercase tracking-[0.18em] text-white/38">Draft seed</p>
              <h2 className="mt-2 text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/58">{excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
