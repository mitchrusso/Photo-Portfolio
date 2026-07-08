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
      "Use the dashboard gallery list on the left to move between portfolios. Use Library when you want to organize, search, tag, or bulk-edit photos across every portfolio.",
      "Use Settings for site-wide setup, sharing, design, imports, mobile companion, storage, and account controls.",
      "The goal is a clean portfolio home first: store the work, curate the strongest images, display them beautifully, and share them anywhere.",
    ],
    keywords: ["start", "getting started", "first", "setup", "new subscriber", "dashboard", "library"],
  },
  {
    title: "Library organization",
    summary: "The Library is the uncluttered place to organize photos across every portfolio.",
    details: [
      "Open Library from the left dashboard menu to see photos from all portfolios in one searchable grid.",
      "Use the Library for organization work: search, filter, select photos, add tags, hide or show photos in bulk, and edit photo details.",
      "Use individual portfolios for presentation work: cover image, order, public/private controls, viewer mode, captions, and sharing.",
      "The right-side details pane appears only after selecting a photo, keeping the main Library grid clean and easy to scan.",
    ],
    keywords: ["library", "organize", "organization", "all photos", "details pane", "metadata", "grid"],
  },
  {
    title: "Searching and filtering photos",
    summary: "Library search finds photos across titles, files, captions, tags, trips, locations, camera details, and notes.",
    details: [
      "Open Library and type into the search field to search across every portfolio.",
      "Use filters for All, Visible, Hidden, Untagged, and No caption.",
      "Search and filters can be combined, for example searching Myanmar while showing only untagged photos.",
      "Use Reset in the Library grid header to clear the current search and return to All photos.",
    ],
    keywords: ["search", "filter", "find", "visible", "hidden", "untagged", "uncaptioned", "no caption"],
  },
  {
    title: "Tags, categories, trips, and metadata",
    summary: "Photo metadata helps subscribers find and organize work without cluttering the public portfolio.",
    details: [
      "Select a photo in Library to edit caption, tags, category, trip or collection, location, and date.",
      "Open Camera and notes in the details pane to add camera, lens, story behind the shot, and private notes.",
      "Tags are comma-separated. Examples include landscape, night, favorite, family, black and white, or portfolio candidate.",
      "These organization fields are for subscriber workflow and search. They do not automatically appear publicly unless a future display setting uses them.",
    ],
    keywords: ["tag", "tags", "category", "trip", "collection", "metadata", "camera", "lens", "story", "notes", "location", "date"],
  },
  {
    title: "Bulk library actions",
    summary: "Bulk actions appear only after selecting photos in Library.",
    details: [
      "Select one or more photos in Library to reveal the bulk toolbar.",
      "Use Show or Hide to change public visibility for selected photos without deleting them.",
      "Use the bulk tag field to add one or more comma-separated tags to all selected photos.",
      "Bulk actions are designed for fast cleanup after import, especially when a phone or Lightroom upload creates a large batch.",
    ],
    keywords: ["bulk", "bulk edit", "select", "selected", "bulk tag", "bulk hide", "bulk show", "batch"],
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
      "Captions can be entered per photo inside a portfolio or from the Library details pane.",
      "If caption mode is on and a photo has no caption, no placeholder text is shown.",
      "If text display is turned off, no empty caption space is reserved.",
    ],
    keywords: ["caption", "file name", "filename", "text", "labels", "nothing", "library"],
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
    title: "Mobile importing",
    summary: "Mobile import helps subscribers choose photos from a phone, review thumbnails, and create a clean portfolio.",
    details: [
      "Use Settings, Mobile or Imports to start a mobile-friendly upload flow.",
      "The mobile import flow reviews thumbnails in batches so the subscriber can choose only the photos they want before creating the portfolio.",
      "After importing, use the new portfolio to choose the cover, hide weak images, caption photos, and drag the presentation order.",
      "Use Library after import for faster cross-portfolio tagging, search cleanup, and bulk hide/show actions.",
    ],
    keywords: ["mobile import", "phone import", "iphone", "android", "thumbnails", "batch", "choose photos"],
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
    title: "Embedding portfolios",
    summary: "Subscribers can embed a full portfolio grid or a specific portfolio on an existing website.",
    details: [
      "Use Sharing settings to choose whether to share the full portfolio grid or one specific portfolio.",
      "The embed panel generates an iframe code block that can be pasted into another website.",
      "Embeds use the selected public portfolio presentation and respect hidden-photo visibility.",
      "Use embed controls when a subscriber wants PhotoViewPro presentation without replacing their existing website.",
    ],
    keywords: ["embed", "iframe", "website", "existing website", "code", "portfolio grid"],
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
      "After any import, use Library to search, tag, bulk hide, bulk show, and fill in organization metadata.",
    ],
    keywords: ["import", "smugmug", "lightroom", "plugin", "desktop uploader", "folder", "library", "bulk"],
  },
  {
    title: "AI curation help",
    summary: "AI help can explain current PhotoViewPro workflows, but it does not yet automatically curate photos for the subscriber.",
    details: [
      "Ask AI How To can answer questions about setup, Library organization, search, tags, captions, covers, sharing, embeds, imports, account, and storage.",
      "Automatic AI curation, title generation, caption generation, and gallery-building assistance are product directions, not fully automated dashboard actions yet.",
      "For now, the closest workflow is to use Library to tag, caption, search, filter, and bulk-clean imported photos manually.",
      "If asked for an unbuilt AI action, explain that it is not built yet and point the subscriber to the nearest available Library or portfolio workflow.",
    ],
    keywords: ["ai", "curate", "curation", "title", "caption generation", "organize", "assistant", "automatic"],
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
    title: "Storage and viewing traffic",
    summary: "Storage is tied to subscriber plans. Viewing traffic is monitored for fair use, abuse prevention, and reliability.",
    details: [
      "Current public plan allowances are Starter 2 GB storage, Growth 10 GB, Studio 25 GB, and Archive 75 GB.",
      "PhotoViewPro is positioned for curated portfolio publishing with generous included storage, not unlimited dumping of every source file.",
      "Storage includes originals, display images, and thumbnails when those files exist.",
      "Public viewing traffic is not sold as a separate bandwidth allowance, but unusually heavy or abusive traffic can still trigger reliability safeguards.",
      "The Storage and My Account views explain subscriber usage. The SuperAdmin dashboard tracks subscribers, usage, plans, financials, coupons, audit, rights, and security areas.",
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
