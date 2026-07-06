import { auth } from "@/auth"
import { Camera, LockKeyhole, Mail } from "lucide-react"
import { requestMagicLogin } from "@/lib/magic-login"
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

  async function login(formData: FormData) {
    "use server"

    const email = String(formData.get("email") ?? "").trim().toLowerCase()

    if (!email) {
      redirect("/login?error=email-required")
    }

    const result = await requestMagicLogin(email)

    if (result.status === "invalid_subscriber") {
      redirect(`/login?error=invalid-subscriber&email=${encodeURIComponent(email)}`)
    }

    if (result.status === "email_failed") {
      redirect(`/login?error=email-failed&email=${encodeURIComponent(email)}`)
    }

    redirect(`/login?sent=1&email=${encodeURIComponent(email)}`)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
      <div className="w-full max-w-md rounded-md border border-white/10 bg-[#070707] p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[#d8a84f] text-black">
            <Camera className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">PhotoViewPro login</h1>
            <p className="text-sm text-white/55">Subscriber access check</p>
          </div>
        </div>
        <div className="mt-6 rounded-md border border-white/10 bg-white/[0.03] p-4">
          <LockKeyhole className="size-5 text-[#d8a84f]" />
          <p className="mt-3 text-sm leading-6 text-white/62">
            Enter the email used for your trial or paid subscription. We will send a secure one-time login link to that inbox before opening the dashboard.
          </p>
        </div>
        <form action={login}>
          <label className="mt-5 block text-sm font-medium text-white/75" htmlFor="email">
            Subscriber email
          </label>
          <div className="mt-2 flex h-12 items-center gap-3 rounded-md border border-white/12 bg-white/[0.04] px-3">
            <Mail className="size-4 text-white/45" />
            <input
              className="h-full flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              defaultValue={params?.email ?? ""}
              id="email"
              name="email"
              placeholder="you@example.com"
              type="email"
            />
          </div>
          {params?.sent ? (
            <p className="mt-3 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
              Check your inbox for a secure PhotoViewPro login link. It expires in 15 minutes and can only be used once.
            </p>
          ) : null}
          {params?.error ? (
            <p className="mt-3 rounded-md border border-[#d8a84f]/30 bg-[#d8a84f]/10 px-3 py-2 text-sm text-[#f0cc7d]">
              {params.error === "email-required"
                ? "Please enter your subscriber email."
                : params.error === "email-failed"
                  ? "We found your subscription, but could not send the login email. Please try again in a moment."
                  : params.error === "trial-canceled"
                    ? "Your trial access has been ended. Start a new registration if you want to continue."
                  : "We could not find an active trial or subscription for that email."}
            </p>
          ) : null}
          <button className="mt-5 h-11 w-full rounded-md bg-white text-sm font-semibold text-black hover:bg-white/85" type="submit">
            Send secure login link
          </button>
        </form>
        <Link className="mt-4 block text-center text-sm text-white/55 hover:text-white" href="/">
          Back to PhotoViewPro
        </Link>
      </div>
    </main>
  )
}
