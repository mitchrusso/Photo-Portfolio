import type { Metadata } from "next"
import { JsonLd } from "@/components/seo/json-ld"

const registerTitle = "Start Your Photography Portfolio | PhotoView.io"
const registerDescription = "Compare PhotoView.io plans and start building a responsive photography portfolio website with a 14-day trial."

export const metadata: Metadata = {
  alternates: { canonical: "/register" },
  description: registerDescription,
  openGraph: {
    description: registerDescription,
    images: [{ alt: "PhotoView.io photography portfolio website builder", height: 630, url: "/opengraph-image", width: 1200 }],
    title: registerTitle,
    type: "website",
    url: "/register",
  },
  title: registerTitle,
  twitter: {
    card: "summary_large_image",
    description: registerDescription,
    images: ["/opengraph-image"],
    title: registerTitle,
  },
}

export default function RegisterLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    description: registerDescription,
    mainEntity: {
      "@type": "SoftwareApplication",
      applicationCategory: "PhotographyApplication",
      name: "PhotoView.io",
      offers: {
        "@type": "Offer",
        description: "14-day free trial",
        price: "0",
        priceCurrency: "USD",
      },
      operatingSystem: "All",
      url: "https://photoview.io/",
    },
    name: registerTitle,
    url: "https://photoview.io/register",
  }

  return <><JsonLd data={structuredData} />{children}</>
}
