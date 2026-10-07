import type { Metadata } from "next"
import { PrivacyChoiceControls } from "@/components/privacy/privacy-choice-controls"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"

export const metadata: Metadata = {
  alternates: { canonical: "/privacy-choices" },
  description: "Manage optional analytics and advertising preferences for PhotoView.io and learn how Global Privacy Control is honored.",
  robots: { follow: true, index: false },
  title: "Privacy Choices | PhotoView.io",
}

export default function PrivacyChoicesPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 py-14 md:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#76500b]">Privacy</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Your privacy choices</h1>
        <p className="mt-4 leading-8 text-[#514b42]">
          Choose whether PhotoView may use optional analytics and advertising measurement. Essential cookies used for authentication, security, checkout, and remembering this choice cannot be disabled through this page.
        </p>
        <div className="mt-8"><PrivacyChoiceControls /></div>
        <section className="mt-8 rounded-md border border-[#ded8cc] bg-white p-6">
          <h2 className="text-2xl font-semibold">Data and deletion requests</h2>
          <p className="mt-3 leading-7 text-[#514b42]">
            Email <a className="font-semibold underline underline-offset-4" href="mailto:support@photoview.io?subject=Privacy%20Request">support@photoview.io</a> to request access, correction, export, or deletion of personal information associated with your account. We may verify your identity before completing the request.
          </p>
        </section>
      </article>
      <SiteFooter />
    </main>
  )
}
