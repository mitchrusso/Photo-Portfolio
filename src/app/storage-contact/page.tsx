import { Database, Mail } from "lucide-react"
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

        <form
          action="mailto:contact@photoviewpro.com"
          className="rounded-md border border-white/10 bg-[#070707] p-5"
          encType="text/plain"
          method="post"
        >
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Name
              <input
                className="h-11 rounded-md border border-white/10 bg-black px-3 text-sm font-normal outline-none focus:border-[#d8a84f]"
                name="name"
                placeholder="Your name"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Website
              <input
                className="h-11 rounded-md border border-white/10 bg-black px-3 text-sm font-normal outline-none focus:border-[#d8a84f]"
                name="website"
                placeholder="https://yourwebsite.com"
                type="url"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Email address
              <input
                className="h-11 rounded-md border border-white/10 bg-black px-3 text-sm font-normal outline-none focus:border-[#d8a84f]"
                name="email"
                placeholder="you@example.com"
                required
                type="email"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Storage needed per year
              <textarea
                className="min-h-36 rounded-md border border-white/10 bg-black px-3 py-3 text-sm font-normal outline-none focus:border-[#d8a84f]"
                name="storage_needed"
                placeholder="Example: I expect to need 50 GB this year for travel, landscape, and family portfolio collections."
                required
              />
            </label>
            <button className="flex h-11 items-center justify-center gap-2 rounded-md bg-white text-sm font-semibold text-black" type="submit">
              <Mail className="size-4" />
              Request custom quote
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/38">
            This form opens your email client for now. We will connect it to the PhotoViewPro lead database when backend messaging is added.
          </p>
        </form>
      </section>
    </main>
  )
}
