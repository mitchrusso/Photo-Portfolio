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
      "Choose a portfolio, search, or filter first, then use Select shown to select that complete group.",
      "Open Bulk metadata to add comma-separated tags or apply a shared caption, location, and date to all selected photos.",
      "Bulk tags preserve existing tags. Shared captions fill blank captions by default so existing writing is protected; turn that safeguard off only when you intend to replace captions.",
      "Bulk actions are designed for fast cleanup after import, especially when a phone or Lightroom upload creates a large batch.",
    ],
    keywords: ["bulk", "bulk edit", "select", "selected", "bulk tag", "bulk caption", "bulk location", "bulk date", "bulk hide", "bulk show", "batch"],
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
      "Plans are based on total stored portfolio capacity.",
      "Originals, optimized display versions, and thumbnails can all count toward storage because all of them occupy storage.",
    ],
    keywords: ["upload", "photo", "file size", "storage", "originals", "thumbnail"],
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
    title: "Scheduling a portfolio for social media",
    summary: "The Social Scheduler turns visible photos from one portfolio into a paced posting queue.",
    details: [
      "Open Settings, then Scheduler, and choose the portfolio and configured social platforms.",
      "Choose one, two, or three posts per day, set the spacing between posts, and select the local date and time for the first post.",
      "The queue follows the subscriber's portfolio order, skips hidden photos, and stops after the final visible image unless Repeat is enabled.",
      "Use the queue preview to confirm the image, caption source, destination platforms, and exact posting times before activating it.",
      "Public account URLs support manual sharing. Automatic publishing requires OAuth permission from each social platform; PhotoViewPro never asks for or stores social-media passwords.",
    ],
    keywords: ["schedule", "scheduler", "social automation", "posts per day", "spacing", "queue", "publish later"],
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
    title: "Building a photographer website",
    summary: "My Website lets subscribers build a simple photographer website around their PhotoViewPro portfolios.",
    details: [
      "Open My Website from the left dashboard menu to build a website around the portfolios already in PhotoViewPro.",
      "The builder toolbar includes a page Focus menu, desktop and mobile preview buttons, Edit Hints, Save draft, Website address, and Preview.",
      "On a wide screen, the Build, Design, and Site tools appear beside the Live Canvas. On a narrow screen, the same tools stack above the canvas.",
      "Open Design, then choose a template and adjust colors, font style, image frame, image shape, and other presentation controls. The Live Canvas updates as settings change.",
      "Use the Gallery wall template when the website should behave like a clean visual index: title and navigation on top, then a large grid of selected portfolio cover images.",
      "Open Site to choose Home, About, Trips or Blog, What's in My Bag, Articles, Contact, or an optional custom page.",
      "Open Build and select a page section to edit its headline, body, images, visibility, and section-specific options while seeing the result in the Live Canvas.",
      "Turn on Edit hints in the website-builder toolbar, then point to a headline, paragraph, image, gallery, or page section. The contextual hint explains what controls it and Show me opens, scrolls to, focuses, and highlights the exact Build control.",
      "Open Merlin walkthrough when you want guided setup. Choose a goal such as first website, homepage, portfolio presentation, About and Contact, equipment, or publishing; or describe the outcome in your own words so AI can choose the shortest appropriate walkthrough.",
      "Merlin uses AI only to interpret the subscriber's goal. Every walkthrough step and Show me destination comes from PhotoViewPro's verified control map, so the assistant cannot invent builder settings.",
      "Open Design on the left to control the site background color, text color, accent color, font style, image frame, image shape, and template.",
      "To choose the hero image, select Hero on the Home page and open its image controls. The hero can use the first featured portfolio cover, a specific portfolio cover, a visible photo from the Library, or an uploaded custom image.",
      "Drag page sections in the left Build menu to change their order. The Live Canvas updates immediately.",
      "Under Image frame, use the Line thickness slider to control how thick the frame border appears around website images.",
      "For the About page, select About in the left Build menu to upload an optional photo. If no photo is uploaded, the About page uses a clean text-only layout with no empty image space.",
      "For What's in My Bag, select that section and type equipment directly into the Live Canvas, or use the Equipment controls in the left Build menu. Camera bodies, favorite lenses, and travel accessories each support multiple products with a name, note, and optional product or affiliate link. Blank products are never published.",
      "Quick add gear asks whether the subscriber has an affiliate account and which retailer it belongs to. Supported choices include Amazon, B&H Photo, Adorama, Best Buy, Walmart, KEH Camera, MPB, Moment, and eBay. Choose Another retailer and enter its website when an affiliate program is not listed.",
      "List camera bodies, lenses, and accessories in plain English, one per line. PhotoViewPro finds likely products from the chosen retailer, then shows an approval table with images, descriptions, categories, and links. Only checked products are added to the saved website draft.",
      "Approved What's in My Bag products appear as individual tiles grouped by category. Each tile can show the retailer-hosted product image, stable product details, and a For more info link. Amazon tracking IDs are added automatically when configured. For affiliate programs that generate a special deep link through Impact, Rakuten, or another network, paste that final link into the approved row before saving. Never enter an affiliate password, secret key, or payment information.",
      "Quick Add Gear includes an expandable How Quick Add Gear works guide at the top. Approved imports save immediately. To edit or remove a saved item later, return to What's in My Bag, open Equipment, change its fields or select the trash icon, and then click Save draft.",
      "The Work display controls can show featured portfolios, one portfolio, or all portfolios as a slideshow, thumbnail grid, film strip, or cover cards.",
      "To add multiple trips or blog entries, use the Trips or Blog page editor and add additional trip entries. Each entry can have a title, meta text, body copy, and optional link.",
      "To set up the contact form destination, open My Website, select Contact in the left Build menu, then enter the subscriber-only Form delivery email. That delivery field is not shown to visitors.",
      "The Contact page canvas shows the visitor-facing form only. In Draft Preview, top-menu links replace the Home screen with the selected page, such as Trips or What's in My Bag. A page can therefore remain in navigation without also appearing on Home.",
      "Use Preview website to save the draft and open the preview. The preview includes a Back to builder button that returns to the My Website builder.",
      "Website building is different from embedding: embedding places a PhotoViewPro gallery on an existing external site, while My Website creates a PhotoViewPro-powered site experience.",
    ],
    keywords: [
      "my website",
      "website builder",
      "edit hints",
      "merlin",
      "show me",
      "walkthrough",
      "build website",
      "build my website",
      "homepage template",
      "template film strip",
      "gallery wall",
      "move sections",
      "section order",
      "hero image",
      "library hero",
      "about page",
      "contact form",
      "camera bodies",
      "equipment",
      "favorite lenses",
      "gear products",
      "what's in my bag",
      "trips",
      "blog",
      "articles",
      "what's in my bag",
      "whats in my bag",
      "background color",
      "text color",
      "preview website",
      "save website draft",
    ],
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
    summary: "PhotoViewPro supports direct uploads plus importer workflows from common photography tools.",
    details: [
      "SmugMug import can discover and bring over galleries when credentials and source URLs are configured.",
      "The Lightroom Classic plugin can publish selected exported images into PhotoViewPro portfolios.",
      "The desktop folder uploader can watch a local folder and send new files to the selected portfolio for tools such as Capture One, Photoshop, Affinity, DxO, ON1, Luminar, Photo Mechanic, darktable, and RawTherapee.",
      "After any import, use Library to search, tag, bulk hide, bulk show, and fill in organization metadata.",
    ],
    keywords: ["import", "smugmug", "lightroom", "plugin", "desktop uploader", "folder", "library", "bulk"],
  },
  {
    title: "AI curation help",
    summary: "The AI Portfolio Assistant gives preview-only suggestions for portfolio polish and sharing copy.",
    details: [
      "Ask AI How To can answer questions about setup, Library organization, search, tags, captions, covers, sharing, embeds, imports, account, and storage.",
      "Inside a portfolio, use AI Portfolio Assistant to suggest a cover, display order, portfolio intro, blank captions, tags, duplicate review, and social sharing copy.",
      "AI suggestions never overwrite the portfolio automatically. The subscriber reviews suggestions and chooses Apply cover, Apply order, Use intro, Apply blanks + tags, or Copy social text.",
      "Hidden photos stay hidden. The assistant does not include hidden photos in public order or sharing recommendations.",
      "Duplicate review is advisory and based on available metadata such as names and dimensions; the subscriber should visually confirm before deleting or hiding anything.",
    ],
    keywords: ["ai", "curate", "curation", "title", "caption generation", "organize", "assistant", "automatic", "social assistant", "sharing copy"],
  },
  {
    title: "Social Sharing Assistant",
    summary: "The Social Sharing Assistant writes platform-ready copy for the active portfolio.",
    details: [
      "Open a portfolio and use AI Portfolio Assistant, then choose Write sharing copy.",
      "The assistant drafts short copy for Facebook, Instagram, LinkedIn, Pinterest, X, and email.",
      "Use Copy next to a draft, then use the configured social buttons to open the selected platform when available.",
      "Instagram, TikTok, and YouTube do not provide dependable public web-share posting, so PhotoViewPro copies the link and opens the configured account page when those buttons are used.",
    ],
    keywords: ["social", "sharing assistant", "facebook", "instagram", "linkedin", "pinterest", "x", "email", "copy"],
  },
  {
    title: "Account and billing",
    summary: "The account page shows plan, storage usage, trial/billing status, and plan management controls.",
    details: [
      "Subscribers should use My Account for plan status, usage, billing portal, upgrade/downgrade, cancellation, and payment method changes.",
      "Use Replace payment card to open Stripe directly at the secure payment-method update screen. The new card becomes the default billing method.",
      "Stripe stores payment methods; PhotoViewPro should never store raw credit card numbers.",
      "Trial and subscription status are synced from Stripe through checkout and webhook events.",
    ],
    keywords: ["account", "billing", "stripe", "trial", "cancel", "upgrade", "credit card", "payment", "lost card", "stolen card", "replace card"],
  },
  {
    title: "Referral storage bonuses",
    summary: "Each eligible referral that becomes paid earns the referring account a one-time permanent 1 GB storage bonus.",
    details: [
      "Copy the personal referral link from My Account or the Account settings tab and share it with another photographer.",
      "The reward is granted once when the referred trial first becomes a paid subscription; it does not repeat at annual renewal.",
      "Referral rewards add storage capacity only. They do not add free subscription months, cash credit, or transferable value.",
      "Earned referral capacity remains available while the referring PhotoViewPro account is active and in good standing.",
    ],
    keywords: ["referral", "refer", "reward", "bonus", "capacity", "storage bonus", "free month", "affiliate link"],
  },
  {
    title: "Storage usage",
    summary: "Storage is tied to subscriber plans and reflects the files kept for each portfolio.",
    details: [
      "Current public plan allowances are Starter 2 GB storage, Growth 10 GB, Studio 25 GB, and Premier 75 GB.",
      "PhotoViewPro is positioned for curated portfolio publishing with generous included storage, not unlimited dumping of every source file.",
      "Storage includes originals, display images, and thumbnails when those files exist.",
      "PhotoViewPro measures stored originals, display images, and thumbnails so account capacity remains accurate.",
      "The Storage and My Account views explain subscriber usage. The SuperAdmin dashboard tracks subscribers, usage, plans, financials, coupons, audit, rights, and security areas.",
    ],
    keywords: ["storage", "usage", "capacity", "metering", "admin", "superadmin"],
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
