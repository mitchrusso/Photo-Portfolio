import { approvedSeoArticles } from "./approved-articles"

export type SeoArticle = {
  slug: string
  title: string
  description: string
  audience: string
  readTime: string
  publishedAt: string
  keywords: string[]
  sections: {
    heading: string
    body: string[]
  }[]
}

const baseSeoArticles: SeoArticle[] = [
  {
    slug: "one-photo-dashboard-multiple-websites-shopify-embeds",
    title: "One Photo Dashboard, Many Websites: Live Embeds for Shopify and Consumer Sites",
    description:
      "A detailed guide to using PhotoView.io as the central image dashboard for several live galleries across Shopify stores, consumer websites, brand sites, and partner pages.",
    audience: "Photographers, brands, agencies, and Shopify store owners",
    readTime: "12 min read",
    publishedAt: "2026-07-29",
    keywords: [
      "Shopify photo gallery embed",
      "multiple website image dashboard",
      "live photography embed",
      "central image management",
      "multi-site photo gallery",
      "automatic website image updates",
    ],
    sections: [
      {
        heading: "The central-dashboard model",
        body: [
          "A traditional website gallery is often maintained inside the website builder. When the same campaign appears on a main site, a Shopify store, a dealer page, and a second brand site, that approach creates four separate copies to update. PhotoView.io changes the model: the portfolios and saved embed selections live in one dashboard, while each outside page displays a live PhotoView presentation.",
          "The iframe is not a frozen export. It continues to read the public selection hosted by PhotoView. Show a photograph, hide one, or change the portfolio order in PhotoView, and every website using the affected live embed can reflect that decision without replacing the code on each site.",
          "This makes PhotoView the publishing and curation layer for finished images. Photoshop, Topaz, Capture One, or another editor still prepares the photograph; Shopify and the other websites still handle commerce, navigation, copy, and conversion. PhotoView controls which finished images appear and in what order.",
        ],
      },
      {
        heading: "Choose between one shared embed and several independent embeds",
        body: [
          "Reuse the same embed code when several placements should always mirror one another. For example, a photographer could place one Current campaign embed on a portfolio homepage, a Shopify brand page, and a distributor site. A single PhotoView visibility or ordering change then updates all three placements.",
          "Create separate saved embed profiles when the destinations need different selections. A Shopify homepage may need six dramatic campaign photographs, a collection page may need the complete seasonal story, and a press page may need only approved editorial images. Each saved profile can select individual photographs, one portfolio, several portfolios, or the full public collection.",
          "Name profiles by destination rather than by a vague subject. Main store — homepage, Main store — summer collection, Brand site — About, and Dealer portal — approved campaign are easier to operate than Gallery 1, Gallery 2, and Gallery 3.",
        ],
      },
      {
        heading: "Consumer website use cases",
        body: [
          "A photographer with several specialty sites can keep a Wildlife portfolio embedded on a nature site, an Architecture portfolio on a commercial site, and a Portraits portfolio on a booking site. The sites retain their own design and marketing message, while PhotoView provides one place to review the images behind all three.",
          "A travel or event business can reuse one live Destination spotlight across its public website, a registration page, a sponsor page, and a tourism partner site. When the approved image order changes, every placement stays aligned.",
          "An artist can maintain separate embeds for Available work, Recent exhibitions, and Press selections. A gallery, personal site, and exhibition microsite can each use the appropriate feed without receiving access to the artist's PhotoView dashboard.",
          "A nonprofit or community organization can create portfolios for Programs, Events, Volunteers, and Impact. Saved profiles can combine those portfolios differently for the main site, a campaign landing page, and a partner page while the staff curates the public imagery centrally.",
        ],
      },
      {
        heading: "Shopify homepage and campaign use cases",
        body: [
          "Use a concise homepage embed as a live editorial window into the current campaign. Select a small set of strong photographs rather than turning the homepage into an archive. When a launch changes, update the selected PhotoView portfolio or profile and keep the Shopify placement intact.",
          "A seasonal landing page can use a larger campaign embed for a lookbook or launch story. The product grid and purchase controls remain native Shopify content around it; the PhotoView embed supplies the visual narrative.",
          "For stores that operate more than one regional or brand site, the same approved campaign embed can be placed on each storefront. If every storefront should match, reuse the code. If product availability or art direction differs by market, save one clearly named embed profile per storefront.",
        ],
      },
      {
        heading: "Shopify collection and product-story use cases",
        body: [
          "A collection page can place a PhotoView gallery between the collection introduction and the product grid to show the materials, location, people, or process behind the range. A dedicated collection portfolio keeps that story independent from the main campaign.",
          "A product-story page can embed detail photographs, alternate environments, craftsmanship, before-and-after context, or installation examples. When every product has different imagery, use a dedicated portfolio and embed profile only where the editorial value justifies that extra structure; do not load a large generic gallery on every product page.",
          "Wholesale, press, stockist, and trade pages can display a controlled public selection without exposing the PhotoView dashboard. Keep downloadable sales assets and protected client material in their appropriate private delivery flow rather than treating a public embed as a secure file room.",
        ],
      },
      {
        heading: "Build the portfolios and publishing lanes",
        body: [
          "Start by mapping each body of work to a PhotoView portfolio. A useful plan might include Evergreen brand, Spring campaign, Product details, Behind the scenes, and Press approved. Set only the portfolios intended for public embedding to Public, and enable portfolio embed permission for each one.",
          "When finished images come from desktop software, open Settings, Imports, and Smart Folders. Create a separate route for each local export folder and destination portfolio. PhotoView supports up to 12 routes in one watcher command, so one computer can monitor several independent publishing lanes.",
          "A brand could export approved campaign files to PhotoView-Spring, product details to PhotoView-Details, and press images to PhotoView-Press. The watcher sends each finished file only to its assigned portfolio. Smart Folders automate delivery; the PhotoView dashboard remains the place to review visibility and presentation order.",
        ],
      },
      {
        heading: "Create and place the live embeds",
        body: [
          "Open Settings, then Sharing. Under Create an embed, choose New embed, give the profile a destination-specific name, and select the exact photographs or portfolios that placement should display. Save Settings, copy the iframe, and paste it into the matching page on the outside website.",
          "On a Shopify theme that provides a Custom Liquid section in the intended template, add that section in the theme editor and paste the iframe there. If the active theme does not provide an appropriate Custom Liquid section, use the theme's supported code-editing workflow or work with a Shopify developer. PhotoView is supplying a standard live embed, not installing a Shopify app.",
          "For WordPress, Squarespace, Webflow, Wix, or a custom site, place the iframe in the platform's supported HTML or embed block. Website builders differ, so preview the result in the actual published or staged page rather than assuming the editor canvas is exact.",
        ],
      },
      {
        heading: "What a one-update workflow really means",
        body: [
          "After the iframe has been placed, routine curation no longer requires repasting it. One PhotoView action—such as showing a new approved photograph, hiding an expired image, or changing the order—updates the live PhotoView selection used by every matching placement.",
          "A finished Smart Folder export can also travel through the workflow automatically: the watcher uploads it to its assigned portfolio, and an embed that includes that public, visible work can display it. Review the portfolio before relying on unattended publishing when brand approval, licensing, product availability, or launch timing matters.",
          "The update is not a command that rewrites Shopify or another site's media library. The outside page continues to load the PhotoView-hosted iframe. That distinction is what allows several sites to stay synchronized without maintaining duplicate gallery content.",
        ],
      },
      {
        heading: "A practical multi-site example",
        body: [
          "Imagine a studio managing a consumer brand site, a Shopify store, and two retailer pages. The Evergreen brand profile is reused on the consumer About page and both retailer pages. A Store homepage profile shows six current campaign photographs. A Spring collection profile shows the full seasonal portfolio only on the Shopify collection page.",
          "When the studio hides an outdated Evergreen photograph, all three Evergreen placements change together. When it reorders the Spring portfolio, only the collection embed changes. When a new homepage hero selection is needed, the team edits the Store homepage profile without disturbing the retailer galleries.",
          "This structure gives the team one source of truth without forcing every site to show identical content. Shared profiles create synchronization; separate profiles create control.",
        ],
      },
      {
        heading: "Governance, performance, and launch checks",
        body: [
          "Use only public, web-ready photographs in embeds. Private link, Password, and client-portal portfolios are intentionally unavailable through readable embed URLs. An outside website receives the public presentation, not PhotoView account access or editing controls.",
          "Keep each placement focused. A smaller editorial selection usually loads faster and gives visitors a clearer story than a complete archive. Confirm image licensing, remove expired campaign work, and use profile names that identify the owner and destination.",
          "Before launch, test every placement on desktop and mobile. Check the surrounding page spacing, iframe height, loading behavior, order, captions, and hidden-image rules. Then make one harmless test change in PhotoView and confirm that every intended placement updates while unrelated profiles remain unchanged.",
        ],
      },
    ],
  },
  {
    slug: "smart-folders-automatically-update-photo-portfolio-embeds",
    title: "How to Use Smart Folders to Update Photo Portfolios and Website Embeds Automatically",
    description:
      "A detailed guide to sending finished images from Topaz and other desktop apps into multiple PhotoView portfolios and keeping embeds on different websites current.",
    audience: "Photographers publishing finished desktop exports",
    readTime: "10 min read",
    publishedAt: "2026-07-29",
    keywords: [
      "photography smart folder",
      "automatic photo portfolio upload",
      "Topaz Photo export workflow",
      "embed photography portfolio",
      "multiple website photo galleries",
    ],
    sections: [
      {
        heading: "What a PhotoView Smart Folder does",
        body: [
          "A Smart Folder is a local folder on your computer connected to a PhotoView portfolio. You finish the photograph in Topaz Photo, Topaz Gigapixel, Capture One, Photoshop, Affinity, DxO, ON1, Luminar, or another desktop application, then export the finished file into that folder. The PhotoView watcher notices the completed export and uploads it to the portfolio assigned to that route.",
          "PhotoView does not edit, sharpen, upscale, or reinterpret the file. The editing application remains responsible for the finished image. PhotoView receives the exported JPEG, PNG, WebP, HEIC, HEIF, or TIFF and uses it for storage, portfolio presentation, sharing, and embeds.",
          "The watcher runs on the computer that contains the export folders. It checks for new files every few seconds, waits until a file has stopped changing before uploading it, and records completed uploads in a hidden .photoviewpro-uploaded.json file inside each watched folder.",
        ],
      },
      {
        heading: "Prepare the folders and destination portfolios",
        body: [
          "Begin by deciding which bodies of work need independent destinations. A wildlife photographer might create PhotoView-Wildlife, PhotoView-Birds, and PhotoView-Landscapes inside the Pictures folder. A commercial photographer might instead use PhotoView-Products, PhotoView-Architecture, and PhotoView-Portraits.",
          "Every Smart Folder route needs a unique local folder path and a destination portfolio name. Use names that remain clear months later. The local folder and PhotoView portfolio do not have to share the same name, but matching names make troubleshooting easier.",
          "If a portfolio with the selected name already exists, new photographs are appended to it. Otherwise PhotoView creates that portfolio when the first finished image arrives. Account portfolio limits, available storage, and subscription write access still apply.",
        ],
      },
      {
        heading: "Configure your first Smart Folder",
        body: [
          "Step 1: Sign in to PhotoView and open Settings, then Imports, then Smart Folders.",
          "Step 2: Turn on Enable Smart Folder imports.",
          "Step 3: Give the route a descriptive name such as Wildlife website or Architecture portfolio.",
          "Step 4: Enter the complete local watch-folder path. The default pattern is $HOME/Pictures/PhotoView-Exports.",
          "Step 5: Enter the PhotoView destination portfolio name. Add an optional client name when the files belong to a client or project.",
          "Step 6: Turn on nested folders only when exports inside subfolders should also be uploaded.",
          "Step 7: Generate and copy the private import key. Paste it into Lightroom before leaving the page because PhotoView.io does not save or show the raw key again. Generate a replacement when the 90-day key expires; a replacement immediately invalidates the prior key.",
        ],
      },
      {
        heading: "Export finished images from Topaz or another desktop app",
        body: [
          "In Topaz Photo or Topaz Gigapixel, complete the enhancement and choose the matching Smart Folder as the export destination. The same approach works with a Capture One process recipe, a Photoshop export action, an Affinity batch job, or the output settings in Photo Mechanic, DxO, ON1, Luminar, Pixelmator, RawTherapee, and darktable.",
          "Export only the finished presentation file that belongs in the portfolio. Keep RAW captures, layered working files, and archival masters in their normal archive. Smart Folders are publishing lanes, not replacements for a managed photography archive.",
          "Use a filename that will remain meaningful in PhotoView. The watcher preserves the exported filename and uses its base name as the initial photo title. If the editing app exports a revised file with a changed size or modification time, PhotoView treats it as a new finished export rather than silently replacing an existing portfolio photograph.",
        ],
      },
      {
        heading: "Add multiple folder-to-portfolio routes",
        body: [
          "Choose New folder on the Smart Folders page for every additional publishing lane. PhotoView supports up to 12 saved routes. Configure a unique watch folder and destination portfolio inside each tab, then save Settings.",
          "One copied watcher command contains all saved routes. Run that command once on the export computer and leave it running while you work. You do not need a separate terminal window for every folder.",
          "A practical three-route setup could send PhotoView-Wildlife to a Wildlife portfolio, PhotoView-Portraits to a Portraits portfolio, and PhotoView-Architecture to an Architecture portfolio. Exporting a file into one folder affects only its assigned portfolio.",
        ],
      },
      {
        heading: "Create a different embed for each outside website",
        body: [
          "Smart Folders deliver photographs to portfolios; saved embed profiles decide where those portfolios appear. First set each destination portfolio to Public and confirm that Include this portfolio in website embeds is enabled. Protected portfolios cannot be exposed through an iframe.",
          "Open Settings, then Sharing. Under Create an embed, choose New embed and give the tab the name of the outside placement, such as Wildlife homepage, Architecture studio, or Portrait booking page. Choose One portfolio and select the portfolio fed by the corresponding Smart Folder. Copy the generated iframe code and paste it into the matching WordPress, Squarespace, Webflow, Wix, or custom website page.",
          "Repeat that process for every outside site or placement. Each saved embed profile remembers its own portfolio selection and produces independent code. The websites may use different domains; the photographs and presentation remain securely hosted by PhotoView.",
        ],
      },
      {
        heading: "How automatic embed updates work",
        body: [
          "The embed code points to a live PhotoView presentation rather than a frozen copy of the photographs. When the watcher uploads another finished image to the selected public portfolio, that image becomes available to the corresponding embed without changing or repasting the iframe code.",
          "Portfolio controls remain authoritative. Reordering photographs changes their order in the embed. Hiding a photograph removes it from the public presentation without deleting it. Disabling embed permission or changing the portfolio away from Public removes it from generated embed access.",
          "This separation makes the workflow predictable: the desktop folder controls where finished exports arrive, the PhotoView portfolio controls curation and visibility, and the saved embed profile controls which outside page displays that work.",
        ],
      },
      {
        heading: "Run the watcher safely",
        body: [
          "Copy the command shown on the Smart Folders page and run it from the PhotoView project folder on the export computer. The command contains the PhotoView API address, the private import key, and an encoded version of all saved folder routes. Do not manually edit the encoded routes; update the tabs in PhotoView and copy a fresh command.",
          "Leave the watcher running during exports. Closing the terminal stops automatic delivery, but no photographs are lost; restarting the watcher scans the folders again and skips the files already recorded as uploaded.",
          "Treat the import key like a password. Do not paste it into public documents, screenshots, support posts, or source control. The key is subscriber-specific and expires after 90 days, at which point a new key and watcher command must be generated.",
        ],
      },
      {
        heading: "Troubleshooting and review",
        body: [
          "If a file does not arrive, confirm that the watcher is running, the export format is supported, the route uses the correct local path, and the import key has not expired. Also check account storage and portfolio limits. The terminal reports upload errors without marking the failed file as complete, allowing a later scan to retry it.",
          "If an image appears in the wrong portfolio, stop the watcher, correct the route in PhotoView, save, and copy a fresh command. Moving the local file after it has uploaded does not move the photograph between PhotoView portfolios.",
          "Review every destination portfolio before relying on it publicly. Choose a cover, arrange the display order, hide unfinished work, verify embed permission, and open each outside website on desktop and mobile. Smart Folders automate delivery; the photographer still controls the edit.",
        ],
      },
    ],
  },
  {
    slug: "build-a-photography-portfolio-with-photos-and-video",
    title: "How to Build a Photography Portfolio with Photos and Video",
    description:
      "A practical guide to combining still photography and short video clips in one focused, professional portfolio.",
    audience: "Photographers adding motion to their portfolios",
    readTime: "6 min read",
    publishedAt: "2026-07-21",
    keywords: ["photo and video portfolio", "photography portfolio video", "mixed media portfolio"],
    sections: [
      {
        heading: "Use motion when it adds something a photograph cannot",
        body: [
          "Video works best in a photography portfolio when it extends the story instead of interrupting it. A short environmental clip, behind-the-scenes moment, aerial pass, or portrait in motion can add context while the still photographs remain the center of the presentation.",
          "Start with a selective edit. A portfolio containing a few purposeful clips will usually feel stronger than one that asks visitors to play video after video.",
        ],
      },
      {
        heading: "Prepare video for reliable web playback",
        body: [
          "H.264 MP4 is the most dependable format for modern browsers and mobile devices. PhotoView.io also accepts MOV files and prepares a compatible playback copy while preserving the original file.",
          "Every video needs a clear poster image so visitors understand what they are about to play. In PhotoView.io, that poster is created during upload and appears beside ordinary photograph thumbnails in the portfolio.",
        ],
      },
      {
        heading: "Sequence photographs and video as one body of work",
        body: [
          "Arrange video with the same editorial care used for still images. Open with a strong photograph, place motion where it changes the pace or reveals new information, and avoid putting several similar clips together.",
          "Video can be moved, hidden, downloaded, shared, or deleted using the same portfolio controls as photographs. A still photograph remains the portfolio cover, giving every gallery a fast and consistent first impression.",
        ],
      },
      {
        heading: "Understand how video uses storage",
        body: [
          "Video files are larger than photographs, so storage planning matters. Original files, browser playback copies, and poster images count toward the storage included with the subscription plan; PhotoView.io does not add a separate video-hosting charge.",
          "Exporting large MOV files as H.264 MP4 before upload reduces conversion time and can reduce storage use. Keep the original master in your archive and publish the finished version that belongs in the portfolio.",
        ],
      },
    ],
  },
  {
    slug: "photo-portfolio-website-vs-client-proofing-gallery",
    title: "Photo Portfolio Website vs. Client Proofing Gallery: Which One Do You Actually Need?",
    description:
      "A plain-English guide for photographers deciding between a public portfolio, client proofing system, or full business platform.",
    audience: "Photographers comparing gallery platforms",
    readTime: "5 min read",
    publishedAt: "2026-07-07",
    keywords: ["photo portfolio website", "client proofing gallery", "photography gallery platform"],
    sections: [
      {
        heading: "The difference is the job the gallery is doing",
        body: [
          "A portfolio gallery exists to make a small, intentional set of images look excellent. A proofing gallery exists to help a client review a larger set, favorite images, download files, and sometimes order prints.",
          "Those are related workflows, but they are not the same product decision. If your first goal is to show taste, style, and range, the portfolio should come first. If your first goal is delivering an event, proofing becomes more important.",
        ],
      },
      {
        heading: "Why curated portfolios convert differently",
        body: [
          "Most prospects do not need to see every image you delivered last year. They need to feel confident that you can create the kind of work they want to be associated with.",
          "A curated portfolio helps because it removes visual clutter. Fewer images, stronger covers, clean captions, and mobile-first navigation make the work easier to understand.",
        ],
      },
      {
        heading: "A practical rule",
        body: [
          "Use a portfolio-first system when you want to publish your best work quickly, embed it on an existing website, or send a clean link to a prospect.",
          "Use proofing-heavy tools when your daily workflow depends on favorites, contracts, invoices, print fulfillment, and delivery galleries. Many photographers eventually use both, but the public presentation should not feel like an afterthought.",
        ],
      },
    ],
  },
  {
    slug: "how-many-photos-should-be-in-a-photography-portfolio",
    title: "How Many Photos Should Be in a Photography Portfolio?",
    description:
      "A simple framework for choosing a strong portfolio size without overwhelming visitors on desktop or mobile.",
    audience: "Photographers editing their public work",
    readTime: "4 min read",
    publishedAt: "2026-07-07",
    keywords: ["photography portfolio size", "best photos for portfolio", "curated photo gallery"],
    sections: [
      {
        heading: "More images do not always create more confidence",
        body: [
          "A portfolio is not a storage dump. It is a guided viewing experience. If the first twelve images are excellent and the next thirty are merely good, the extra images can weaken the impression.",
          "For most photographers, a focused portfolio of 10 to 25 images per category is easier to browse and easier to remember.",
        ],
      },
      {
        heading: "Build around covers and sequence",
        body: [
          "Start by choosing the image that should represent the whole portfolio. That cover creates the first click.",
          "Then arrange the images like a short story: strong opening, visual variety, no near-duplicates, and a closing image that leaves a clear impression.",
        ],
      },
      {
        heading: "Hide without deleting",
        body: [
          "A good portfolio workflow should let you keep images in the portfolio while hiding them from public view. That gives you room to experiment without destroying your working set.",
          "If you are unsure about an image, hide it first. If the portfolio gets stronger, leave it hidden or remove it later.",
        ],
      },
    ],
  },
  {
    slug: "embed-a-photography-portfolio-on-your-existing-website",
    title: "How to Embed a Photography Portfolio on Your Existing Website",
    description:
      "Why embedded photo galleries are useful for photographers who already have a website and do not want to rebuild everything.",
    audience: "Photographers with an existing website",
    readTime: "5 min read",
    publishedAt: "2026-07-07",
    keywords: ["embed photo portfolio", "iframe photography gallery", "photography website gallery"],
    sections: [
      {
        heading: "You may not need a whole new website",
        body: [
          "Many photographers already have a homepage, about page, blog, contact form, and SEO footprint. Rebuilding the whole site just to improve the gallery can create unnecessary work.",
          "An embed lets the portfolio live inside the existing website while the gallery system handles presentation, mobile viewing, covers, captions, and updates.",
        ],
      },
      {
        heading: "What an embed should do well",
        body: [
          "The embedded gallery should load cleanly, respect the selected portfolio, and avoid distracting controls. It should also preserve the subscriber's image order, hidden-photo choices, and cover image.",
          "The best embed experience gives you a single block of code you can place in WordPress, Squarespace, Webflow, Wix, custom HTML, or a studio site built by a designer.",
        ],
      },
      {
        heading: "When to use a full gallery link instead",
        body: [
          "Use an embed when visitors are already on your website and you want the portfolio to feel native.",
          "Use a direct portfolio link when you are sending work to a client, editor, curator, or prospect and want a focused full-screen viewing experience.",
        ],
      },
    ],
  },
  {
    slug: "mobile-photo-import-for-photographers",
    title: "Mobile Photo Import for Photographers: From Phone Roll to Clean Portfolio",
    description:
      "How photographers can turn phone images into curated portfolio galleries without sorting hundreds of files on desktop first.",
    audience: "Photographers who shoot or review on mobile",
    readTime: "4 min read",
    publishedAt: "2026-07-07",
    keywords: ["mobile photo import", "phone photo gallery", "photography portfolio mobile"],
    sections: [
      {
        heading: "The phone is now part of the publishing workflow",
        body: [
          "Many photographers review, save, and share images from a phone before they ever sit down at a desktop. A modern gallery platform should support that reality.",
          "The goal is not to upload everything. The goal is to see thumbnails quickly, choose the keepers, create a portfolio, and refine the presentation.",
        ],
      },
      {
        heading: "Batch selection keeps the process sane",
        body: [
          "Loading hundreds of phone thumbnails at once can feel slow and chaotic. Reviewing about 50 thumbnails at a time gives the user enough context without overwhelming the device.",
          "After import, the photographer still needs the same controls: choose cover, reorder images, hide weak photos, caption only where useful, and publish the clean version.",
        ],
      },
      {
        heading: "Mobile viewing matters just as much",
        body: [
          "Importing from a phone is only half the story. The final portfolio should also look intentional on a phone, with swipe navigation, visible left/right controls, and no unnecessary overlays blocking the photo.",
        ],
      },
    ],
  },
  {
    slug: "lightroom-to-online-photo-portfolio-workflow",
    title: "A Better Lightroom to Online Portfolio Workflow",
    description:
      "A practical look at publishing curated Lightroom work to an online portfolio without rebuilding galleries by hand.",
    audience: "Lightroom-based photographers",
    readTime: "5 min read",
    publishedAt: "2026-07-07",
    keywords: ["Lightroom portfolio plugin", "Lightroom online gallery", "publish photos from Lightroom"],
    sections: [
      {
        heading: "Export should not be the end of the workflow",
        body: [
          "Lightroom is where many photographers select, edit, rate, and export finished images. The next step should be direct publishing into a portfolio, not a messy folder of files that still needs manual sorting.",
          "A strong workflow lets the photographer decide where the images go, what portfolio they belong to, and whether they should become public immediately or stay private during setup.",
        ],
      },
      {
        heading: "The portfolio still needs presentation controls",
        body: [
          "Publishing from Lightroom should not remove the final editorial pass. After import, the photographer should still choose the cover, hide images, reorder the sequence, and add captions only where they help.",
          "That combination keeps Lightroom as the image-production tool and the portfolio system as the presentation tool.",
        ],
      },
      {
        heading: "Why this matters for recurring publishing",
        body: [
          "Daily or weekly publishing only works when the workflow is light. The fewer steps between finished edit and clean public portfolio, the more likely photographers are to keep their site fresh.",
        ],
      },
    ],
  },
  {
    slug: "best-photo-gallery-platform-for-portfolio-first-photographers",
    title: "The Best Photo Gallery Platform for Portfolio-First Photographers",
    description:
      "What to look for when your priority is cinematic portfolio presentation instead of running every part of a photography business.",
    audience: "Portfolio-first photographers",
    readTime: "6 min read",
    publishedAt: "2026-07-07",
    keywords: ["best photo gallery platform", "photography portfolio platform", "SmugMug alternative"],
    sections: [
      {
        heading: "Start with the viewer experience",
        body: [
          "Before comparing feature lists, ask what the visitor sees first. Does the gallery feel cinematic on desktop? Does it feel effortless on mobile? Can the visitor move through images without fighting the interface?",
          "For a portfolio-first photographer, those questions matter more than the longest possible list of business tools.",
        ],
      },
      {
        heading: "The core features to prioritize",
        body: [
          "Look for chosen cover images, clean gallery grids, full-screen viewing, mobile swipe navigation, image ordering, hidden-photo controls, captions, download settings, and simple sharing.",
          "Embedding is also important. Many photographers already have a website, and they need a better gallery experience without moving the entire site.",
        ],
      },
      {
        heading: "What can come later",
        body: [
          "Client proofing, print sales, contracts, invoicing, and appointment scheduling are valuable, but they can also make the first experience heavier.",
          "The right first step is a portfolio that makes the work look better today, then business workflows can grow around that foundation.",
        ],
      },
    ],
  },
]

export const seoArticles: SeoArticle[] = [...baseSeoArticles, ...approvedSeoArticles]

export function getSeoArticlePublishTime(article: SeoArticle) {
  return article.publishedAt.includes("T")
    ? article.publishedAt
    : `${article.publishedAt}T00:00:00-04:00`
}

export function isSeoArticlePublished(article: SeoArticle, now = new Date()) {
  return new Date(getSeoArticlePublishTime(article)).getTime() <= now.getTime()
}

export function getPublishedSeoArticles(now = new Date()) {
  return seoArticles.filter((article) => isSeoArticlePublished(article, now))
}

export function getSeoArticle(slug: string) {
  return seoArticles.find((article) => article.slug === slug)
}
