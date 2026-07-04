import { Mail, MapPin } from "lucide-react"
import { SiteHeader } from "@/components/site/site-header"

export const metadata = {
  title: "Contact | Mitch Russo Photography",
  description: "Contact Mitch Russo Photography.",
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black text-white">
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
        <form className="rounded-md border border-white/10 bg-white/[0.03] p-5">
          <div className="grid gap-4">
            <input className="h-11 rounded-md border border-white/10 bg-black px-3 text-sm outline-none focus:border-[#d8a84f]" placeholder="Name" />
            <input className="h-11 rounded-md border border-white/10 bg-black px-3 text-sm outline-none focus:border-[#d8a84f]" placeholder="Email" type="email" />
            <input className="h-11 rounded-md border border-white/10 bg-black px-3 text-sm outline-none focus:border-[#d8a84f]" placeholder="Subject" />
            <textarea className="min-h-36 rounded-md border border-white/10 bg-black px-3 py-3 text-sm outline-none focus:border-[#d8a84f]" placeholder="Message" />
            <button className="h-11 rounded-md bg-white text-sm font-semibold text-black" type="button">
              Send message
            </button>
          </div>
          <p className="mt-3 text-xs text-white/38">Form persistence will connect to the contact message database table next.</p>
        </form>
      </section>
    </main>
  )
}
