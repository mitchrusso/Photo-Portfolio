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
      "Use the Library for organization work: search, filter, select photos, add tags, hide or show photos in bulk, permanently delete selected photos, and edit photo details.",
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
      "Choose Delete in the selected-photo toolbar to permanently remove one or many selected photos. PhotoView.io asks for confirmation before deleting the originals, display images, and thumbnails.",
      "Bulk tags preserve existing tags. Shared captions fill blank captions by default so existing writing is protected; turn that safeguard off only when you intend to replace captions.",
      "Bulk actions are designed for fast cleanup after import, especially when a phone or Lightroom upload creates a large batch.",
    ],
    keywords: ["bulk", "bulk edit", "select", "selected", "bulk tag", "bulk caption", "bulk location", "bulk date", "bulk hide", "bulk show", "bulk delete", "delete photos", "batch"],
  },
  {
    title: "Deleting photos and portfolios",
    summary: "Delete removes stored files permanently; Hide keeps the files while removing them from public display.",
    details: [
      "For one photo, select it in Library and choose Delete photo in the details pane, or use Delete inside its portfolio.",
      "For several photos, select the checkboxes in Library, then choose Delete followed by the number selected.",
      "To remove an entire portfolio and every photo stored inside it, open that portfolio and choose Delete portfolio. Type DELETE when PhotoView.io asks for final confirmation.",
      "PhotoView.io keeps at least one portfolio in every workspace. Create another portfolio before deleting the final remaining one.",
      "Deletion cannot be undone. Use Hide instead whenever you may want the photo again later.",
    ],
    keywords: ["delete", "delete photo", "delete photos", "delete portfolio", "remove gallery", "permanent", "trash", "hide instead"],
  },
  {
    title: "Creating portfolios",
    summary: "Photos live in portfolios, and portfolios can be organized into named galleries.",
    details: [
      "Open Galleries in the left menu to see the Current gallery. A subscriber's original gallery is called My Gallery until they give it a more personal name.",
      "Choose Rename beside the Current gallery to change its name. Everything already inside that gallery stays exactly where it is.",
      "Choose Add new gallery to create a new, empty parent gallery such as Travel, Client work, or Fine art.",
      "When more than one gallery exists, use Switch gallery to choose the gallery whose portfolios you want to work with.",
      "Delete empty gallery appears only for an empty named gallery. PhotoView.io refuses to delete a gallery that still contains portfolios, so portfolios and photos cannot be removed accidentally.",
      "Use Add new portfolio under Portfolios, then choose the named parent gallery, optional client, and status.",
      "After the portfolio exists, upload photos, choose the cover image inside that portfolio, set visibility, and adjust photo order.",
      "Move an existing portfolio into a gallery from Settings, Gallery, Gallery organization. Choose Unfiled portfolios to remove it from its current gallery without deleting it.",
      "To move an individual photo, open Library, select the photo, choose Move to another portfolio, select the destination portfolio, and confirm. The files are not duplicated and total storage does not increase.",
      "To move several photos together, select them in Library, choose a destination under Move selected photos to portfolio, and confirm once. Photos already in the destination are skipped.",
      "Portfolio cover selection belongs inside the portfolio, not in general site settings.",
      "Cover, Hide, Unhide, photo order, and Delete actions save automatically; there is no separate Save button for these actions.",
    ],
    keywords: ["portfolio", "gallery", "add new portfolio", "create", "organize", "client", "status", "save", "autosave"],
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
    summary: "Subscribers can share the full portfolio grid or one specific portfolio; public gallery share buttons always share the complete current gallery.",
    details: [
      "Use Sharing settings to choose the share target and copy the generated link.",
      "Generated Sharing links use an opaque, unguessable security token instead of exposing the subscriber or portfolio name in the address. PhotoView.io validates the token and maps it to the exact full grid, portfolio, or photograph selected; changing characters in the token makes the link invalid.",
      "A Private link stays out of public portfolio directories and requires its valid secure link. A Password portfolio requires both the secure link and its password. A Public portfolio remains intentionally discoverable from the subscriber's published public grid.",
      "After Copy is clicked successfully, the control changes to a checkmark and Copied so the subscriber knows the complete secure link reached the clipboard.",
      "Social buttons appear when the subscriber has configured those social accounts in Social Settings. Enter an @handle, a plain handle, or a full public profile URL; PhotoView.io converts handles into the appropriate platform link when the field is left or the settings are saved.",
      "For LinkedIn company pages or other uncommon account addresses, paste the complete public URL rather than a handle.",
      "On a public gallery, Share gallery opens a preview showing exactly what social platforms receive: one cover/social preview image, the portfolio title, and a link to the complete gallery.",
      "Facebook, LinkedIn, and X do not receive every gallery image as a social-media album. They receive the gallery link and ordinarily show one link-preview image; anyone who opens the link can browse every visible image in that gallery.",
      "The public gallery header does not currently publish the displayed photo as a standalone social-media photo. Use the gallery-level controls when the intended destination is the complete portfolio.",
      "QR code opens a PhotoView.io panel with a scannable version of the same gallery link. Download or print it for signs, handouts, business cards, or another screen; a visitor scans it with a phone camera and taps the link to open the complete gallery.",
      "When viewing the QR code on the same phone that should open the gallery, use Copy link or another share option instead of trying to scan the phone's own screen.",
      "Hidden photos are not displayed or shared publicly.",
    ],
    keywords: ["share", "link", "social", "social handle", "account handle", "facebook", "linkedin", "instagram", "pinterest", "copy", "qr", "qr code", "preview", "cover", "one photo", "whole gallery", "complete gallery"],
  },
  {
    title: "Running an automated social media campaign",
    summary: "The Social Scheduler designs, reviews, schedules, and publishes selected portfolio photographs to eligible connected social accounts.",
    details: [
      "Open Settings, then Scheduler. To follow the guided version, select Take a Tour and choose Run a social campaign.",
      "Choose the portfolio that contains the photographs for this campaign. A saved social plan belongs to that portfolio, so different portfolios can keep different designs, audiences, messages, and schedules.",
      "Start in Design the campaign. Choose Original photo, Gallery spotlight, Editorial story, Client invitation, or Print launch, then edit the campaign name, headline, supporting text, call-to-action label, and destination link.",
      "Campaign direction is a private planning note. It helps the subscriber record the purpose and intended viewer action, but it is never included in the published post.",
      "Show PhotoView.io branding adds a small signature to designed posts. Turn it off when the photograph or campaign should carry only the subscriber's identity.",
      "Designed campaign images are rendered at 1200 by 1200 pixels. Original photo publishes a clean square crop without a graphic overlay; the other templates create a finished campaign image around the selected photograph.",
      "Enter a complete destination beginning with http:// or https:// when the campaign should lead to a booking page, inquiry form, print offer, event registration, article, or another approved destination. When no custom destination is entered, the public portfolio link can be used as the fallback.",
      "Choose the exact visible photographs to include. The queue follows the selected photographs in portfolio order, always skips hidden work, and stops after the final selected image unless Repeat is enabled.",
      "Choose one to three posts per publishing day, the number of days between publishing days, the hourly spacing between same-day posts, the local date and time for the first post, and the timezone shown in Scheduler.",
      "Use Repeat only for an ongoing evergreen campaign. Leave it off for launches, client invitations, events, limited releases, and any campaign that should end after the last selected photograph.",
      "Edit an individual queued caption when one photograph needs different context. Campaign copy and the chosen destination still remain available as the consistent series message.",
      "Use the queue preview to confirm every designed image, caption, destination link, selected account, and exact posting time before activating the campaign.",
      "Save plan stores the campaign as a draft and never publishes anything. Activate publishing creates the delivery queue only after the plan is valid and at least one eligible account is connected and selected.",
      "Direct scheduled publishing currently supports eligible Facebook Pages and Instagram Professional accounts connected through Meta. Personal Facebook profiles and personal Instagram accounts are not eligible for these publishing APIs.",
      "Choose Connect Facebook and Instagram to open Meta's OAuth consent screen. PhotoView.io can discover multiple eligible destinations returned by Meta, and the subscriber can select every connected account that should receive the campaign.",
      "A social connection stores an encrypted, revocable access token. PhotoView.io never asks for or stores the subscriber's Facebook or Instagram password.",
      "Public social-profile URLs entered in Social Settings are for profile links and manual sharing; they do not authorize automatic publishing. An account must appear as Connected in Scheduler before it can receive scheduled posts.",
      "After activation, Recent delivery activity shows pending, processing, published, failed, retried, or canceled deliveries. Platform post identifiers are recorded when the provider returns them.",
      "Pause publishing to stop unpublished deliveries while keeping the plan. Disconnect an account to revoke it inside PhotoView.io and cancel its pending deliveries; the subscriber can reconnect later through Meta.",
      "PhotoView.io retries temporary publishing failures. If a connection expires, a permission changes, or a platform rejects an image or caption, review Recent delivery activity, reconnect the account when requested, correct the plan, and activate again.",
      "The destination URL is included in post text, but each platform controls whether links are clickable and how previews appear. Always review the platform's final post after the first campaign delivery.",
    ],
    keywords: ["schedule", "scheduler", "social automation", "campaign", "campaign tutorial", "post design", "template", "original photo", "gallery spotlight", "editorial story", "client invitation", "print launch", "call to action", "destination link", "posts per day", "spacing", "timezone", "queue", "publish later", "activate publishing", "save plan", "pause", "repeat", "connect account", "connect multiple", "connect multiple facebook and instagram accounts", "oauth", "facebook page", "instagram professional", "multiple accounts", "delivery history", "failed post", "retry"],
  },
  {
    title: "Embedding portfolios",
    summary: "Subscribers can embed selected photographs, one portfolio, several portfolios, or their complete portfolio collection on an existing website.",
    details: [
      "Open Settings, then Sharing. Under Create an embed, choose a selection of photographs, one portfolio, a selection of portfolios, or the entire portfolio collection.",
      "Portfolio embed permission applies only to the portfolio currently selected in Portfolio settings. Turning it off excludes that portfolio anywhere an embed would otherwise include it; it does not limit every embed to that portfolio.",
      "The embed panel generates an iframe code block that can be pasted into another website.",
      "Embeds remain hosted by PhotoView.io. Reordering or hiding photographs updates the outside website automatically, and hidden photographs are never included.",
      "For security, only portfolios set to Public can be embedded. Private link, Password, and client-portal portfolios remain unavailable through readable embed URLs and must use their protected viewing flow.",
      "Use embed controls when a subscriber wants PhotoView.io presentation without replacing their existing website.",
    ],
    keywords: ["embed", "iframe", "website", "existing website", "code", "portfolio grid", "embed photo", "embed one portfolio", "embed multiple portfolios", "embed all portfolios", "embed permission"],
  },
  {
    title: "Building a photographer website",
    summary: "My Website lets subscribers build a simple photographer website around their PhotoView.io portfolios.",
    details: [
      "Open My Website from the left dashboard menu to build a website around the portfolios already in PhotoView.io.",
      "The compact builder toolbar keeps Dashboard, page Focus, desktop and mobile canvas buttons, Hints, Ask AI How To, Take a Tour, theme, Save changes, and Address in one row. Preview stays available in the sticky Live Canvas header while you work.",
      "Site templates appear in a horizontal filmstrip above the workspace. The selected template is marked In use, and choosing another template keeps the subscriber's content while changing its presentation.",
      "The left Build your site menu contains one expandable Template controls card followed by expandable page cards. On a narrow screen, this menu stacks above the Live Canvas.",
      "Open Template controls to adjust colors, font style, image frame, line thickness, and image shape. The controls have their own vertical scroll area, and the Live Canvas updates as settings change.",
      "Use the Gallery wall template when the website should behave like a clean visual index: title and navigation on top, then a large grid of selected portfolio cover images.",
      "Open Home, About me, What's in My Bag, Trips or Blog, Useful Articles, Contact, or Custom page in the left menu to edit that page. Click the same page heading again, or use Close, to collapse its editor.",
      "Each expanded page card contains its headline, body, images, visibility, navigation, and section-specific options while the result remains visible in the Live Canvas.",
      "For About, Trips, Articles, Contact, What's in My Bag, or a Custom page, turn on Show navigation link and choose Show at top or Show at bottom. Top links appear in the website header; bottom links appear in the website footer. Existing websites keep their links at the top unless the subscriber changes them.",
      "Every published subscriber website footer identifies the PhotoView.io Terms, PhotoView.io Privacy, and PhotoView.io Copyright & DMCA links as platform policies. It also explains that the subscriber is solely responsible for their website content and that PhotoView.io provides the publishing platform. Subscriber-selected bottom navigation links appear above that notice.",
      "Edit section opens the controls for the section currently shown in the Live Canvas. A highlighted message confirms which section is being edited and points to the open controls in the Build your site panel on the left.",
      "Hero video playback is paused inside the builder so editing does not repeatedly retrieve the video. Use Preview to verify motion and looping exactly as visitors will see it; Preview and the published website still play the video.",
      "Turn on Edit Hints in the website-builder toolbar, then point to a headline, paragraph, image, gallery, or page section. The contextual hint explains what controls it, and Show me opens the correct page card, scrolls to the setting, focuses it, and highlights the exact control.",
      "Select Take a Tour when you want guided setup. Choose a tour such as first website, homepage, portfolio presentation, About and Contact, equipment, or publishing; or describe the outcome in your own words so AI can choose the shortest appropriate tour.",
      "Tours use AI only to interpret the subscriber's goal. Every tour step and Show me destination comes from PhotoView.io's verified control map, so the assistant cannot invent builder settings.",
      "Choose the overall template from the filmstrip, then open Template controls to set the site background color, text color, accent color, font style, image frame, line thickness, and image shape.",
      "To choose the Hero media, select Hero on the Home page and open its media controls. The Hero can use the first featured portfolio cover, a specific portfolio cover, a visible Library photo, an uploaded image, or one MP4 video up to 200 MB and 90 seconds. Hero video plays silently on a loop, uses a poster image while loading, and counts toward storage.",
      "Open Home, select Hero, and use Headline size to adjust the overlay title from 70% to 140%. The Live Canvas, Preview, and published website use the same container-relative sizing rule, so the title keeps the same visual proportion.",
      "Use the grab bars beside page cards to change their order in the website navigation. The Live Canvas updates immediately.",
      "Under Image frame, use the Line thickness slider to control how thick the frame border appears around website images.",
      "For the About page, expand About me in the left menu to upload an optional photo. If no photo is uploaded, the About page uses a clean text-only layout with no empty image space.",
      "For What's in My Bag, expand its page card and use the Equipment controls, or select the section in the Live Canvas. Camera bodies, favorite lenses, and travel accessories each support multiple products with a name, note, optional product image, and optional product or affiliate link. Blank products are never published.",
      "Quick add gear asks whether the subscriber has an affiliate account and which retailer it belongs to. Supported choices include Amazon, B&H Photo, Adorama, Best Buy, Walmart, KEH Camera, MPB, Moment, and eBay. Choose Another retailer and enter its website when an affiliate program is not listed.",
      "List camera bodies, lenses, and accessories in plain English, one per line. PhotoView.io finds likely products from the chosen retailer, then shows an approval table with images, descriptions, categories, and links. Only checked products are added to the saved website draft.",
      "Approved What's in My Bag products appear as individual tiles grouped by category. Each tile can show the retailer-hosted product image, stable product details, and a For more info link. Amazon tracking IDs are added automatically when configured. For affiliate programs that generate a special deep link through Impact, Rakuten, or another network, paste that final link into the approved row before saving. Never enter an affiliate password, secret key, or payment information.",
      "Quick Add Gear includes an expandable How Quick Add Gear works guide at the top. Approved imports save immediately. To edit or remove a saved item later, return to What's in My Bag, open Equipment, change its fields or select the trash icon, and then click Save changes.",
      "The Work display controls can show featured portfolios, one portfolio, or all portfolios as a slideshow, thumbnail grid, film strip, or cover cards.",
      "To add multiple trips or blog entries, open My Website, expand Trips, and add or edit the trip entries. Each entry can have a title, location or date, story, button label, and an associated PhotoView.io portfolio.",
      "Under Portfolio for this trip, select the exact portfolio the trip button should open. The published button follows that portfolio automatically, so the subscriber does not need to find or paste its URL. Password-protected portfolios are marked and still require the visitor password; client portals are not offered as public website destinations.",
      "Leave Portfolio for this trip unselected only when the button should use an optional custom web address instead.",
      "Use Useful Articles for a focused evergreen article page about technique, locations, equipment, project context, or another subject connected to the work. Clear, original writing can help visitors and search engines understand the site's topics, but search ranking is never guaranteed.",
      "Use Custom page for anything that does not fit the standard pages, such as workshops, services, press, licensing, a long-term project statement, or another subscriber-defined purpose. Rename its navigation label and page title to match its job.",
      "Address lets the subscriber choose a unique name.photoview.io address. Connecting and verifying a purchased custom domain is not active yet, so entering an outside domain is not currently offered as a publishing option.",
      "To set up the contact form destination, open My Website, expand Contact in the left menu, then enter the subscriber-only Form delivery email. That delivery field is not shown to visitors.",
      "Before publishing, replace the starter text in every visible section or hide any page you are not ready to use. PhotoView.io also requires a valid Form delivery email when Contact is visible, so visitors never receive an unfinished or disabled public form.",
      "The Contact page canvas shows the visitor-facing form only. In Draft Preview, navigation links from either the top menu or footer replace the Home screen with the selected page, such as Trips or What's in My Bag. A page can therefore remain in navigation without also appearing on Home.",
      "Use Save changes after editing text, design, or page order. Preview also saves the draft before opening the visitor-facing preview, which includes a Back to builder button.",
      "Website building is different from embedding: embedding places a PhotoView.io gallery on an existing external site, while My Website creates a PhotoView.io-powered site experience.",
    ],
    keywords: [
      "my website",
      "website builder",
      "edit hints",
      "tours",
      "show me",
      "walkthrough",
      "build website",
      "build my website",
      "homepage template",
      "custom page",
      "useful articles",
      "seo article",
      "search ranking",
      "custom domain",
      "purchased domain",
      "website address",
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
      "trip portfolio",
      "associate portfolio with trip",
      "view portfolio button",
      "articles",
      "what's in my bag",
      "whats in my bag",
      "background color",
      "text color",
      "preview website",
      "save website draft",
      "footer navigation",
      "show at top",
      "show at bottom",
      "terms of service",
      "privacy policy",
    ],
  },
  {
    title: "Social Settings",
    summary: "Social Settings stores the subscriber's public account handles or URLs so share buttons can appear in sharing panels.",
    details: [
      "Add social account handles or URLs in Social Settings.",
      "Configured platforms become active share buttons in the Sharing tab and portfolio/photo sharing areas.",
      "Unconfigured platforms can appear greyed out in setup guidance but should not be active share buttons.",
    ],
    keywords: ["social setup", "accounts", "facebook", "instagram", "linkedin", "x", "youtube", "tiktok"],
  },
  {
    title: "Watermarks",
    summary: "Watermarks affect public viewing only and never alter the stored original file.",
    details: [
      "Open Portfolio settings, turn on Watermark public view, then use Upload custom watermark to add your own PNG, JPG, or WebP image. A transparent PNG usually gives the cleanest result.",
      "Uploading a custom image automatically selects image watermarking. Use Type afterward if you want text only, the image only, or both together.",
      "Subscribers can choose text watermark, image watermark, or both.",
      "Adjust watermark position, opacity, and size from Portfolio settings.",
      "If an optional watermark image is missing, the app hides it instead of showing a broken-image icon.",
    ],
    keywords: ["watermark", "logo", "image watermark", "text watermark", "opacity", "position"],
  },
  {
    title: "Homepage design",
    summary: "The homepage Hero can use rotating portfolio covers, one static photograph, or a looping video.",
    details: [
      "Use Design settings to choose rotating portfolio covers or one static home image. If My Website already uses a Hero video, Design settings identifies it and links directly to the full Hero controls.",
      "Dim Hero media adds a non-destructive dark overlay to either photographs or video so text remains readable; it never changes the uploaded image or video file.",
      "Changing any setting makes the Save button red. The button returns to Saved after the changes are stored.",
      "The portfolio grid can appear below the homepage cover so visitors can go directly into galleries.",
    ],
    keywords: ["homepage", "home page", "hero video", "carousel", "static image", "dim", "cover photos", "save"],
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
    summary: "PhotoView.io can take selected photographs directly from Lightroom Classic into a new or existing portfolio, alongside its other import methods.",
    details: [
      "Open Settings, then Imports, and download the PhotoView.io Lightroom Classic plugin. Unzip it, move the PhotoViewIo.lrplugin folder somewhere permanent, then add that folder from Lightroom Classic under File > Plug-in Manager.",
      "Generate the private 90-day Lightroom API key in PhotoView.io and copy the API URL and key into Lightroom's PhotoView.io Export panel. The endpoint is simply the secure receiving address; the plugin builds it automatically from the API URL.",
      "In Lightroom's Library module, select the edited photographs or collection, open File > Export, and choose PhotoView.io under Export To.",
      "Choose Create a new portfolio and enter a name, or choose Add to an existing portfolio, refresh the portfolio list, and select the destination. Click Export to send the selected photographs directly.",
      "A new portfolio is created as a draft unless Make public is selected. An existing portfolio keeps its access settings and receives the imported photographs at the end of its current order.",
      "SmugMug import can discover and bring over galleries when credentials and source URLs are configured.",
      "The desktop folder uploader can watch a local folder and send new files to the selected portfolio for tools such as Capture One, Photoshop, Affinity, DxO, ON1, Luminar, Photo Mechanic, darktable, and RawTherapee.",
      "After any import, use Library to search, tag, bulk hide, bulk show, and fill in organization metadata.",
    ],
    keywords: ["import", "endpoint", "api url", "api key", "smugmug", "lightroom", "plugin", "existing portfolio", "new portfolio", "desktop uploader", "folder", "library", "bulk"],
  },
  {
    title: "AI curation help",
    summary: "The AI Portfolio Assistant gives preview-only suggestions for portfolio polish and sharing copy.",
    details: [
      "Ask AI How To can answer questions about Social Settings, Library organization, search, tags, captions, covers, sharing, embeds, imports, account, and storage.",
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
      "Instagram, TikTok, and YouTube do not provide dependable public web-share posting, so PhotoView.io copies the link and opens the configured account page when those buttons are used.",
    ],
    keywords: ["social", "sharing assistant", "facebook", "instagram", "linkedin", "pinterest", "x", "email", "copy"],
  },
  {
    title: "Sending feedback or reporting a bug",
    summary: "Signed-in subscribers can send a bug, improvement, question, or general feedback without leaving PhotoView.io.",
    details: [
      "Select Bug/Feature Request in the lower-left corner of a subscriber screen.",
      "Choose Bug, Improvement, Question, or Feedback, then describe what happened or what you would like to see.",
      "The form fills in the signed-in subscriber's name and email address automatically and includes the current PhotoView.io page with the message.",
      "Use Take screenshot to attach the visible PhotoView.io screen, or Attach files to include supporting files. The screenshot and files must stay within the limits shown in the form.",
      "Submitted messages go securely to the PhotoView.io support team. Never include passwords, API credentials, payment information, or other secrets.",
    ],
    keywords: ["bug", "feature request", "feedback", "question", "support", "screenshot", "attach file", "report a problem"],
  },
  {
    title: "Copyright complaints and DMCA notices",
    summary: "PhotoView.io has a registered Copyright Agent and a documented notice-and-takedown process for subscriber content.",
    details: [
      "The public Copyright & DMCA Policy is available at https://photoview.io/copyright and identifies the registered Copyright Agent, the required contents of a takedown notice, and the counter-notice process.",
      "Copyright notices and counter-notices must be sent to support@photoview.io with the subject DMCA Takedown Notice or DMCA Counter-Notice. The official Copyright Office registration number is DMCA-1075905.",
      "A claimant should identify the copyrighted work, the exact disputed material and PhotoView.io URL, provide contact information and a signature, and include the required good-faith and accuracy statements.",
      "If PhotoView.io removes or disables material after a substantially compliant notice, it will take reasonable steps to notify the subscriber. A subscriber who believes the action resulted from mistake or misidentification may submit a counter-notice containing the elements listed in the policy.",
      "After forwarding a substantially compliant counter-notice, PhotoView.io will restore access in not less than 10 and not more than 14 business days unless the claimant reports a filed court action or restoration is otherwise prohibited.",
      "Do not use the Bug/Feature Request form for a legal notice. Do not decide ownership, fair use, or licensing disputes through AI Help; consult qualified counsel when legal advice is needed.",
    ],
    keywords: ["copyright", "dmca", "takedown", "take down", "counter notice", "counter-notice", "infringement", "copyright agent", "repeat infringer", "stolen photo", "legal notice"],
  },
  {
    title: "Account and billing",
    summary: "The account page shows plan, storage usage, trial/billing status, and plan management controls.",
    details: [
      "Subscribers should use My Account for plan status, usage, billing portal, upgrade/downgrade, cancellation, and payment method changes.",
      "Use Replace payment card to open Stripe directly at the secure payment-method update screen. The new card becomes the default billing method.",
      "Stripe stores payment methods; PhotoView.io should never store raw credit card numbers.",
      "Trial and subscription status are synced from Stripe through checkout and webhook events.",
    ],
    keywords: ["account", "billing", "stripe", "trial", "cancel", "upgrade", "credit card", "payment", "lost card", "stolen card", "replace card"],
  },
  {
    title: "Referral storage bonuses",
    summary: "Each eligible referral that becomes paid earns the referring account a one-time permanent 1 GB storage bonus.",
    details: [
      "Select Earn more storage in the lower-left corner, or open My Account, to reach the personal referral link.",
      "The reward is granted once when the referred trial first becomes a paid subscription; it does not repeat at annual renewal.",
      "Referral rewards add storage capacity only. They do not add free subscription months, cash credit, or transferable value.",
      "Earned referral capacity remains available while the referring PhotoView.io account is active and in good standing.",
    ],
    keywords: ["referral", "refer", "reward", "bonus", "capacity", "storage bonus", "free month", "affiliate link"],
  },
  {
    title: "Storage usage",
    summary: "Storage is tied to subscriber plans and reflects the files kept for each portfolio.",
    details: [
      "Current public plan allowances are Starter 5 GB storage, Growth 20 GB, Studio 50 GB, and Premier 150 GB.",
      "PhotoView.io is positioned for curated portfolio publishing with generous included storage, not unlimited dumping of every source file.",
      "Storage includes originals, display images, and thumbnails when those files exist.",
      "PhotoView.io measures stored originals, display images, and thumbnails so account capacity remains accurate.",
      "The Storage and My Account views explain subscriber usage. The SuperAdmin dashboard tracks subscribers, usage, plans, financials, coupons, audit, rights, and security areas.",
    ],
    keywords: ["storage", "usage", "capacity", "metering", "admin", "superadmin"],
  },
]

const ignoredHelpWords = new Set([
  "about", "does", "every", "from", "have", "help", "what", "when", "where", "which", "with", "work", "your",
])

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !ignoredHelpWords.has(word))
}

export function findRelevantAiHelpTopics(question: string, limit = 6) {
  const questionTerms = tokenize(question)
  const normalizedQuestion = question.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

  return aiHelpTopics
    .map((topic) => {
      const haystack = new Set(tokenize([
        topic.title,
        topic.summary,
        topic.details.join(" "),
        topic.keywords.join(" "),
      ].join(" ")))
      const keywordPhraseScore = topic.keywords.reduce((score, keyword) => {
        const normalizedKeyword = keyword.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
        return normalizedKeyword.length > 2 && normalizedQuestion.includes(normalizedKeyword) ? score + 12 : score
      }, 0)
      const termScore = questionTerms.reduce((score, term) => {
        if (haystack.has(term)) return score + 4
        return score + (Array.from(haystack).some((word) => word.includes(term) || term.includes(word)) ? 1 : 0)
      }, 0)
      const score = keywordPhraseScore + termScore

      return { score, topic }
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ topic }) => topic)
}
