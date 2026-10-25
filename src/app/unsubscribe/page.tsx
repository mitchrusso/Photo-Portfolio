import { Camera } from "lucide-react"
import Link from "next/link"

import { UnsubscribeForm } from "@/app/unsubscribe/unsubscribe-form"
import { verifyEmailUnsubscribeToken } from "@/lib/email-unsubscribe-token"

export const metadata = {
  description: "Manage PhotoView.io email preferences.",
  title: "Email Preferences | PhotoView.io",
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const token = params?.token ?? ""
  const valid = Boolean(verifyEmailUnsubscribeToken(token))

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-5 py-12 text-[#1d1d1b]">
      <section className="mx-auto max-w-xl rounded-md border border-[#ded6c9] bg-white p-7 shadow-sm">
        <Link className="inline-flex items-center gap-3" href="/">
          <span className="flex size-10 items-center justify-center rounded-md bg-[#d8a84f] text-black">
            <Camera className="size-5" />
          </span>
          <span className="font-semibold">PhotoView.io</span>
        </Link>
        <p className="mt-9 text-sm uppercase tracking-[0.2em] text-[#b58835]">Email preferences</p>
        <h1 className="mt-3 text-3xl font-semibold">Stop tips and product education emails.</h1>
        <p className="mt-4 text-sm leading-7 text-[#6b6257]">
          You can opt out at any time. Essential account, billing, and security notices will continue so you do not miss important activity.
        </p>
        {valid ? (
          <UnsubscribeForm token={token} />
        ) : (
          <p className="mt-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            This unsubscribe link is invalid or has expired.
          </p>
        )}
      </section>
    </main>
  )
}
