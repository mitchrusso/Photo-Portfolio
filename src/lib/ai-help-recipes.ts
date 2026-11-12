export type AiHelpRecipe = {
  id: string
  topic: string
  questions: string[]
  steps: string[]
}

export type RankedAiHelpRecipe = {
  recipe: AiHelpRecipe
  score: number
}

/**
 * Verified, task-level answers for subscriber-facing PhotoView functions.
 * Keep each answer to one action per step and no more than four steps.
 */
export const aiHelpRecipes: AiHelpRecipe[] = [
  { id: "start-tour", topic: "Getting started", questions: ["start here tour", "get started", "first portfolio"], steps: ["Open Dashboard and select Start Here Tour.", "Open or create one portfolio.", "Upload 10 to 25 photographs.", "Set a cover and review the public link."] },
  { id: "photoview-structure", topic: "understand PhotoView's Library, Portfolios, and Galleries", questions: ["photoview works very differently", "difference between library portfolio and gallery", "libraries portfolios and galleries", "library portfolios galleries", "how photoview is organized", "confused about portfolios and galleries"], steps: ["Watch the PhotoView introduction: https://youtu.be/4snxazGsOy0", "Use the Library as the central collection of photographs you have brought into PhotoView.", "Create Portfolios as curated selections of photographs you want to present together.", "Use Galleries to group related Portfolios by subject, location, project, or another theme."] },
  { id: "open-library", topic: "Library organization", questions: ["open library", "organize all photos", "photo library"], steps: ["Select Library in the left menu.", "Search or filter the photographs.", "Select a photograph to open its details."] },
  { id: "search-library", topic: "Searching and filtering photos", questions: ["search photos", "filter photos", "find a photo", "reset photo search"], steps: ["Open Library.", "Enter a word in Search photos.", "Choose All, Visible, Hidden, Untagged, or No caption.", "Select Reset to clear the search."] },
  { id: "edit-metadata", topic: "Tags, categories, trips, and metadata", questions: ["add tags", "edit metadata", "add location", "add camera", "add photo notes", "add trip"], steps: ["Open Library and select a photograph.", "Edit its caption, tags, category, trip, location, or date.", "Open Camera and notes for equipment or private notes.", "Select Save changes."] },
  { id: "resize-library-details", topic: "Library organization", questions: ["resize library details", "make details wider", "expand photo details", "full width photo info", "move library divider"], steps: ["Open Library and select a photograph.", "Drag the divider beside Details left or right.", "Choose Expand for a full-width panel.", "Choose Restore to return to the photo grid."] },
  { id: "bulk-edit", topic: "Bulk library actions", questions: ["bulk edit", "bulk tag", "bulk caption", "bulk hide", "bulk show", "select shown"], steps: ["Open Library and select the photographs.", "Choose Show, Hide, Move, or Bulk metadata.", "Enter the shared change.", "Confirm the action."] },
  { id: "delete-photos", topic: "Deleting photos and portfolios", questions: ["delete photo", "delete several photos", "bulk delete photos"], steps: ["Open Library and select the photographs.", "Choose Delete in the selected-photo toolbar.", "Review the number selected.", "Confirm permanent deletion."] },
  { id: "delete-portfolio", topic: "Deleting photos and portfolios", questions: ["delete portfolio", "remove portfolio"], steps: ["Open the portfolio.", "Choose Delete portfolio.", "Type DELETE.", "Confirm permanent deletion."] },
  { id: "rename-portfolio", topic: "Renaming portfolios and galleries", questions: ["rename portfolio", "change portfolio name"], steps: ["Open the portfolio.", "Open Settings > Portfolio > Portfolio controls.", "Edit Portfolio name.", "Leave the field to save."] },
  { id: "manage-galleries", topic: "Creating portfolios", questions: ["create gallery", "rename gallery", "switch gallery", "delete empty gallery"], steps: ["Open Galleries in the left menu.", "Choose Add new gallery, Rename, or Switch gallery.", "Enter or select the gallery.", "Confirm the change."] },
  { id: "create-portfolio", topic: "Creating portfolios", questions: ["create portfolio", "add new portfolio", "new portfolio"], steps: ["Select Add new portfolio in the left menu.", "Enter the portfolio name.", "Choose its gallery and status.", "Select Create portfolio."] },
  { id: "move-portfolio", topic: "Creating portfolios", questions: ["move portfolio", "organize portfolio into gallery", "unfile portfolio"], steps: ["Open the portfolio.", "Open Settings > Portfolio > Gallery organization.", "Choose a gallery or Unfiled portfolios.", "Confirm the change."] },
  { id: "move-photos", topic: "Bulk library actions", questions: ["move photo", "move several photos", "move selected photos"], steps: ["Open Library and select the photographs.", "Choose Move selected photos to portfolio.", "Select the destination portfolio.", "Confirm the move."] },
  { id: "upload-assets", topic: "Uploading photos and video", questions: ["upload photos", "upload video", "upload psd", "upload jxl", "photo and video upload"], steps: ["Open the destination portfolio.", "Choose Add photos or video.", "Select the supported files.", "Keep the page open until upload completes."] },
  { id: "set-cover", topic: "Portfolio cover images", questions: ["set portfolio cover", "change portfolio cover", "cover image"], steps: ["Open the portfolio in tiled view.", "Select the photograph.", "Choose Set portfolio cover."] },
  { id: "reorder-photos", topic: "Photo order", questions: ["reorder photos", "change photo order", "sort photos", "chronological order", "date order"], steps: ["Open the portfolio in tiled view.", "Drag each photograph into position.", "Review the public portfolio sequence."] },
  { id: "customize-portfolio", topic: "Customizing a portfolio view", questions: ["customize portfolio", "portfolio design", "standalone portfolio"], steps: ["Open the portfolio.", "Open Settings > Design.", "Choose the preview portfolio and design options.", "Review the public portfolio link."] },
  { id: "portfolio-growth-limits", topic: "manage a growing portfolio", questions: ["maximum number of images per portfolio", "image limit per portfolio", "keep adding photographs to existing portfolio", "large portfolio loading time"], steps: ["Keep adding photos to an existing portfolio; PhotoView sets no separate image-count limit per portfolio or gallery.", "Plan storage is Starter 5 GB, Growth 20 GB, Studio 50 GB, and Premier 150 GB.", "Remember that stored originals and generated display files both use storage.", "Split a portfolio only when a year, trip, location, or series would be easier for visitors to browse."] },
  { id: "portfolio-home", topic: "Portfolio Home navigation", questions: ["portfolio home button", "back to home", "portfolio home link"], steps: ["Publish the photographer website.", "Open a portfolio from that website.", "Select Home in the portfolio header."] },
  { id: "hide-photo", topic: "Hiding and showing photos", questions: ["hide photo", "unhide photo", "show hidden photo"], steps: ["Open the portfolio or Library.", "Select the photograph.", "Choose Hide or Unhide."] },
  { id: "photo-labels", topic: "Captions and file names", questions: ["show captions", "hide file name", "photo display text", "remove filename"], steps: ["Open Settings > Portfolio.", "Find Photo display text.", "Choose Caption, File name, or Nothing."] },
  { id: "hide-filenames-sitewide", topic: "Website-wide photo file names", questions: ["hide file names everywhere", "hide filenames sitewide", "website wide file names"], steps: ["Open My Website > Template controls.", "Turn on Hide photo file names.", "Save and publish the website."] },
  { id: "prevent-right-click", topic: "Prevent right-click image saving", questions: ["prevent right click", "block save image", "stop copying photos"], steps: ["Open My Website > Template controls.", "Turn on Prevent right click to copy image.", "Save and publish the website."] },
  { id: "info-pane", topic: "Info pane", questions: ["show info pane", "hide info pane", "photo info panel"], steps: ["Open the portfolio.", "Open Settings > Portfolio.", "Turn the Info pane on or off."] },
  { id: "mobile-view", topic: "Mobile viewing", questions: ["view portfolio on phone", "swipe photos", "mobile viewing"], steps: ["Open the public portfolio on the phone.", "Tap a photograph for full-screen viewing.", "Swipe left or right through the sequence."] },
  { id: "phone-import", topic: "Mobile importing", questions: ["import from phone", "phone import", "mobile import"], steps: ["Open Settings > Imports > Phone.", "Choose photographs or video.", "Clear any unwanted thumbnails.", "Name and create the portfolio."] },
  { id: "mobile-companion", topic: "Mobile companion links", questions: ["mobile companion", "add photoview to phone", "phone home screen"], steps: ["Open Settings > Mobile.", "Choose the public portfolios to include.", "Copy or send the companion link.", "Open it on the phone and choose Add to Home Screen."] },
  { id: "portfolio-access", topic: "Portfolio access and visitor controls", questions: ["make portfolio public", "private link", "password protect portfolio", "two factor portfolio", "visitor access"], steps: ["Open Settings > Portfolio.", "Choose Public, Private link, or Password.", "Set password or email verification when needed.", "Copy the resulting public link."] },
  { id: "allow-downloads", topic: "Portfolio access and visitor controls", questions: ["allow downloads", "disable downloads", "portfolio downloads"], steps: ["Open Settings > Portfolio.", "Find the download control.", "Turn downloads on or off."] },
  { id: "share-link", topic: "Sharing portfolios and photos", questions: ["share portfolio", "copy portfolio link", "share photo", "qr code"], steps: ["Open Settings > Sharing.", "Choose the portfolio or photographs.", "Copy the link or open QR code.", "Send or place the saved link or code."] },
  { id: "social-campaign", topic: "Running an automated social media campaign", questions: ["create social campaign", "schedule social posts", "activate campaign"], steps: ["Open Settings > Scheduler.", "Choose photographs and connected accounts.", "Set the timing and review every post.", "Select Activate when ready."] },
  { id: "embed-portfolio", topic: "Embedding portfolios", questions: ["embed portfolio", "iframe", "embed on website", "shopify embed"], steps: ["Open Settings > Sharing.", "Create or select an embed profile.", "Choose its portfolio or photographs.", "Copy the iframe into the outside website."] },
  { id: "responsive-width", topic: "Responsive website width", questions: ["website width", "adaptive width", "full screen width"], steps: ["Open My Website > Template controls.", "Choose Adaptive Width or Full Screen.", "Preview desktop and mobile.", "Save and publish."] },
  { id: "scroll-stack", topic: "Scroll Stack portfolio cards", questions: ["scroll stack", "portfolio cards", "scrolling cards"], steps: ["Open My Website.", "Choose a template that supports Scroll Stack.", "Set the portfolio section display to Scroll Stack.", "Preview and publish."] },
  { id: "image-frame", topic: "Website image frames", questions: ["remove hero frame", "remove gold border", "image frame", "frame thickness"], steps: ["Open My Website > Template controls.", "Under Image frame, choose None or another style.", "Adjust frame thickness when available.", "Save and publish."] },
  { id: "custom-page", topic: "Custom website pages", questions: ["create custom page", "add website page", "custom website page"], steps: ["Open My Website.", "Add or select Custom page.", "Enter the page title and content.", "Save and publish."] },
  { id: "article-submenu", topic: "Custom website pages", questions: ["put custom page under articles", "articles submenu", "group article pages"], steps: ["Open My Website and select the custom article page.", "Turn on Show navigation link.", "Under Menu location, choose Under Articles submenu.", "Save and publish."] },
  { id: "showcase-submit", topic: "Sharing", questions: ["submit photo to showcase", "share with other photographers", "public photo discovery"], steps: ["Make the source portfolio public and published.", "Open the portfolio and select the photograph.", "Choose Submit to Showcase.", "Visit PhotoView.io Showcase to confirm the opt-in listing."] },
  { id: "reuse-photo-details", topic: "Library", questions: ["copy previous photo details", "reuse metadata", "populate details from last image"], steps: ["Open Library and select the next photograph.", "Choose Use previous photo details.", "Change any fields that differ.", "Select Save changes."] },
  { id: "email-signup-form", topic: "Email signup forms", questions: ["add email signup", "newsletter form", "mailchimp form", "aweber form", "convertkit form", "kit signup", "mailerlite form", "email opt in"], steps: ["Open My Website > Home page blocks.", "Select Email signup form.", "Paste the form code or hosted form link from your email provider.", "Save, preview, and publish."] },
  { id: "hide-photo-navigation-arrows", topic: "Photo navigation arrows", questions: ["hide photo arrows", "hide navigation arrows", "remove next previous buttons", "turn off left right arrows"], steps: ["Open My Website > Template controls.", "Turn on Hide onscreen photo navigation arrows.", "Save and publish the website.", "Desktop arrow keys and mobile swiping will continue to work."] },
  { id: "accordion-story", topic: "Accordion story", questions: ["accordion story", "accordion page", "expandable story"], steps: ["Open My Website.", "Choose the Accordion Story template or section.", "Add the story headings and text.", "Preview and publish."] },
  { id: "website-background", topic: "Multiple website backgrounds", questions: ["upload website background", "change background image", "saved backgrounds"], steps: ["Open My Website > Template controls.", "Upload or select a saved background.", "Adjust brightness or Screen back.", "Save and publish."] },
  { id: "create-website", topic: "Managing multiple websites", questions: ["create another website", "create website draft", "multiple websites", "create free draft"], steps: ["Open Settings > My Websites.", "Select Create free draft.", "Name the website.", "Open it from the My Website menu."] },
  { id: "activate-website", topic: "Managing multiple websites", questions: ["activate website", "publish additional website", "make website live"], steps: ["Open Settings > My Websites.", "Select the draft.", "Open Activate this website.", "Choose its address and complete activation."] },
  { id: "connect-domain", topic: "Website address and custom domain", questions: ["custom url", "custom domain", "connect domain", "own domain", "website address"], steps: ["Open My Website and choose the website.", "Select Address in the top toolbar.", "Choose Purchased custom domain > Connect domain.", "Follow the displayed DNS steps."] },
  { id: "build-website", topic: "Building a photographer website", questions: ["build website", "set up photographer website", "create my site"], steps: ["Open My Website.", "Choose a template.", "Add pages, blocks, text, and portfolios.", "Preview, save, and publish."] },
  { id: "august-features", topic: "August 2026 feature roundup", questions: ["august 2026 features", "august feature roundup"], steps: ["Select the bell in the dashboard header.", "Open the August 2026 update.", "Choose a feature link to open its control."] },
  { id: "november-features", topic: "November 2026 workflow updates", questions: ["november 2026 features", "november feature roundup", "latest workflow updates"], steps: ["Select the bell in the dashboard header.", "Review the newest Library and website-editing updates.", "Choose Tour the newest features for guided setup."] },
  { id: "new-features", topic: "What's new notifications", questions: ["what is new", "new features", "feature notifications", "whats new"], steps: ["Select the bell in the dashboard header.", "Open a PhotoView update.", "Follow its link to the related control."] },
  { id: "social-settings", topic: "Social Settings", questions: ["add social links", "social settings", "connect social account", "instagram profile"], steps: ["Open Settings > Social Settings.", "Enter each public profile URL.", "Save the settings."] },
  { id: "watermark", topic: "Watermarks", questions: ["add watermark", "custom watermark", "watermark photos"], steps: ["Open Settings > Portfolio.", "Turn on Watermark.", "Choose text, image, or both.", "Set its position and save."] },
  { id: "homepage-hero", topic: "Homepage design", questions: ["change homepage hero", "hero image", "hero video", "rotate cover images"], steps: ["Open Settings > Design > Home page Hero.", "Choose Hero video, Rotate cover images, or Static image.", "Select the media and dimming.", "Preview and save."] },
  { id: "gallery-presentation-template", topic: "Gallery presentation templates", questions: ["gallery template", "gallery presentation template", "sidecar browse", "live gallery preview", "settings design template"], steps: ["Open Settings > Design.", "Select a Gallery template, such as Sidecar Browse.", "Review it in Live gallery preview and choose the Preview portfolio you want to display.", "Select Save to apply it to your public portfolio grid."] },
  { id: "choose-template", topic: "Templates and layout", questions: ["change website template", "choose website template", "website layout", "website template filmstrip"], steps: ["Open My Website.", "Choose a website template from the filmstrip.", "Keep current settings or apply recommended settings.", "Preview and publish."] },
  { id: "lightroom-install", topic: "Imports", questions: ["install lightroom plugin", "lightroom plugin setup", "connect lightroom"], steps: ["Open Settings > Imports > Lightroom.", "Download and unzip PhotoViewIo.lrplugin.", "In Lightroom Classic, open File > Plug-in Manager > Add.", "Select PhotoViewIo.lrplugin and confirm Installed and running."] },
  { id: "lightroom-export", topic: "Imports", questions: ["export from lightroom", "send photos from lightroom", "lightroom import"], steps: ["Select photographs in Lightroom Classic.", "Open File > Export and choose PhotoView.io.", "Choose a new or existing portfolio.", "Select Export."] },
  { id: "lightroom-key", topic: "Imports", questions: ["lightroom api key", "private import key", "lightroom key expired"], steps: ["Open Settings > Imports > Lightroom.", "Turn on Lightroom imports.", "Select Generate key, then Copy.", "Paste it into Lightroom's API Key field."] },
  { id: "adobe-bridge-publish", topic: "Imports", questions: ["adobe bridge", "bridge publish extension", "publish from bridge", "bridge export"], steps: ["Open Settings > Imports > Adobe Bridge.", "Download the extension and follow its README to install the startup script.", "Select finished photographs in Bridge, then choose Tools > PhotoView.io > Publish selected photos.", "Paste the PhotoView URL and private key, choose a portfolio, and select Publish."] },
  { id: "smart-folder", topic: "Imports", questions: ["create smart folder", "smart folder setup", "sync external drive", "sync google drive"], steps: ["Open Settings > Imports > Smart Folders.", "Enable Smart Folder imports.", "Add a route from one local folder to one portfolio.", "Copy and run the watcher command."] },
  { id: "smugmug-import", topic: "Imports", questions: ["import smugmug", "connect smugmug", "smugmug galleries"], steps: ["Open Settings > Imports > SmugMug Import.", "Select Connect SmugMug and approve access.", "Choose the galleries.", "Select Import."] },
  { id: "ai-curation", topic: "AI curation help", questions: ["ai portfolio assistant", "suggest cover", "ai description", "ai captions", "duplicate review"], steps: ["Open a portfolio.", "Open AI Portfolio Assistant.", "Choose the suggestion you want.", "Review it before selecting Apply or Use."] },
  { id: "social-copy", topic: "Social Sharing Assistant", questions: ["write sharing copy", "social sharing assistant", "social caption"], steps: ["Open a portfolio > AI Portfolio Assistant.", "Choose Write sharing copy.", "Select Copy beside the platform draft.", "Paste it into the selected platform."] },
  { id: "report-issue", topic: "Sending feedback or reporting a bug", questions: ["report bug", "send feedback", "feature request", "contact support"], steps: ["Select Bug/Feature Request in the lower-left corner.", "Choose Bug, Improvement, Question, or Feedback.", "Describe the issue and attach evidence when useful.", "Select Submit."] },
  { id: "dmca", topic: "Copyright complaints and DMCA notices", questions: ["dmca notice", "copyright complaint", "stolen photo"], steps: ["Open photoview.io/copyright.", "Collect the required work, URL, contact, signature, and legal statements.", "Email the notice to support@photoview.io."] },
  { id: "manage-billing", topic: "Account and billing", questions: ["manage billing", "change plan", "replace payment card", "cancel subscription", "billing portal"], steps: ["Open Settings > My Account.", "Open Billing controls.", "Choose plan, payment-card, portal, or cancellation action.", "Complete the secure Stripe screen when opened."] },
  { id: "referral", topic: "Referral storage bonuses", questions: ["referral link", "earn storage", "refer photographer"], steps: ["Open My Account or select Earn more storage.", "Copy the personal referral link.", "Send it to the photographer.", "The 1 GB bonus applies after their first paid subscription."] },
  { id: "storage", topic: "Storage usage", questions: ["check storage", "storage usage", "storage limit", "what counts toward storage"], steps: ["Open Settings > Storage or My Account.", "Review used storage and plan capacity.", "Open Library to remove unneeded stored assets."] },
]

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

export function rankAiHelpRecipes(question: string): RankedAiHelpRecipe[] {
  const normalizedQuestion = ` ${normalize(question)} `

  return aiHelpRecipes
    .map((recipe) => {
      const score = recipe.questions.reduce((best, phrase) => {
        const normalizedPhrase = normalize(phrase)
        if (!normalizedPhrase) return best
        if (normalizedQuestion.includes(` ${normalizedPhrase} `)) return Math.max(best, 100 + normalizedPhrase.length)

        const terms = normalizedPhrase.split(" ")
        const matches = terms.filter((term) => normalizedQuestion.includes(` ${term} `)).length
        return Math.max(best, matches === terms.length ? 80 + normalizedPhrase.length : matches * 8)
      }, 0)
      return { recipe, score }
    })
    .sort((left, right) => right.score - left.score)
}

export function findAiHelpRecipe(question: string) {
  const [match] = rankAiHelpRecipes(question)
  return match && match.score >= 24 ? match.recipe : null
}

export function findRelevantAiHelpRecipes(question: string, limit = 3) {
  return rankAiHelpRecipes(question)
    .filter(({ score }) => score > 0)
    .slice(0, limit)
    .map(({ recipe }) => recipe)
}

export function findDefaultAiHelpRecipeForTopic(topic: string) {
  return aiHelpRecipes.find((recipe) => recipe.topic === topic) ?? null
}

export function formatAiHelpRecipeAnswer(recipe: AiHelpRecipe) {
  return recipe.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")
}

export const subscriberFeatureHelpCoverage = aiHelpRecipes.map(({ id, topic }) => ({ id, topic }))
