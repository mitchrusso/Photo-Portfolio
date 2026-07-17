export const metadata = {
  title: "Portfolio embed link incomplete | PhotoView.io",
  description: "This PhotoView.io embed link is missing its photographer workspace.",
  robots: {
    index: false,
    follow: true,
  },
}

export default function EmbedPortfolioPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
      <div>
        <p className="text-lg font-semibold">This embed link is incomplete.</p>
        <p className="mt-2 text-sm text-white/55">Copy a fresh embed code from your PhotoView.io Sharing page.</p>
      </div>
    </main>
  )
}
