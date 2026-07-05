import { Camera, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function RegisterSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
      <div className="w-full max-w-lg rounded-md border border-white/10 bg-[#070707] p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[#d8a84f] text-black">
            <Camera className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Trial activated</h1>
            <p className="text-sm text-white/55">PhotoViewPro subscriber setup</p>
          </div>
        </div>
        <div className="mt-6 rounded-md border border-white/10 bg-white/[0.03] p-4">
          <CheckCircle2 className="size-5 text-[#d8a84f]" />
          <p className="mt-3 text-sm leading-7 text-white/68">
            Stripe has returned a successful checkout session. The production webhook should now mark the subscription as trialing or active, store the Stripe ids, and start onboarding emails.
          </p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link className="flex h-11 items-center justify-center rounded-md bg-white text-sm font-semibold text-black" href="/dashboard">
            Open dashboard
          </Link>
          <Link className="flex h-11 items-center justify-center rounded-md border border-white/15 text-sm font-semibold text-white hover:bg-white/10" href="/">
            Back to site
          </Link>
        </div>
      </div>
    </main>
  )
}
