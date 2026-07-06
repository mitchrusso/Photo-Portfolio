import { ShowcasePage } from "@/components/showcase/showcase-page"
import { SiteHeader } from "@/components/site/site-header"
import { seedShowcasePhotos } from "@/lib/showcase-utils"

export const metadata = {
  title: "Showcase | PhotoViewPro",
  description: "Browse curated public photo submissions from PhotoViewPro photographers.",
}

export default function ShowcaseRoute() {
  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader />
      <ShowcasePage photos={seedShowcasePhotos} />
    </main>
  )
}
