import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { RedditPixel } from "@/components/analytics/reddit-pixel"
import { VisitorAnalytics } from "@/components/analytics/visitor-analytics"

const inter = Inter({
  display: "optional",
  variable: "--font-sans",
  subsets: ["latin"],
})

const jetbrainsMono = JetBrains_Mono({
  display: "optional",
  preload: false,
  variable: "--font-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://photoview.io"),
  title: "PhotoView.io",
  description: "A beautiful place for serious photographers to store, curate, display, and share photographs and video.",
  openGraph: {
    description: "A beautiful place for serious photographers to store, curate, display, and share photographs and video.",
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
    description: "A beautiful place for serious photographers to store, curate, display, and share photographs and video.",
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
          id="rybbit-analytics"
          src="https://app.rybbit.io/api/script.js"
          strategy="lazyOnload"
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <VisitorAnalytics />
        <RedditPixel />
      </body>
    </html>
  )
}
