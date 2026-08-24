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
  {
    slug: "private-photo-sharing-for-photographers",
    eyebrow: "Share with the right people",
    title: "Private photo sharing built for photographers",
    description: "Share a finished portfolio publicly, privately, with a password, or through a verified email link while keeping account controls and unfinished work out of view.",
    promise: "The work can feel personal without making the entire portfolio public.",
    image: "/marketing-preview/gallery-sloss-furnaces.webp",
    imageAlt: "Private photography portfolio presented by PhotoView.io",
    steps: [
      { title: "Curate what belongs", body: "Choose the finished photographs, set their order, and keep unfinished or weaker frames hidden." },
      { title: "Choose the audience", body: "Use public, private, password protected, or verified email sharing according to the purpose of the portfolio." },
      { title: "Send one focused experience", body: "Share the portfolio link without exposing the PhotoView.io dashboard, editing controls, or unrelated collections." },
    ],
    benefits: [
      { title: "Control without complexity", body: "Choose the level of access that fits the portfolio instead of treating every body of work the same way." },
      { title: "A presentation, not a file dump", body: "Share a deliberate sequence with covers, captions, and full screen viewing rather than an unstructured folder." },
      { title: "Keep private work separate", body: "Public embeds and website pages do not automatically expose portfolios intended for a restricted audience." },
    ],
    faqs: [
      { question: "Can I protect a portfolio with a password?", answer: "Yes. PhotoView.io supports password protected sharing for portfolios that should not be openly public." },
      { question: "Can I restrict access to approved email addresses?", answer: "Yes. Verified email sharing can limit access to the email recipients selected for the portfolio." },
      { question: "Does a private link give someone access to my dashboard?", answer: "No. The recipient receives the shared presentation, not your PhotoView.io account or editing controls." },
    ],
    relatedArticle: { href: "/articles/photo-portfolio-website-vs-client-proofing-gallery", label: "Understand portfolio sharing and proofing" },
  },
  {
    slug: "mobile-photography-portfolio",
    eyebrow: "Your work in your pocket",
    title: "A mobile photography portfolio ready when you are",
    description: "Present selected portfolios in a responsive, phone friendly experience that keeps photographs easy to browse during meetings, conversations, and introductions.",
    promise: "The best time to show the work is often the moment someone asks.",
    image: "/marketing-preview/mobile-tree-milky-way.webp",
    imageAlt: "PhotoView.io photography portfolio displayed on a mobile device",
    steps: [
      { title: "Choose the portfolios", body: "Select the bodies of work that belong in the phone friendly presentation instead of carrying the complete archive." },
      { title: "Review the mobile experience", body: "Check image order, orientation changes, captions, and full screen viewing before sharing." },
      { title: "Keep it close", body: "Open the mobile link on a phone and add it to the home screen for fast access when an opportunity appears." },
    ],
    benefits: [
      { title: "Always presentation ready", body: "Show a polished body of work without searching through a camera roll or opening a desktop website." },
      { title: "Curated for the conversation", body: "Include only the portfolios that support the clients, subjects, or opportunities you want to discuss." },
      { title: "One source of truth", body: "Keep the mobile presentation connected to the work already organized inside PhotoView.io." },
    ],
    faqs: [
      { question: "Do visitors need an app?", answer: "No. The portfolio opens through a responsive web experience on supported mobile browsers." },
      { question: "Can I choose which portfolios appear on mobile?", answer: "Yes. The mobile companion controls let the subscriber choose the portfolios included in the presentation." },
      { question: "Can I review the website itself on mobile?", answer: "Yes. The website builder includes desktop and mobile canvas modes plus Preview before publishing." },
    ],
    relatedArticle: { href: "/articles/mobile-photo-import-for-photographers", label: "Read the mobile photography workflow" },
  },
  {
    slug: "photo-storage-for-photographers",
    eyebrow: "Curate and preserve",
    title: "Photo and video storage for a portfolio that stays organized",
    description: "Keep originals, display files, photographs, and supported video connected to the portfolios where they belong, with clear plan allowances and usage controls.",
    promise: "Storage is more useful when it supports the way the work is presented.",
    image: "/marketing-preview/gallery-greenland.webp",
    imageAlt: "Organized landscape photography portfolio stored in PhotoView.io",
    steps: [
      { title: "Import finished work", body: "Bring in photographs and supported video through direct upload, mobile, Lightroom Classic, SmugMug, or watched desktop folders." },
      { title: "Organize by body of work", body: "Use separate portfolios for projects, locations, genres, clients, or any collection that needs its own cover and sequence." },
      { title: "Monitor capacity", body: "Review account usage and choose the plan allowance that fits the amount of original and generated media being kept." },
    ],
    benefits: [
      { title: "Originals stay connected", body: "Keep the original file associated with the display presentation instead of losing track of which version was published." },
      { title: "Clear plan allowances", body: "Starter, Growth, Studio, and Premier currently include 5 GB, 20 GB, 50 GB, and 150 GB of storage." },
      { title: "Built for selected work", body: "PhotoView.io is designed for curated portfolio publishing rather than an unstructured dump of every source file." },
    ],
    faqs: [
      { question: "What counts toward storage?", answer: "Stored originals and generated portfolio files count toward account usage. The account and storage screens explain the current total." },
      { question: "Which plan includes the most storage?", answer: "The current Premier plan includes 150 GB. Contact PhotoView.io if a larger allowance is needed." },
      { question: "Do higher plans unlock different website features?", answer: "No. Paid plans include the same product features and differ primarily by storage allowance and price." },
    ],
    relatedArticle: { href: "/articles/best-photo-gallery-platform-for-portfolio-first-photographers", label: "Read the portfolio platform guide" },
  },
]

export function getMarketingSolution(slug: string) {
  return marketingSolutions.find((solution) => solution.slug === slug)
}
