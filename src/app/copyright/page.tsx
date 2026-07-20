import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"

export const metadata = {
  title: "Copyright & DMCA Policy | PhotoView.io",
  description: "PhotoView.io copyright policy, designated DMCA agent, and notice-and-takedown procedure.",
}

const cardClass = "rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm"
const textClass = "mt-3 text-base leading-8 text-[#5f594f]"

export default function CopyrightPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <SiteHeader />
      <article className="mx-auto max-w-4xl px-6 py-14 md:px-10">
        <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Legal</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Copyright &amp; DMCA Policy</h1>
        <p className="mt-4 text-base leading-8 text-[#5f594f]">
          Last updated July 20, 2026. This policy explains ownership of material displayed through PhotoView.io and the procedure for reporting and responding to claimed copyright infringement.
        </p>

        <div className="mt-10 grid gap-5">
          <section className={cardClass}>
            <h2 className="text-xl font-semibold">Subscriber content</h2>
            <p className={textClass}>
              Subscribers retain ownership of the photographs, writing, logos, and other creative materials they upload unless they separately grant rights to someone else. Each subscriber is solely responsible for content published through their account and for having the rights needed to publish it. PhotoView.io provides hosting and publishing tools and does not claim ownership of subscriber content.
            </p>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-semibold">PhotoView.io platform materials</h2>
            <p className={textClass}>
              Copyright © 2026 PhotoView.io. All rights reserved. The PhotoView.io product, software, site design, application interface, product text, icons, graphics, and brand assets are protected by copyright, trademark, and other intellectual-property laws and may not be copied or used to create a confusingly similar service without written permission.
            </p>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-semibold">Designated DMCA agent</h2>
            <p className={textClass}>
              Send copyright notices and counter-notices to PhotoView.io&apos;s designated Copyright Agent using the contact information below. The designation is active in the U.S. Copyright Office&apos;s DMCA Designated Agent Directory under registration number <strong>DMCA-1075905</strong>.
            </p>
            <address className="mt-4 not-italic leading-7 text-[#3d3932]">
              <strong>Copyright Agent</strong><br />
              Mindful Guidance, LLC d/b/a PhotoView.io<br />
              750 North Ocean Blvd, Suite 1410<br />
              Pompano Beach, FL 33062<br />
              Phone: <a className="underline" href="tel:+15083430003">508-343-0003</a><br />
              Email: <a className="underline" href="mailto:support@photoview.io">support@photoview.io</a>
            </address>
            <a
              className="mt-4 inline-flex font-semibold text-[#6f4d12] underline"
              href="https://www.copyright.gov/dmca-directory/"
              rel="noreferrer"
              target="_blank"
            >
              Verify the designation in the official directory
            </a>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-semibold">Submitting a copyright takedown notice</h2>
            <p className={textClass}>A written notice should include substantially all of the following:</p>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-base leading-7 text-[#5f594f]">
              <li>A physical or electronic signature of the copyright owner or a person authorized to act for the owner.</li>
              <li>Identification of the copyrighted work claimed to have been infringed, or a representative list when one notice covers multiple works on one site.</li>
              <li>Identification of the material claimed to be infringing and information reasonably sufficient for PhotoView.io to locate it, including the specific PhotoView.io URL whenever possible.</li>
              <li>Your name, mailing address, telephone number, and email address.</li>
              <li>A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.</li>
              <li>A statement that the information in the notice is accurate and, under penalty of perjury, that you are authorized to act for the copyright owner.</li>
            </ol>
            <p className={textClass}>Email the complete notice to <a className="underline" href="mailto:support@photoview.io?subject=DMCA%20Takedown%20Notice">support@photoview.io</a> with the subject “DMCA Takedown Notice,” or send it to the mailing address above.</p>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-semibold">What happens after a notice</h2>
            <p className={textClass}>
              PhotoView.io will review notices for substantial compliance and may contact the sender for missing information. When appropriate, PhotoView.io will act expeditiously to remove or disable access to the identified material and will take reasonable steps to notify the subscriber who supplied it. A copy of the notice, including the claimant&apos;s contact information, may be provided to that subscriber.
            </p>
            <p className={textClass}>
              If a notice identifies the copyrighted work, the disputed material, and a way to contact the sender but omits another required element, PhotoView.io may contact the sender or take other reasonable steps to help obtain the missing information. Sending a notice does not guarantee removal, and the Copyright Agent does not resolve ownership, licensing, or fair-use disputes.
            </p>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-semibold">Submitting a counter-notice</h2>
            <p className={textClass}>A subscriber who believes material was removed because of mistake or misidentification may send a written counter-notice containing substantially all of the following:</p>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-base leading-7 text-[#5f594f]">
              <li>The subscriber&apos;s physical or electronic signature.</li>
              <li>Identification of the removed or disabled material and the location where it appeared before removal.</li>
              <li>A statement under penalty of perjury that the subscriber has a good-faith belief the material was removed or disabled because of mistake or misidentification.</li>
              <li>The subscriber&apos;s name, address, and telephone number.</li>
              <li>A statement consenting to the jurisdiction of the Federal District Court for the judicial district in which the subscriber&apos;s address is located, or, if the address is outside the United States, for any judicial district in which PhotoView.io may be found, and agreeing to accept service of process from the person who submitted the original notice or that person&apos;s agent.</li>
            </ol>
            <p className={textClass}>Send the complete counter-notice to the Copyright Agent above with the subject “DMCA Counter-Notice.” PhotoView.io may provide it to the original claimant.</p>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-semibold">Restoration after a counter-notice</h2>
            <p className={textClass}>
              After forwarding a substantially compliant counter-notice to the original claimant, PhotoView.io will restore the material or cease disabling access in not less than 10 and not more than 14 business days unless the Copyright Agent first receives notice that the claimant has filed a court action seeking to restrain the subscriber from the allegedly infringing activity, or restoration is otherwise prohibited by law or a separate enforceable platform rule.
            </p>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-semibold">Repeat infringement</h2>
            <p className={textClass}>
              PhotoView.io maintains a policy of terminating, in appropriate circumstances, subscribers and account holders who are repeat infringers. PhotoView.io may also remove or disable access to content, restrict public publishing, preserve relevant records, or suspend an account when necessary to address infringement claims or comply with law.
            </p>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-semibold">Standard technical measures</h2>
            <p className={textClass}>
              PhotoView.io accommodates and does not interfere with standard technical measures used by copyright owners to identify or protect copyrighted works to the extent required by 17 U.S.C. § 512(i). PhotoView.io is not required to monitor subscriber content or affirmatively search for infringement, but it may act when it obtains actual knowledge of infringement or becomes aware of facts or circumstances from which infringing activity is apparent.
            </p>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-semibold">Misrepresentations and legal advice</h2>
            <p className={textClass}>
              Knowingly making a material misrepresentation in a takedown notice or counter-notice may result in liability under applicable law. This page provides PhotoView.io&apos;s reporting procedure and is not legal advice. Consider consulting an attorney if you are unsure whether material infringes a copyright or whether an exception such as fair use applies.
            </p>
          </section>
        </div>
      </article>
      <SiteFooter />
    </main>
  )
}
