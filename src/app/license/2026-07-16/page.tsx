import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import {
  SUBSCRIBER_LICENSE_EFFECTIVE_DATE,
  SUBSCRIBER_LICENSE_SECTIONS,
  SUBSCRIBER_LICENSE_VERSION,
} from "@/lib/subscriber-license"

export const metadata = {
  title: "Subscriber License Agreement | PhotoView.io",
  description: "The PhotoView.io subscriber license agreement.",
}

export default function SubscriberLicensePage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <SiteHeader />
      <article className="mx-auto max-w-4xl px-6 py-14 md:px-10">
        <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Legal</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Subscriber License Agreement</h1>
        <p className="mt-4 text-base leading-8 text-[#5f594f]">
          Effective {SUBSCRIBER_LICENSE_EFFECTIVE_DATE}. Version {SUBSCRIBER_LICENSE_VERSION}. This agreement explains the license granted to each PhotoView.io subscriber and how electronic acceptance works.
        </p>
        <div className="mt-6 rounded-md border border-[#e0bd69] bg-[#fff8e8] p-5 text-sm leading-7 text-[#5f594f]">
          Please read this agreement before registering. The registration checkbox is not preselected; selecting it and submitting the form records your name, acceptance time, and this agreement version.
        </div>
        <div className="mt-10 grid gap-5">
          {SUBSCRIBER_LICENSE_SECTIONS.map((section) => (
            <section className="rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm" key={section.title}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-3 text-base leading-8 text-[#5f594f]">{section.body}</p>
            </section>
          ))}
        </div>
      </article>
      <SiteFooter />
    </main>
  )
}
