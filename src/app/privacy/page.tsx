import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata = {
  title: "PhotoView.io Privacy Policy: Data Use and Security",
  description: "Learn how PhotoView.io collects, uses, stores, and protects data for visitors and subscribers, including payments, analytics, email, and public galleries.",
  alternates: { canonical: "/privacy" },
}

const sections = [
  {
    title: "Information we collect",
    body: "We may collect account details such as name, email address, phone number, website, plan selection, billing status, login activity, storage usage, legal acceptance records, and support or contact messages. Subscribers may also upload photographs, gallery names, captions, watermarks, social links, and portfolio settings.",
  },
  {
    title: "How we use information",
    body: "We use information to provide the service, process trial registrations and subscriptions, send login links and onboarding emails, meter usage, prevent abuse, improve the product, respond to support requests, and communicate important account or billing updates.",
  },
  {
    title: "Payments",
    body: "Payment details are processed by Stripe or another payment provider. PhotoView.io does not store full credit card numbers on its own servers. Billing providers may collect payment, tax, fraud-prevention, and compliance information according to their own policies.",
  },
  {
    title: "Email and automations",
    body: "We may send transactional emails, onboarding messages, trial education, usage alerts, upgrade prompts, and account notices. Marketing messages should include an unsubscribe or preference option when required.",
  },
  {
    title: "Storage and service providers",
    body: "We use service providers for hosting, database storage, file storage, email delivery, payments, analytics, and infrastructure operations. These providers may process data only as needed to operate PhotoView.io.",
  },
  {
    title: "Analytics and advertising measurement",
    body: "PhotoView.io uses analytics tools and the Reddit Pixel to measure page visits, registration-page views, completed registration forms, successful trial activations, campaign performance, and advertising attribution. These tools may receive page, browser, device, network, referrer, cookie, or similar pixel information according to the provider's own privacy terms. PhotoView.io does not send names, email addresses, phone numbers, or subscriber account identifiers through the Reddit Pixel.",
  },
  {
    title: "Public galleries",
    body: "Content that a subscriber marks public may be visible to visitors and shareable through public links, embeds, search previews, and social sharing tools. Subscribers should not publish private, sensitive, or third-party content unless they have the right to do so.",
  },
  {
    title: "Subscriber-published websites",
    body: "This Privacy Policy describes how PhotoView.io processes information as the platform provider. It is not a privacy policy created for an individual subscriber's website. Subscribers are responsible for their website content, external services, and any additional privacy notices or disclosures their own activities require.",
  },
  {
    title: "Data retention and security",
    body: "We use reasonable technical and organizational measures to protect account and gallery data. No system is perfectly secure. We retain information as needed for account operation, legal obligations, backups, abuse prevention, and business records.",
  },
  {
    title: "Your choices",
    body: "Subscribers may update account settings, change public/private gallery status, remove content, cancel subscriptions, and contact us about data questions. Some information may be retained where required for billing, security, dispute, or legal reasons.",
  },
]

export default function PrivacyPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Privacy Policy",
    description: metadata.description,
    dateModified: "2026-07-30",
    publisher: { "@type": "Organization", name: "PhotoView.io", url: "https://photoview.io/" },
    url: "https://photoview.io/privacy",
  }
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <JsonLd data={structuredData} />
      <SiteHeader />
      <article className="mx-auto max-w-4xl px-6 py-14 md:px-10">
        <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Legal</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-base leading-8 text-[#5f594f]">
          Last updated July 30, 2026. This policy explains how PhotoView.io collects, uses, and protects information from visitors, trial users, and subscribers.
        </p>
        <div className="mt-10 grid gap-5">
          {sections.map((section) => (
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
