export type AiHelpTopic = {
  title: string
  summary: string
  details: string[]
  keywords: string[]
}

export const aiHelpTopics: AiHelpTopic[] = [
  {
    title: "Getting started",
    summary: "Start with one polished portfolio before configuring every advanced option.",
    details: [
      "Create or open a portfolio, upload 10 to 25 curated images, choose a cover image from inside that portfolio, then review the public gallery link.",
      "Use the dashboard gallery list on the left to move between portfolios. Use Settings for site-wide setup, sharing, design, imports, mobile companion, storage, and account controls.",
      "The goal is a clean portfolio presentation first; commerce, proofing, and deeper delivery workflows can come later.",
    ],
    keywords: ["start", "getting started", "first", "setup", "new subscriber", "dashboard"],
  },
  {
    title: "Creating portfolios",
    summary: "A portfolio is a focused gallery of photos with its own cover, visibility, display settings, and public link.",
    details: [
      "Use New gallery to create a portfolio with a name, optional client, and status.",
      "After the portfolio exists, upload photos, choose the cover image inside that portfolio, set visibility, and adjust photo order.",
      "Portfolio cover selection belongs inside the portfolio, not in general site settings.",
    ],
    keywords: ["portfolio", "gallery", "new gallery", "create", "client", "status"],
  },
  {
    title: "Uploading photos",
    summary: "Subscribers can upload photos into a portfolio and the app creates display-friendly versions for viewing.",
    details: [
      "Use the upload controls inside a portfolio to add photos.",
      "The current subscriber upload limit is 100 MB per photo unless a future higher plan allows larger source files.",
      "Originals, optimized display versions, and thumbnails can all count toward storage because all of them occupy storage.",
    ],
    keywords: ["upload", "photo", "file size", "100mb", "storage", "originals", "thumbnail"],
  },
  {
    title: "Portfolio cover images",
    summary: "The portfolio cover is the image used to represent that specific portfolio in grids and previews.",
    details: [
      "Open the portfolio, select the image, then choose Set portfolio cover.",
      "In tiled view, the cover image is marked with a gold Cover badge.",
      "The site homepage carousel is separate from an individual portfolio cover.",
    ],
    keywords: ["cover", "cover image", "set cover", "homepage", "carousel", "badge"],
  },
  {
    title: "Photo order",
    summary: "Subscribers control the viewing order from inside each portfolio.",
    details: [
      "Use tiled view inside a portfolio to drag photos into the order you want.",
      "The public viewer and mobile lightbox use the subscriber-selected order.",
      "Hidden photos are excluded from the public viewing sequence.",
    ],
    keywords: ["order", "sort", "drag", "reorder", "sequence", "left right", "swipe"],
  },
  {
    title: "Hiding and showing photos",
    summary: "Hidden photos stay in the portfolio for the subscriber but are not shown publicly.",
    details: [
      "Use Hide on a photo to keep it in the subscriber dashboard while removing it from public views and share flows.",
      "Hidden photos appear greyed out and marked Hidden in tiled view, with an Unhide control.",
      "Hidden photos still count toward storage because the files remain recoverable.",
    ],
    keywords: ["hide", "show", "hidden", "unhide", "not public", "visibility"],
  },
  {
    title: "Captions and file names",
    summary: "Each portfolio can show captions, file names, or no text beneath photos.",
    details: [
      "Set the portfolio photo display text mode to Caption, File name, or Nothing.",
      "Captions are entered per photo. If caption mode is on and a photo has no caption, no placeholder text is shown.",
      "If text display is turned off, no empty caption space is reserved.",
    ],
    keywords: ["caption", "file name", "filename", "text", "labels", "nothing"],
  },
  {
    title: "Info pane",
    summary: "The portfolio info pane adds optional visitor-facing context beneath the public photo viewer.",
    details: [
      "When shown, visitors see location, date, time, and notes on the public portfolio page beneath the photo viewer.",
      "When hidden, that entire visitor info panel is removed.",
      "The info pane is portfolio-specific, so each portfolio can have different context.",
    ],
    keywords: ["info", "info pane", "location", "date", "time", "notes", "show info", "hide info"],
  },
  {
    title: "Mobile viewing",
    summary: "Mobile viewing is designed around full-screen photos, swipe navigation, and clean controls.",
    details: [
      "On mobile, viewers can swipe left or right through photos in the subscriber-selected order.",
      "Visible left and right controls are also available for users who prefer tapping.",
      "Hidden photos are not included in the mobile viewer.",
    ],
    keywords: ["mobile", "phone", "swipe", "lightbox", "left right", "fullscreen", "full screen"],
  },
  {
    title: "Sharing portfolios and photos",
    summary: "Subscribers can create links for all portfolios, a specific portfolio, or individual photos.",
    details: [
      "Use Sharing settings to choose the share target and copy the generated link.",
      "Social buttons appear when the subscriber has configured those social accounts in Setup.",
      "Hidden photos are not displayed or shared publicly.",
    ],
    keywords: ["share", "link", "social", "facebook", "linkedin", "instagram", "pinterest", "copy"],
  },
  {
    title: "Social account setup",
    summary: "Setup stores the subscriber's social account URLs so share buttons can appear in sharing panels.",
    details: [
      "Add social account URLs in the Setup tab.",
      "Configured platforms become active share buttons in the Sharing tab and portfolio/photo sharing areas.",
      "Unconfigured platforms can appear greyed out in setup guidance but should not be active share buttons.",
    ],
    keywords: ["social setup", "accounts", "facebook", "instagram", "linkedin", "x", "youtube", "tiktok"],
  },
  {
    title: "Watermarks",
    summary: "Watermarks affect public viewing only and never alter the stored original file.",
    details: [
      "Subscribers can choose text watermark, image watermark, or both.",
      "Adjust watermark position, opacity, and size from Gallery settings.",
      "If an optional watermark image is missing, the app hides it instead of showing a broken-image icon.",
    ],
    keywords: ["watermark", "logo", "image watermark", "text watermark", "opacity", "position"],
  },
  {
    title: "Homepage design",
    summary: "The homepage can use rotating portfolio cover images or a static selected image.",
    details: [
      "Use Design settings to choose a rotating cover carousel or static home image.",
      "Background dimming controls make text easier to read over photography.",
      "The portfolio grid can appear below the homepage cover so visitors can go directly into galleries.",
    ],
    keywords: ["homepage", "home page", "carousel", "static image", "dim", "cover photos"],
  },
  {
    title: "Templates and layout",
    summary: "Templates are display presets for how portfolios feel, not locked themes.",
    details: [
      "Choose a gallery template in Design settings.",
      "Hover previews help subscribers compare templates before saving.",
      "Subscribers can still tune layout controls after choosing a template.",
    ],
    keywords: ["template", "layout", "design", "theme", "preview"],
  },
  {
    title: "Imports",
    summary: "PhotoViewPro supports direct uploads and planned/prototype import flows from photography workflows.",
    details: [
      "SmugMug import can discover and bring over galleries when credentials and source URLs are configured.",
      "The Lightroom Classic plugin workflow is intended to publish selected images into PhotoViewPro portfolios.",
      "The desktop folder uploader can watch a local folder and send new files to the selected portfolio.",
    ],
    keywords: ["import", "smugmug", "lightroom", "plugin", "desktop uploader", "folder"],
  },
  {
    title: "Account and billing",
    summary: "The account page shows plan, storage usage, trial/billing status, and plan management controls.",
    details: [
      "Subscribers should use My Account for plan status, usage, billing portal, upgrade/downgrade, cancellation, and payment method changes.",
      "Stripe stores payment methods; PhotoViewPro should never store raw credit card numbers.",
      "Trial and subscription status are synced from Stripe through checkout and webhook events.",
    ],
    keywords: ["account", "billing", "stripe", "trial", "cancel", "upgrade", "credit card", "payment"],
  },
  {
    title: "Storage and bandwidth",
    summary: "Storage and bandwidth should be metered by subscriber and tied to plan limits.",
    details: [
      "Current public plan allowances are Starter 2 GB storage / 5 GB monthly bandwidth, Growth 10 GB / 20 GB, Studio 25 GB / 50 GB, and Archive 75 GB / 150 GB.",
      "PhotoViewPro is positioned for curated portfolio publishing with generous included storage, not unlimited dumping of every source file.",
      "Storage includes originals, display images, and thumbnails when those files exist.",
      "Bandwidth is separate from storage and should trigger warnings, upgrade prompts, or pausing public delivery when limits are exceeded.",
      "The SuperAdmin dashboard tracks subscribers, usage, plans, financials, coupons, audit, rights, and security areas.",
    ],
    keywords: ["storage", "bandwidth", "usage", "limits", "metering", "admin", "superadmin"],
  },
]

function tokenize(value: string) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2)
}

export function findRelevantAiHelpTopics(question: string, limit = 6) {
  const questionTerms = tokenize(question)

  return aiHelpTopics
    .map((topic) => {
      const haystack = tokenize([
        topic.title,
        topic.summary,
        topic.details.join(" "),
        topic.keywords.join(" "),
      ].join(" "))
      const score = questionTerms.reduce((sum, term) => sum + haystack.filter((word) => word.includes(term) || term.includes(word)).length, 0)

      return { score, topic }
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ topic }) => topic)
}
