import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"

export const metadata = {
  title: "Terms and Conditions | PhotoViewPro",
  description: "PhotoViewPro terms and conditions for subscribers and visitors.",
}

const sections = [
  {
    title: "Use of PhotoViewPro",
    body: "PhotoViewPro provides portfolio publishing, gallery display, storage, sharing, and related subscriber tools for photographers and creative professionals. You are responsible for the content you upload, the accuracy of your account information, and your use of the service.",
  },
  {
    title: "Subscriber accounts",
    body: "Subscribers must provide accurate registration and billing information, keep login access secure, and use the service only for lawful portfolio, gallery, and photography-related purposes. Trial accounts may be limited, modified, or ended if the account is inactive, abusive, or violates these terms.",
  },
  {
    title: "Content ownership",
    body: "You keep ownership of the photographs, text, logos, watermarks, and other materials you upload. By uploading content, you give PhotoViewPro permission to host, process, resize, display, back up, and transmit that content as needed to operate the service.",
  },
  {
    title: "Prohibited content and conduct",
    body: "PhotoViewPro is not a pornography, adult-content staging, illegal-content, harassment, hate, malware, or rights-infringing hosting service. Accounts using the service for prohibited content or unlawful activity may be suspended or closed immediately, with public access disabled.",
  },
  {
    title: "Storage, bandwidth, and fair use",
    body: "Plans may include storage, upload-size, and public-delivery limits. PhotoViewPro may meter usage, send alerts, throttle public delivery, pause public access, or require an upgrade when an account exceeds plan limits or creates unusual service load.",
  },
  {
    title: "Billing and subscriptions",
    body: "Paid subscriptions, trials, upgrades, downgrades, cancellations, taxes, and payment methods are handled through our billing provider. Unless a plan or promotion says otherwise, subscriptions renew automatically until canceled.",
  },
  {
    title: "Service availability",
    body: "We work to keep PhotoViewPro reliable, but no online service is guaranteed to be uninterrupted or error-free. We may update, change, suspend, or discontinue features as the product evolves.",
  },
  {
    title: "Limitation of liability",
    body: "To the fullest extent allowed by law, PhotoViewPro is provided as-is and we are not liable for indirect, incidental, consequential, special, or punitive damages, loss of profit, loss of data, or business interruption arising from use of the service.",
  },
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <SiteHeader />
      <article className="mx-auto max-w-4xl px-6 py-14 md:px-10">
        <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Legal</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Terms and Conditions</h1>
        <p className="mt-4 text-base leading-8 text-[#5f594f]">
          Last updated July 6, 2026. These terms explain the basic rules for using PhotoViewPro as a subscriber, visitor, or account administrator.
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
