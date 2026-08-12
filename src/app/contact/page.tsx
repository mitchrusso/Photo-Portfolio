import { Mail, MapPin } from "lucide-react"
import { ContactForm } from "@/components/contact/contact-form"
import { SiteHeader } from "@/components/site/site-header"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata = {
  title: "Contact Mitch Russo Photography for Project Inquiries",
  description: "Contact Mitch Russo Photography about prints, licensing, speaking, travel questions, or photography projects. Available worldwide for serious inquiries.",
  alternates: { canonical: "/contact" },
}

export default function ContactPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Mitch Russo Photography",
    description: metadata.description,
    mainEntity: {
      "@type": "Person",
      name: "Mitch Russo",
      email: "contact@mitchrussophotography.com",
    },
    url: "https://photoview.io/contact",
  }
  return (
    <main className="min-h-screen bg-black text-white">
      <JsonLd data={structuredData} />
      <SiteHeader />
      <section className="grid gap-8 px-6 py-10 md:px-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Contact</p>
          <h1 className="mt-3 text-4xl font-semibold">Let&apos;s Talk Photography</h1>
          <p className="mt-4 max-w-xl text-white/60">
            Use this page for print inquiries, licensing, speaking, travel questions, or project conversations.
          </p>
          <div className="mt-8 space-y-3 text-sm text-white/62">
            <p className="flex items-center gap-3"><Mail className="size-4 text-[#d8a84f]" /> contact@mitchrussophotography.com</p>
            <p className="flex items-center gap-3"><MapPin className="size-4 text-[#d8a84f]" /> Available worldwide</p>
          </div>
        </div>
        <ContactForm className="grid gap-4 rounded-md border border-white/10 bg-white/[0.03] p-5" />
      </section>
    </main>
  )
}
