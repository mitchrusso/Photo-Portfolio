import type { Metadata } from "next"
import { LifeBuoy, Mail } from "lucide-react"
import { ContactForm } from "@/components/contact/contact-form"
import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata: Metadata = {
  title: "Contact PhotoView.io Support and Product Team",
  description: "Contact PhotoView.io for subscriber support, product questions, partnerships, billing help, photography portfolio publishing, or website guidance.",
  alternates: { canonical: "/contact" },
  openGraph: {
    description: "Contact PhotoView.io for product questions, subscriber support, partnerships, billing help, and photography portfolio guidance.",
    title: "Contact PhotoView.io",
    type: "website",
    url: "/contact",
  },
}

export default function ContactPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact PhotoView.io",
    description: metadata.description,
    mainEntity: {
      "@type": "Organization",
      name: "PhotoView.io",
      email: "support@photoview.io",
      url: "https://photoview.io/",
    },
    url: "https://photoview.io/contact",
  }
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <JsonLd data={structuredData} />
      <SiteHeader />
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:px-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#b37a1a]">Contact PhotoView.io</p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">How can we help?</h1>
          <p className="mt-4 max-w-xl leading-8 text-[#5f594f]">
            Ask about your account, portfolio publishing, website setup, billing, storage, partnerships, or any PhotoView.io product question.
          </p>
          <div className="mt-8 space-y-3 rounded-md border border-[#ded8cc] bg-white p-5 text-sm text-[#5f594f]">
            <p className="flex items-center gap-3"><Mail className="size-4 text-[#b37a1a]" /> support@photoview.io</p>
            <p className="flex items-center gap-3"><LifeBuoy className="size-4 text-[#b37a1a]" /> Subscriber and product support</p>
          </div>
        </div>
        <ContactForm
          buttonClassName="h-11 rounded-md bg-[#1d2b22] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          className="grid gap-4 rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm"
          fieldClassName="h-11 rounded-md border border-[#d7cec0] bg-[#fbfaf7] px-3 text-sm font-normal outline-none focus:border-[#b37a1a]"
          messagePlaceholder="Tell us what you need help with."
          submitLabel="Send to PhotoView.io"
        />
      </section>
      <SiteFooter />
    </main>
  )
}
