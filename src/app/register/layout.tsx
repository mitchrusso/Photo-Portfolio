import type { Metadata } from "next"

export const metadata: Metadata = {
  alternates: { canonical: "/register" },
  description: "Compare PhotoView.io plans and start a 14-day trial to build a responsive photography portfolio website with every template and feature included.",
  openGraph: {
    description: "Compare PhotoView.io plans and start building a responsive photography portfolio website with a 14-day trial.",
    title: "Start Your Photography Portfolio | PhotoView.io",
    type: "website",
    url: "/register",
  },
  title: "Start Your Photography Portfolio | PhotoView.io",
}

export default function RegisterLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
