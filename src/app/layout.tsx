import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { VisitorAnalytics } from "@/components/analytics/visitor-analytics"
import { SubscriberFeedback } from "@/components/feedback/subscriber-feedback"
import { SessionProvider } from "@/components/providers/session-provider"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://photoview.io"),
  title: "PhotoView.io",
  description: "A beautiful place for serious photographers to store, curate, display, and share their best work.",
  openGraph: {
    description: "A beautiful place for serious photographers to store, curate, display, and share their best work.",
    images: [
      {
        alt: "PhotoView.io — a beautiful home for the photography you care about most",
        height: 630,
        url: "/opengraph-image",
        width: 1200,
      },
    ],
    siteName: "PhotoView.io",
    title: "PhotoView.io",
    type: "website",
    url: "https://photoview.io",
  },
  twitter: {
    card: "summary_large_image",
    description: "A beautiful place for serious photographers to store, curate, display, and share their best work.",
    images: ["/opengraph-image"],
    title: "PhotoView.io",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          data-site-id="e89f75506464"
          defer
          src="https://app.rybbit.io/api/script.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <SessionProvider>
          {children}
          <SubscriberFeedback />
          <VisitorAnalytics />
        </SessionProvider>
      </body>
    </html>
  )
}
