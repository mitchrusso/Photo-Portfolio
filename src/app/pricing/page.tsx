import type { Metadata } from "next"
import { PricingPlanGrid } from "@/components/site/pricing-plan-grid"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { ThirdPartyValidationStrip } from "@/components/site/third-party-validation-strip"
import { marketingFaqs, marketingFaqStructuredData } from "@/data/marketing-faqs"
import { formatPlanStorage, subscriberPlans } from "@/lib/plans"
import { SELECTABLE_WEBSITE_TEMPLATE_IDS } from "@/lib/website-builder-rules"

const title = "PhotoView Pricing for Photography Portfolios"
const description = "Compare PhotoView storage plans. Every plan includes the complete photography website builder, portfolio templates, custom domains, photo and video portfolios, Lightroom imports, and a 14-day free trial."

export const metadata: Metadata = {
  alternates: { canonical: "/pricing" },
  description,
  openGraph: {
    description,
    images: [{ alt: "PhotoView pricing for photographers", height: 630, url: "/opengraph-image", width: 1200 }],
    siteName: "PhotoView.io",
    title,
    type: "website",
    url: "https://photoview.io/pricing",
  },
  title,
  twitter: { card: "summary_large_image", description, images: ["/opengraph-image"], title },
}

const plans = [
  ...subscriberPlans.map((plan) => ({
    annualPrice: plan.annualPriceCents / 100,
    monthlyPrice: plan.monthlyPriceCents / 100,
    name: plan.name,
    fit: {
      starter: "For a focused first portfolio and website.",
      growth: "For an active photographer with several bodies of work.",
      studio: "For a growing catalog of photographs and video.",
      premier: "For a large, regularly updated portfolio library.",
    }[plan.slug],
    slug: plan.slug,
    storage: formatPlanStorage(plan.storageLimitBytes),
  })),
  { annualPrice: null, fit: "For established archives that need a tailored storage plan.", monthlyPrice: null, name: "Custom", slug: "custom", storage: "More than 150 GB" },
]

const pricingStructuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  applicationCategory: "Photography Website Builder",
  name: "PhotoView",
  offers: subscriberPlans.flatMap((plan) => [
    {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      description: `${formatPlanStorage(plan.storageLimitBytes)} storage, billed monthly after a 14-day free trial`,
      name: `${plan.name} monthly`,
      price: (plan.monthlyPriceCents / 100).toFixed(2),
      priceCurrency: "USD",
      url: `https://photoview.io/register?plan=${plan.slug}`,
    },
    {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      description: `${formatPlanStorage(plan.storageLimitBytes)} storage, billed annually after a 14-day free trial`,
      name: `${plan.name} annual`,
      price: (plan.annualPriceCents / 100).toFixed(2),
      priceCurrency: "USD",
      url: `https://photoview.io/register?plan=${plan.slug}`,
    },
  ]),
  operatingSystem: "All",
  url: "https://photoview.io/pricing",
}

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ billing?: string }> }) {
  const billingCycle = (await searchParams).billing === "monthly" ? "monthly" : "annual"
  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#1f211e]">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingStructuredData).replace(/</g, "\\u003c") }} type="application/ld+json" />
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(marketingFaqStructuredData("https://photoview.io/pricing")).replace(/</g, "\\u003c") }} type="application/ld+json" />
      <SiteHeader />
      <section className="border-b border-[#ded8cc] bg-[linear-gradient(115deg,#edf8f4_0%,#fff8f3_52%,#f4f1fa_100%)] px-6 py-16 text-center md:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#76500b]">Simple portfolio pricing</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">Choose your storage. Every creative tool comes with it.</h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[#5f594f]">
            Every plan includes all {SELECTABLE_WEBSITE_TEMPLATE_IDS.length} website designs, custom domains, photo and video portfolios, Lightroom and Smart Folder imports, live embeds, and guided help.
          </p>
          <p className="mt-4 font-semibold text-[#1d2b22]">Build and publish free for 14 days. Cancel before day 14 and pay nothing.</p>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10">
        <div className="mx-auto max-w-7xl">
          <PricingPlanGrid billingCycle={billingCycle} plans={plans} />
          <div className="mt-8 grid gap-4 rounded-md border border-[#ded8cc] bg-white p-6 text-sm leading-7 text-[#5f594f] shadow-sm md:grid-cols-3">
            <p><strong className="text-[#1f211e]">One complete product.</strong><br />Plans differ by storage, not by which website, portfolio, sharing, or import tools you can use.</p>
            <p><strong className="text-[#1f211e]">More than one website.</strong><br />Your first live website is included. Additional activated websites are $1.29 per month each; drafts are free.</p>
            <p><strong className="text-[#1f211e]">Straightforward billing.</strong><br />Stripe securely handles payment details. PhotoView does not store your raw card number.</p>
          </div>
        </div>
      </section>

      <section className="border-t border-[#ded8cc] bg-white px-6 py-16 md:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#76500b]">Pricing questions</p>
          <h2 className="mt-3 text-center text-3xl font-semibold md:text-4xl">Know exactly what happens before you begin.</h2>
          <div className="mt-8 grid gap-3">
            {marketingFaqs.slice(1, 6).map(({ answer, question }) => (
              <details className="rounded-md border border-[#ded8cc] bg-[#fbfaf7] p-5" key={question}>
                <summary className="cursor-pointer list-none pr-6 text-lg font-semibold">{question}</summary>
                <p className="mt-3 leading-7 text-[#5f594f]">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <ThirdPartyValidationStrip placement="pricing" />
      <SiteFooter />
    </main>
  )
}
