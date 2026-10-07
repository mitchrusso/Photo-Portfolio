import type { Metadata } from "next"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"

export const metadata: Metadata = {
  alternates: { canonical: "/accessibility" },
  description: "Read PhotoView.io's accessibility commitment, current conformance goal, known limitations, and how to request assistance.",
  title: "Accessibility Statement | PhotoView.io",
}

export default function AccessibilityPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 py-14 md:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#76500b]">Accessibility</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Accessibility statement</h1>
        <p className="mt-4 leading-8 text-[#514b42]">Last reviewed October 7, 2026.</p>
        <div className="mt-8 space-y-6 leading-8 text-[#514b42]">
          <section>
            <h2 className="text-2xl font-semibold text-[#1f211e]">Our commitment</h2>
            <p className="mt-2">PhotoView.io aims to provide an experience that conforms to WCAG 2.1 Level AA. We test core public and subscriber workflows with automated checks and continue to improve keyboard access, readable contrast, labels, focus behavior, and responsive layouts.</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-[#1f211e]">Current limitations</h2>
            <p className="mt-2">Subscriber-uploaded photographs, videos, captions, colors, and custom website content are controlled by individual subscribers and may not always meet the same accessibility standard. Some complex portfolio presentation templates and third-party checkout or social-login experiences may also vary by browser and assistive technology.</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-[#1f211e]">Get assistance or report a barrier</h2>
            <p className="mt-2">If you cannot access part of PhotoView.io, email <a className="font-semibold underline underline-offset-4" href="mailto:support@photoview.io?subject=Accessibility%20Help">support@photoview.io</a>. Include the page address, what you were trying to do, and the browser or assistive technology you use. We will work with you to provide the information or service in an accessible way.</p>
          </section>
        </div>
      </article>
      <SiteFooter />
    </main>
  )
}
