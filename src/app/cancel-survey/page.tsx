import { Camera } from "lucide-react"
import Link from "next/link"
import { CancellationSurveyForm } from "@/app/cancel-survey/cancel-survey-form"

export const metadata = {
  title: "Cancellation Feedback | PhotoViewPro",
  description: "Tell PhotoViewPro why you canceled.",
}

type CancelSurveyPageProps = {
  searchParams?: Promise<{
    email?: string
    subscription?: string
  }>
}

export default async function CancelSurveyPage({ searchParams }: CancelSurveyPageProps) {
  const params = await searchParams

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-5 py-8 text-[#1d1d1b] md:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="pt-3">
          <Link className="inline-flex items-center gap-3" href="/">
            <span className="flex size-10 items-center justify-center rounded-md bg-[#d8a84f] text-black">
              <Camera className="size-5" />
            </span>
            <span className="font-semibold">PhotoViewPro</span>
          </Link>
          <p className="mt-10 text-sm uppercase tracking-[0.2em] text-[#b58835]">Cancellation feedback</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">One quick question before you go.</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-[#6b6257]">
            Your answer helps us decide what to improve next. If cost, missing features, setup friction, or reliability got in the way, this is the fastest place to tell us.
          </p>
          <div className="mt-6 rounded-md border border-[#ded6c9] bg-white p-4 text-sm leading-6 text-[#6b6257]">
            If you canceled by mistake, you can still return to your account and manage billing from Stripe.
          </div>
        </section>

        <CancellationSurveyForm
          defaultEmail={params?.email ?? ""}
          subscriptionId={params?.subscription ?? ""}
        />
      </div>
    </main>
  )
}
