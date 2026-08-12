import Link from "next/link"
import { SiteHeader } from "@/components/site/site-header"
import { JsonLd } from "@/components/seo/json-ld"

const trips = [
  ["Greenland field notes", "Ice, cold weather logistics, and the patience required for reflective water."],
  ["Myanmar temples", "Night photography, ancient sites, and travel pacing."],
  ["Lofoten winter light", "Aurora, snow, coastal roads, and cold-weather camera handling."],
]

export const metadata = {
  title: "Travel Photography Trips and Field Notes by Mitch Russo",
  description: "Explore travel photography field notes from Greenland, Myanmar, and Lofoten, with practical observations about night work, winter light, equipment, and pacing.",
  alternates: { canonical: "/trips" },
}

export default function TripsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Travel Photography Trips and Field Notes",
    description: metadata.description,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: trips.map(([name, description], index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: { "@type": "CreativeWork", name, description, author: { "@type": "Person", name: "Mitch Russo" } },
      })),
    },
    url: "https://photoview.io/trips",
  }
  return (
    <main className="min-h-screen bg-black text-white">
      <JsonLd data={structuredData} />
      <SiteHeader />
      <section className="px-6 py-10 md:px-10">
        <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Trips / Blog</p>
        <h1 className="mt-3 text-4xl font-semibold">Field Notes From the Road</h1>
        <div className="mt-8 grid gap-3">
          {trips.map(([title, excerpt]) => (
            <article className="rounded-md border border-white/10 bg-white/[0.03] p-5" key={title}>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/58">{excerpt}</p>
              <Link className="mt-4 inline-block text-sm font-semibold text-[#d8a84f]" href="/articles">
                Read related articles
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
