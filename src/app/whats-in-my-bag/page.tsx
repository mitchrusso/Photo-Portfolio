import Link from "next/link"
import { SiteHeader } from "@/components/site/site-header"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata = {
  title: "Photography Field Kit: What's in My Bag and Essential Gear",
  description: "Explore Mitch Russo’s photography field kit, equipment notes, and reviewed gear recommendations, then continue into his travel and fine art portfolio galleries.",
  alternates: { canonical: "/whats-in-my-bag" },
}

export default function WhatsInMyBagPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "What’s in My Bag",
    description: metadata.description,
    author: { "@type": "Person", name: "Mitch Russo" },
    url: "https://photoview.io/whats-in-my-bag",
  }
  return (
    <main className="min-h-screen bg-black text-white">
      <JsonLd data={structuredData} />
      <SiteHeader />
      <section className="px-6 py-10 md:px-10">
        <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Field kit</p>
        <h1 className="mt-3 text-4xl font-semibold">What&apos;s in My Bag</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-white/60">
          Equipment recommendations are published only after each item has been reviewed and approved. Explore the photography portfolio while the next field-kit update is being prepared.
        </p>
        <Link className="mt-8 inline-flex h-11 items-center rounded-md bg-white px-5 text-sm font-semibold text-black" href="/portfolio">
          Explore the portfolio
        </Link>
      </section>
    </main>
  )
}
