import { Camera, ShieldCheck } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Confirm secure login | PhotoView.io",
}

export default function ConfirmMagicLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-5 text-[#1f211e]">
      <div className="w-full max-w-md rounded-md border border-[#ded8cc] bg-white p-6 shadow-[0_18px_55px_rgba(42,48,43,0.10)]">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[#d8a84f] text-black">
            <Camera className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">PhotoView.io login</h1>
            <p className="text-sm text-[#6f685d]">Secure sign-in confirmation</p>
          </div>
        </div>

        <div className="mt-6 rounded-md border border-[#bdd5c8] bg-[#eef7f3] p-4">
          <ShieldCheck className="size-5 text-[#426b58]" />
          <h2 className="mt-3 text-base font-semibold text-[#1d2b22]">Your secure link is ready</h2>
          <p className="mt-2 text-sm leading-6 text-[#4f6258]">
            Select Continue to use this one-time link and open your PhotoView.io dashboard.
          </p>
        </div>

        <form action="/api/auth/magic" className="mt-5" method="post">
          <button className="w-full rounded-md bg-[#1d2b22] px-4 py-3 text-sm font-semibold text-white hover:bg-[#304438]" type="submit">
            Continue to PhotoView.io
          </button>
        </form>

        <p className="mt-4 text-center text-xs leading-5 text-[#6f685d]">
          This confirmation keeps automated email-security checks from using your one-time link before you do.
        </p>
        <Link className="mt-4 block text-center text-sm text-[#6f685d] hover:text-[#1d2b22]" href="/login">
          Request a different login link
        </Link>
      </div>
    </main>
  )
}
