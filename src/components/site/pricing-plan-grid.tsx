import { Check } from "lucide-react"
import Link from "next/link"

type PricingPlan = {
  annualPrice: number | null
  monthlyPrice: number | null
  name: string
  fit: string
  slug: string
  storage: string
}

const includedFeatures = [
  "Every photography website template",
  "Photo and video portfolios",
  "Custom domains and live embeds",
  "Lightroom and Smart Folder imports",
  "Guided AI help and sharing controls",
]

export function PricingPlanGrid({ billingCycle, plans }: { billingCycle: "annual" | "monthly"; plans: PricingPlan[] }) {
  return (
    <>
      <div className="mx-auto mt-8 flex w-fit rounded-full border border-[#cfc6b8] bg-white p-1" aria-label="Billing frequency">
        {(["annual", "monthly"] as const).map((cycle) => (
          <Link
            aria-current={billingCycle === cycle ? "page" : undefined}
            className={`rounded-full px-5 py-2 text-sm font-semibold ${billingCycle === cycle ? "bg-[#1d2b22] text-white" : "text-[#5f594f]"}`}
            href={cycle === "annual" ? "/pricing" : "/pricing?billing=monthly"}
            key={cycle}
          >
            {cycle === "annual" ? "Annual — save 17%" : "Monthly"}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {plans.map((plan) => {
          const recommended = plan.slug === "growth"
          const price = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice
          return (
            <article
              className={`relative flex flex-col rounded-md border bg-white p-6 shadow-sm ${recommended ? "border-[#c98c29] ring-2 ring-[#d8a84f]/35" : "border-[#ded8cc]"}`}
              key={plan.slug}
            >
              {recommended ? (
                <p className="absolute -top-3 left-5 rounded-full bg-[#1d2b22] px-3 py-1 text-xs font-semibold text-white">Recommended for most photographers</p>
              ) : null}
              <h2 className="text-2xl font-semibold">{plan.name}</h2>
              <p className="mt-1 text-sm font-semibold text-[#76500b]">{plan.storage}</p>
              <p className="mt-3 text-sm leading-6 text-[#6f685d]">{plan.fit}</p>
              <p className="mt-5 text-4xl font-semibold">{price === null ? "Let’s talk" : `$${price.toFixed(2)}`}</p>
              <p className="mt-1 text-sm text-[#6f685d]">{price === null ? "for libraries over 150 GB" : billingCycle === "annual" ? "per year" : "per month"}</p>
              {recommended ? (
                <p className="mt-4 rounded-md bg-[#fff7df] p-3 text-sm leading-6 text-[#59400f]">The complete portfolio and website experience, for less than the cost of one lens filter a month.</p>
              ) : null}
              <ul className="mt-5 flex-1 space-y-3 text-sm leading-6 text-[#4f4a42]">
                {includedFeatures.map((feature) => (
                  <li className="flex gap-2" key={feature}><Check className="mt-1 size-4 shrink-0 text-[#b37a1a]" />{feature}</li>
                ))}
              </ul>
              <Link
                className={`mt-6 inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-semibold ${recommended ? "bg-[#1d2b22] text-white" : "border border-[#b9b0a1] text-[#1d2b22]"}`}
                href={price === null ? "/storage-contact" : `/register?plan=${plan.slug}`}
              >
                {price === null ? "Contact us" : "Start your free trial"}
              </Link>
            </article>
          )
        })}
      </div>
    </>
  )
}
