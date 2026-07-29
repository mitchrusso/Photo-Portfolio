"use client"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="m-0 bg-slate-950 font-sans text-white">
        <main className="flex min-h-screen items-center justify-center px-6">
          <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">PhotoView.io</p>
            <h1 className="mt-4 text-3xl font-semibold">We could not load PhotoView.io</h1>
            <p className="mt-3 text-slate-300">Please try again. Your saved work has not been changed.</p>
            <button
              className="mt-6 rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950"
              onClick={reset}
              type="button"
            >
              Reload PhotoView.io
            </button>
          </section>
        </main>
      </body>
    </html>
  )
}
