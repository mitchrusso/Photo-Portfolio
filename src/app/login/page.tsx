import { auth } from "@/auth"
import { Camera, LockKeyhole, Mail } from "lucide-react"
import { MagicLoginForm } from "@/components/auth/magic-login-form"
import Link from "next/link"
import { redirect } from "next/navigation"

type LoginPageProps = {
  searchParams?: Promise<{
    email?: string
    error?: string
    sent?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth()
  const params = await searchParams

  if (session?.user) {
    redirect("/dashboard")
  }

  const linkSent = params?.sent === "1"
  const subscriberEmail = params?.email ?? ""

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-5 text-[#1f211e]">
      <div className="w-full max-w-md rounded-md border border-[#ded8cc] bg-white p-6 shadow-[0_18px_55px_rgba(42,48,43,0.10)]">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[#d8a84f] text-black">
            <Camera className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">PhotoView.io login</h1>
            <p className="text-sm text-[#6f685d]">Subscriber access check</p>
          </div>
        </div>
        {linkSent ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-md border border-[#bdd5c8] bg-[#eef7f3] p-4">
              <Mail className="size-5 text-[#426b58]" />
              <h2 className="mt-3 text-base font-semibold text-[#1d2b22]">Check your inbox</h2>
              <p className="mt-2 text-sm leading-6 text-[#4f6258]">
                If <span className="font-semibold">{subscriberEmail}</span> belongs to an eligible PhotoView.io account, a one-time login link is on its way. Open that email and click the link to enter your dashboard.
              </p>
              <p className="mt-2 text-xs leading-5 text-[#687a70]">The link expires in 15 minutes and can only be used once.</p>
              <p className="mt-2 text-xs leading-5 text-[#687a70]">Delivery can take a few minutes, especially with Yahoo. Use only the newest link if you request another.</p>
            </div>
            <Link
              className="flex h-11 w-full items-center justify-center rounded-md bg-[#1d2b22] text-sm font-semibold text-white hover:bg-[#293d31]"
              href="/dashboard"
            >
              Open dashboard after clicking the link
            </Link>
            <MagicLoginForm defaultEmail={subscriberEmail} resend />
            <Link className="block text-center text-sm text-[#6f685d] hover:text-[#1d2b22]" href="/login">
              Use a different email
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-md border border-[#ead7aa] bg-[#fffaf0] p-4">
              <LockKeyhole className="size-5 text-[#b8862e]" />
              <p className="mt-3 text-sm leading-6 text-[#625948]">
                Enter the email used for your trial or paid subscription. We will send a secure one-time login link to that inbox before opening the dashboard.
              </p>
            </div>
            {params?.error ? (
              <p className="mt-3 rounded-md border border-[#d8a84f]/45 bg-[#fff5d8] px-3 py-2 text-sm text-[#735223]" role="alert">
                {params.error === "email-required"
                  ? "Please enter your subscriber email."
                  : params.error === "trial-canceled"
                      ? "Your trial access has been ended. Start a new registration if you want to continue."
                    : "That secure link is invalid or has expired. Request a fresh link below."}
              </p>
            ) : null}
            <MagicLoginForm defaultEmail={subscriberEmail} />
          </>
        )}
        <Link className="mt-4 block text-center text-sm text-[#6f685d] hover:text-[#1d2b22]" href="/">
          Back to PhotoView.io
        </Link>
      </div>
    </main>
  )
}
