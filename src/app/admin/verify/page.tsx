import { Camera, LockKeyhole } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { isSuperAdminSession } from "@/lib/admin-access"
import { hasValidSuperAdminMfa } from "@/lib/admin-mfa"
import { getAdminSmsMfaConfig } from "@/lib/twilio-verify"
import { MfaForm } from "./mfa-form"

function safeNextPath(value: string | undefined) {
  if (!value?.startsWith("/admin") || value.startsWith("/admin/verify") || value.startsWith("//")) return "/admin"
  return value
}

export default async function SuperAdminVerifyPage({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!isSuperAdminSession(session)) redirect("/account")

  const params = await searchParams
  const nextPath = safeNextPath(params?.next)
  const config = getAdminSmsMfaConfig()
  if (await hasValidSuperAdminMfa(session)) redirect(nextPath)

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-5 py-12 text-[#1d1d1b]">
      <section className="w-full max-w-md rounded-lg border border-[#ded6c9] bg-white p-6 shadow-sm">
        <Link className="inline-flex items-center gap-3" href="/">
          <span className="flex size-10 items-center justify-center rounded-md bg-[#d8a84f] text-black"><Camera className="size-5" /></span>
          <span className="font-semibold">PhotoView.io</span>
        </Link>
        <div className="mt-6 flex size-11 items-center justify-center rounded-md bg-[#f2eee7]"><LockKeyhole className="size-5" /></div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#b58835]">SuperAdmin security</p>
        <h1 className="mt-2 text-3xl font-semibold">Confirm it’s you</h1>
        <p className="mt-3 text-sm leading-6 text-[#6b6257]">Your secure email link was accepted. Complete the second step before opening privileged controls.</p>

        {config.enabled && config.ready && config.maskedPhone ? (
          <MfaForm maskedPhone={config.maskedPhone} nextPath={nextPath} />
        ) : (
          <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900" role="alert">
            SuperAdmin SMS verification is unavailable or its private server configuration is incomplete. Access remains blocked until Twilio verification is restored.
          </div>
        )}
      </section>
    </main>
  )
}
