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
            <h1 className="text-xl font-semibold">Congratulations, you are ready.</h1>
            <p className="text-sm text-white/55">Welcome to PhotoViewPro</p>
          </div>
        </div>
        <div className="mt-6 rounded-md border border-white/10 bg-white/[0.03] p-4">
          <CheckCircle2 className="size-5 text-[#d8a84f]" />
          <p className="mt-3 text-sm leading-7 text-white/68">
            You are now ready to start uploading your photography and showing your portfolio the way it was meant to be seen. Over the next few days, we will send tips and ideas to help you get even more from PhotoViewPro.
          </p>
          <p className="mt-3 text-sm leading-7 text-white/68">
            Thanks for subscribing.
            <br />
            The PhotoViewPro team
          </p>
        </div>
        <div className="mt-5">
          <Link className="flex h-12 items-center justify-center rounded-md bg-white text-sm font-semibold text-black hover:bg-white/88" href="/dashboard">
            Start using PhotoViewPro now
          </Link>
        </div>
      </div>
    </main>
  )
}
