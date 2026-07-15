import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { accountFilePolicy } from "@/lib/account-policy"

export const metadata = {
  title: "Terms and Conditions | PhotoView.io",
  description: "PhotoView.io terms and conditions for subscribers and visitors.",
}

const sections = [
  {
    title: "Use of PhotoView.io",
    body: "PhotoView.io provides portfolio publishing, gallery display, storage, sharing, and related subscriber tools for photographers and creative professionals. You are responsible for the content you upload, the accuracy of your account information, and your use of the service.",
  },
  {
    title: "Subscriber accounts",
    body: "Subscribers must provide accurate registration and billing information, keep login access secure, and use the service only for lawful portfolio, gallery, and photography-related purposes. Trial accounts may be limited, modified, or ended if the account is inactive, abusive, or violates these terms.",
  },
  {
    title: "Content ownership",
    body: "You keep ownership of the photographs, text, logos, watermarks, and other materials you upload. By uploading content, you give PhotoView.io permission to host, process, resize, display, back up, and transmit that content as needed to operate the service.",
  },
  {
    title: "Prohibited content and conduct",
    body: "PhotoView.io is not a pornography, adult-content staging, illegal-content, harassment, hate, malware, or rights-infringing hosting service. Accounts using the service for prohibited content or unlawful activity may be suspended or closed immediately, with public access disabled.",
  },
  {
    title: "Storage and fair use",
    body: "Plans include storage capacity. PhotoView.io may measure stored data, send alerts, pause new uploads, or require an upgrade when an account exceeds its storage capacity. We may apply reasonable safeguards to abusive or unlawful activity to protect service reliability.",
  },
  {
    title: "Billing and subscriptions",
    body: "Paid subscriptions, trials, upgrades, downgrades, cancellations, taxes, and payment methods are handled through our billing provider. Unless a plan or promotion says otherwise, subscriptions renew automatically until canceled.",
  },
  {
    title: "Referral storage bonuses",
    body: "When an eligible referred trial first converts to a paid subscription, the referring subscriber receives a one-time 1 GB storage-capacity bonus. The bonus does not renew annually, does not add free subscription months, has no cash value, and cannot be transferred. Earned capacity remains available while the referring PhotoView.io account is active and in good standing.",
  },
  {
    title: "Canceled accounts, failed payments, and file retention",
    body: "PhotoView.io does not continue publicly hosting portfolios, embeds, downloads, or sharing links after paid access ends. The detailed cancellation and file-retention process below explains what happens to subscriber files when a trial is canceled, a subscription ends, or a payment method fails.",
  },
  {
    title: "Service availability",
    body: "We work to keep PhotoView.io reliable, but no online service is guaranteed to be uninterrupted or error-free. We may update, change, suspend, or discontinue features as the product evolves.",
  },
  {
    title: "Limitation of liability",
    body: "To the fullest extent allowed by law, PhotoView.io is provided as-is and we are not liable for indirect, incidental, consequential, special, or punitive damages, loss of profit, loss of data, or business interruption arising from use of the service.",
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
          Last updated July 11, 2026. These terms explain the basic rules for using PhotoView.io as a subscriber, visitor, or account administrator.
        </p>
        <div className="mt-10 grid gap-5">
          {sections.map((section) => (
            <section className="rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm" key={section.title}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-3 text-base leading-8 text-[#5f594f]">{section.body}</p>
              {section.title === "Canceled accounts, failed payments, and file retention" ? (
                <div className="mt-5 grid gap-3">
                  {accountFilePolicy.map((item) => (
                    <div className="rounded-md border border-[#eee7dc] bg-[#fbfaf7] p-4" key={item.title}>
                      <h3 className="text-base font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#5f594f]">{item.body}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </article>
      <SiteFooter />
    </main>
  )
}
