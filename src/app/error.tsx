"use client"

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">PhotoView.io</p>
        <h1 className="mt-4 text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-slate-300">
          Your photos are safe. Try loading this part of PhotoView.io again.
        </p>
        <button
          className="mt-6 rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </section>
    </main>
  )
}
