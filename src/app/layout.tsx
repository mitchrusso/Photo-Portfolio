import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
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
