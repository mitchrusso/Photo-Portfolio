export type MarketingSolution = {
  slug: string
  eyebrow: string
  title: string
  description: string
  promise: string
  image: string
  imageAlt: string
  steps: Array<{ title: string; body: string }>
  benefits: Array<{ title: string; body: string }>
  faqs: Array<{ question: string; answer: string }>
  relatedArticle: { href: string; label: string }
}

export const marketingSolutions: MarketingSolution[] = [
  {
    slug: "lightroom-portfolio-website",
    eyebrow: "Lightroom to portfolio",
    title: "Publish a photography portfolio directly from Lightroom",
    description: "Move finished photographs from Lightroom Classic into a responsive PhotoView.io portfolio without rebuilding the gallery by hand.",
    promise: "Your edit is finished. Your publishing workflow should be, too.",
    image: "/marketing-preview/gallery-greenland.webp",
    imageAlt: "Responsive PhotoView.io landscape photography portfolio",
    steps: [
      { title: "Choose the finished photographs", body: "Keep editing and selection where they already happen: inside Lightroom Classic." },
      { title: "Send them to PhotoView.io", body: "Use the PhotoView.io Lightroom plugin to create a portfolio or add to an existing one." },
      { title: "Curate and publish", body: "Choose the cover, order the work, hide weaker frames, add captions, and publish the responsive result." },
    ],
    benefits: [
      { title: "Less duplicate work", body: "Skip the export-folder-upload-rebuild loop every time a portfolio changes." },
      { title: "A site made for photographs", body: "Present full-screen images, video, captions, and curated series without feed clutter." },
      { title: "One source, many destinations", body: "Share a clean portfolio link or embed the same live work on an existing website." },
    ],
    faqs: [
      { question: "Does PhotoView.io replace Lightroom?", answer: "No. Lightroom remains your editing and selection tool. PhotoView.io is the publishing and presentation layer for finished work." },
      { question: "Can I update an existing portfolio?", answer: "Yes. The Lightroom workflow can add finished photographs to an existing PhotoView.io portfolio." },
      { question: "Can I try it before paying?", answer: "Yes. PhotoView.io includes a 14-day free trial." },
    ],
    relatedArticle: { href: "/articles/lightroom-to-online-photo-portfolio-workflow", label: "Read the Lightroom publishing guide" },
  },
  {
    slug: "photography-portfolio-with-video",
    eyebrow: "Photo and motion",
    title: "Build a photography portfolio with video",
    description: "Show still photographs and motion in one responsive portfolio, with clean playback and no distracting third-party video branding.",
    promise: "A body of work can move without becoming a video channel.",
    image: "/marketing-preview/sunset-panorama.webp",
    imageAlt: "Cinematic PhotoView.io photography portfolio presentation",
    steps: [
      { title: "Import the finished media", body: "Bring in curated photographs plus supported MP4 and MOV files from desktop or mobile." },
      { title: "Shape the sequence", body: "Mix still and motion deliberately, choose the cover, and keep unfinished work hidden." },
      { title: "Publish everywhere", body: "Share the responsive portfolio directly or include it in a complete PhotoView.io photography website." },
    ],
    benefits: [
      { title: "One visual story", body: "Keep motion clips beside the photographs they support instead of sending visitors elsewhere." },
      { title: "Responsive presentation", body: "Give desktop and mobile visitors a portfolio designed around the work, not a social feed." },
      { title: "Simple creative control", body: "Reorder, hide, caption, and preview the complete sequence before it becomes public." },
    ],
    faqs: [
      { question: "Which video formats can I use?", answer: "PhotoView.io accepts supported MP4 and MOV files, subject to the account’s upload and storage limits." },
      { question: "Will videos play inside the portfolio?", answer: "Yes. Published portfolios provide visitor playback controls in a responsive presentation." },
      { question: "Can I use a video in my website header?", answer: "Yes. The website builder supports an uploaded looping MP4 hero video." },
    ],
    relatedArticle: { href: "/articles/build-a-photography-portfolio-with-photos-and-video", label: "Read the photo and video portfolio guide" },
  },
  {
    slug: "embed-photography-portfolio",
    eyebrow: "One portfolio, every destination",
    title: "Embed a live photography portfolio on your existing website",
    description: "Curate once in PhotoView.io, then place the live portfolio inside WordPress, Squarespace, Webflow, Wix, or a custom site.",
    promise: "Stop rebuilding the same gallery in every place your work appears.",
    image: "/marketing-preview/gallery-sloss-furnaces.webp",
    imageAlt: "PhotoView.io photography gallery ready to embed on a website",
    steps: [
      { title: "Build the portfolio", body: "Choose the strongest photographs, set the order, and publish the version you want people to see." },
      { title: "Copy one embed", body: "Generate the portfolio embed and paste it into the supported HTML or embed block on your site." },
      { title: "Update from PhotoView.io", body: "Keep curating at the source so the live destination stays current without another gallery rebuild." },
    ],
    benefits: [
      { title: "Keep your current website", body: "Add a photography-first presentation without replacing the rest of your site or commerce stack." },
      { title: "A reusable publishing layer", body: "Use the same curated work as a direct link, a full gallery grid, or an embedded portfolio." },
      { title: "Faster portfolio updates", body: "Publish fresh finished work through Lightroom or watched desktop export folders." },
    ],
    faqs: [
      { question: "Do I need to move my website to PhotoView.io?", answer: "No. You can embed PhotoView.io portfolios in an existing site or use the included PhotoView.io website builder." },
      { question: "Which website builders support the embed?", answer: "The embed works anywhere the platform allows an iframe or supported HTML embed, including common WordPress, Squarespace, Webflow, and Wix setups." },
      { question: "What happens when I update the portfolio?", answer: "The embed points to the live PhotoView.io portfolio, so approved published changes can appear without rebuilding the gallery on the destination site." },
    ],
    relatedArticle: { href: "/articles/embed-a-photography-portfolio-on-your-existing-website", label: "Read the portfolio embed guide" },
  },
]

export function getMarketingSolution(slug: string) {
  return marketingSolutions.find((solution) => solution.slug === slug)
}
