import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Check, ExternalLink, Minus } from "lucide-react"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"

const platforms = [
  {
    name: "PhotoViewPro",
    bestFor: "Serious photographers who want to store, curate, display, and share their best work",
    pricing: "$1.99-$9.99/mo or $19.99-$99.99/yr",
    storage: "2 GB to 75 GB, with custom plans above 100 GB",
    strengths: ["Portfolio-first display", "Phone import", "AI help", "Embeds", "Simple sharing"],
    tradeoff: "Intentionally not a full wedding, proofing, invoicing, or print-sales suite at launch.",
    source: "/#pricing",
    sourceLabel: "PhotoViewPro pricing",
  },
  {
    name: "Zenfolio",
    bestFor: "Closest all-in-one match: website, galleries, selling, and photographer workflows",
    pricing: "Public pricing commonly runs about $7-$20/mo billed annually, or $9-$40/mo monthly",
    storage: "Plan-dependent storage and business features",
    strengths: ["Websites", "Client galleries", "Selling", "Marketing tools", "Organization"],
    tradeoff: "Broader platform; can feel heavier if you only need a clean portfolio experience.",
    source: "https://zenfolio.com/plans-pricing/",
    sourceLabel: "Zenfolio plans",
  },
  {
    name: "Pixieset",
    bestFor: "Client gallery delivery, favorites, downloads, and print ordering",
    pricing: "Client Gallery starts free; Basic is $8/mo annually or $10/mo monthly",
    storage: "Storage varies by Suite or product plan",
    strengths: ["Client galleries", "Favorites", "Downloads", "Store", "Website and studio tools"],
    tradeoff: "Excellent delivery workflow, but pricing and storage differ by product, so read the plan details carefully.",
    source: "https://pixieset.com/pricing/",
    sourceLabel: "Pixieset pricing",
  },
  {
    name: "ShootProof",
    bestFor: "Client galleries, sales, invoicing, contracts, and business workflow",
    pricing: "Free plan available; paid plans start at $8.33/mo annually or $9.99/mo monthly",
    storage: "Often organized by photo count and plan level",
    strengths: ["Proofing", "Contracts", "Invoices", "Print sales", "Digital delivery"],
    tradeoff: "More business operations than pure portfolio presentation.",
    source: "https://www.shootproof.com/plans/",
    sourceLabel: "ShootProof pricing",
  },
  {
    name: "Pic-Time",
    bestFor: "Premium-feeling client gallery presentation and sales automation",
    pricing: "Free plan available; Beginner is $7/mo annually or $8/mo monthly",
    storage: "Plan-dependent storage, sales, and automation features",
    strengths: ["Gallery presentation", "Store automation", "Sales campaigns", "Client delivery", "Premium feel"],
    tradeoff: "Strong for sales and delivery; may be more system than needed for a simple public portfolio.",
    source: "https://www.pic-time.com/pricing/client-delivery-suite",
    sourceLabel: "Pic-Time pricing",
  },
] as const

const featureRows = [
  ["Portfolio-first public display", true, "Partial", "Partial", "Partial", "Partial"],
  ["Client proofing and favorites", "Later", true, true, true, true],
  ["Print sales / store", "Later", true, true, true, true],
  ["Contracts and invoicing", "Later", "Partial", "Studio tools", true, "Partial"],
  ["Direct phone import to portfolio", true, "Manual", "Manual", "Manual", "Manual"],
  ["Lightroom publishing workflow", true, "Check plan/tools", "Check integrations", "Check integrations", "Check integrations"],
  ["Embed gallery on existing website", true, "Partial", "Partial", "Partial", "Partial"],
  ["AI help inside dashboard", true, false, false, false, false],
] as const

function FeatureCell({ value }: { value: (typeof featureRows)[number][number] }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-2 font-semibold text-[#1d2b22]">
        <Check className="size-4 text-[#d8a84f]" />
        Yes
      </span>
    )
  }

  if (value === false) {
    return (
      <span className="inline-flex items-center gap-2 text-[#8a8175]">
        <Minus className="size-4" />
        No
      </span>
    )
  }

  return <span>{value}</span>
}

export const metadata: Metadata = {
  title: "Portfolio Platform Comparison | PhotoViewPro",
  description:
    "Compare PhotoViewPro with Zenfolio, Pixieset, ShootProof, and Pic-Time for portfolio storage, curation, display, sharing, pricing, and photographer workflows.",
  alternates: {
    canonical: "/portfolio-comparison",
  },
}

export default function PortfolioComparisonPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Portfolio Platform Comparison",
    description: "A comparison of PhotoViewPro, Zenfolio, Pixieset, ShootProof, and Pic-Time for photographers.",
    url: "https://photoviewpro.com/portfolio-comparison",
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <SiteHeader />
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} type="application/ld+json" />
      <section className="border-b border-[#ded8cc] bg-[#f5f1ea] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[#b37a1a]">Portfolio comparison</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
              PhotoViewPro vs. Zenfolio, Pixieset, ShootProof, and Pic-Time.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-[#5f594f]">
              The right platform depends on whether you want a beautiful place to store, curate, display, and share your best work, or whether you need client galleries, print sales, contracts, and studio workflow. PhotoViewPro is intentionally focused on the first job.
            </p>
          </div>
          <p className="mt-6 rounded-md border border-[#ded8cc] bg-white p-4 text-sm leading-6 text-[#6f685d] shadow-sm">
            Pricing snapshot checked July 2026. Competitor pricing and plan limits change often, so use the source links before making a purchase decision.
          </p>
        </div>
      </section>

      <section className="px-6 py-12 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-5">
          {platforms.map((platform) => (
            <article className="rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm" key={platform.name}>
              <h2 className="text-xl font-semibold">{platform.name}</h2>
              <p className="mt-3 text-sm leading-6 text-[#5f594f]">{platform.bestFor}</p>
              <p className="mt-4 text-sm font-semibold text-[#1d2b22]">{platform.pricing}</p>
              <p className="mt-2 text-xs leading-5 text-[#8a8175]">{platform.storage}</p>
              <ul className="mt-4 space-y-2 text-sm text-[#5f594f]">
                {platform.strengths.slice(0, 4).map((strength) => (
                  <li className="flex gap-2" key={strength}>
                    <Check className="mt-0.5 size-4 shrink-0 text-[#d8a84f]" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-5 text-[#8a8175]">{platform.tradeoff}</p>
              <Link
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1d2b22] hover:text-[#9c6f1d]"
                href={platform.source}
                target={platform.source.startsWith("http") ? "_blank" : undefined}
                rel={platform.source.startsWith("http") ? "noreferrer" : undefined}
              >
                {platform.sourceLabel}
                {platform.source.startsWith("http") && <ExternalLink className="size-3" />}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#ded8cc] bg-white px-6 py-12 md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold">Feature comparison</h2>
          <div className="mt-6 overflow-x-auto rounded-md border border-[#ded8cc] shadow-sm">
            <table className="min-w-[980px] border-collapse bg-white text-left text-sm">
              <thead className="bg-[#f5f1ea] text-[#1f211e]">
                <tr>
                  {["Feature", "PhotoViewPro", "Zenfolio", "Pixieset", "ShootProof", "Pic-Time"].map((heading) => (
                    <th className="border-b border-[#ded8cc] px-4 py-3 font-semibold" key={heading}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[#5f594f]">
                {featureRows.map(([feature, photoViewPro, zenfolio, pixieset, shootproof, picTime]) => (
                  <tr className="border-b border-[#e8dfd2] last:border-b-0" key={feature}>
                    <th className="px-4 py-4 font-semibold text-[#1f211e]">{feature}</th>
                    {[photoViewPro, zenfolio, pixieset, shootproof, picTime].map((value, index) => (
                      <td className="px-4 py-4" key={`${feature}-${index}`}>
                        <FeatureCell value={value} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#b37a1a]">Recommendation</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Choose based on the first job you need the platform to do.</h2>
          </div>
          <div className="space-y-3 text-base leading-7 text-[#5f594f]">
            <p>
              Choose PhotoViewPro when the priority is a clean, cinematic place to store, curate, display, and share portfolios that can live as standalone links or be embedded into an existing website.
            </p>
            <p>
              Choose Zenfolio, Pixieset, ShootProof, or Pic-Time when your immediate need is deeper proofing, print sales, contracts, invoices, or full client delivery workflows.
            </p>
            <Link className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1d2b22] px-4 text-sm font-semibold text-white hover:bg-[#26382d]" href="/register">
              Start PhotoViewPro trial
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
