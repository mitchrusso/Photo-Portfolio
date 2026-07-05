import { auth } from "@/auth"
import { cookies } from "next/headers"
import { Camera, LockKeyhole } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const session = await auth()

  if (session?.user) {
    redirect("/dashboard")
  }

  async function login() {
    "use server"

    const cookieStore = await cookies()
    cookieStore.set("photoviewpro_subscriber", "demo", {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    redirect("/dashboard")
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
            Temporary prototype access is enabled. When subscriptions are connected, this page will verify the user&apos;s active PhotoViewPro subscription before showing the dashboard.
          </p>
        </div>
        <form action={login}>
          <button className="mt-5 h-11 w-full rounded-md bg-white text-sm font-semibold text-black" type="submit">
            Continue to subscriber dashboard
          </button>
        </form>
        <Link className="mt-4 block text-center text-sm text-white/55 hover:text-white" href="/">
          Back to PhotoViewPro
        </Link>
      </div>
    </main>
  )
}
