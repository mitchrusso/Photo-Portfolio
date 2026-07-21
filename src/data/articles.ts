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

export const seoArticles: SeoArticle[] = [
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

export function getSeoArticle(slug: string) {
  return seoArticles.find((article) => article.slug === slug)
}
