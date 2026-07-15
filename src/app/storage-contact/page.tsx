import { Database } from "lucide-react"
import { ContactForm } from "@/components/contact/contact-form"
import { SiteHeader } from "@/components/site/site-header"

export const metadata = {
  title: "Custom Storage | PhotoViewPro",
  description: "Request custom PhotoViewPro storage pricing above 100 GB.",
}

export default function StorageContactPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader />
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:px-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Custom storage</p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Need more than 100 GB?</h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-white/62">
            Please tell us how much storage per year you need and we will get back to you shortly with the costs.
          </p>
          <div className="mt-8 rounded-md border border-white/10 bg-white/[0.03] p-5">
            <Database className="size-5 text-[#d8a84f]" />
            <p className="mt-3 text-sm leading-6 text-white/58">
              Custom plans are intended for high-volume photographers, serious portfolio builders, and subscribers who want more room to preserve originals, organize long-term collections, or support heavier public viewing.
            </p>
          </div>
        </div>

        <ContactForm
          buttonClassName="h-11 rounded-md bg-white text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
          className="grid gap-4 rounded-md border border-white/10 bg-[#070707] p-5"
          defaultSubject="Custom storage quote"
          messageLabel="Storage needed per year"
          messagePlaceholder="Example: I expect to need 50 GB this year for travel, landscape, and family portfolio collections."
          submitLabel="Request custom quote"
        />
      </section>
    </main>
  )
}
