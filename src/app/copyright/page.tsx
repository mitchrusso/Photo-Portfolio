import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"

export const metadata = {
  title: "Copyright Notice | PhotoView.io",
  description: "PhotoView.io copyright notice and infringement reporting policy.",
}

export default function CopyrightPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f211e]">
      <SiteHeader />
      <article className="mx-auto max-w-4xl px-6 py-14 md:px-10">
        <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Legal</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Copyright Notice</h1>
        <p className="mt-4 text-base leading-8 text-[#5f594f]">
          Copyright © 2026 PhotoView.io. All rights reserved. PhotoView.io, the PhotoView.io name, site design, application interface, copy, graphics, and software are protected by copyright, trademark, and other intellectual property laws.
        </p>

        <div className="mt-10 grid gap-5">
          <section className="rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Subscriber photography</h2>
            <p className="mt-3 text-base leading-8 text-[#5f594f]">
              Photographers and subscribers retain ownership of the photos and creative materials they upload to their own portfolios, unless they separately grant rights to someone else. Visitors may not copy, download, redistribute, scrape, resell, or reuse subscriber images unless the subscriber has clearly allowed that use.
            </p>
          </section>

          <section className="rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Platform materials</h2>
            <p className="mt-3 text-base leading-8 text-[#5f594f]">
              The PhotoView.io product, code, layout, product text, icons, brand assets, and marketing presentation may not be copied, modified, sold, or used to create a confusingly similar service without written permission.
            </p>
          </section>

          <section className="rounded-md border border-[#ded8cc] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Copyright concerns</h2>
            <p className="mt-3 text-base leading-8 text-[#5f594f]">
              If you believe content hosted on PhotoView.io infringes your copyright, contact us with the gallery URL, a description of the work, proof that you own or represent the rights, your contact information, and a statement that the claim is accurate.
            </p>
          </section>
        </div>
      </article>
      <SiteFooter />
    </main>
  )
}
