import type { WebsiteSectionOrderKey } from "./website-builder-rules"

export type WebsiteControlTarget = "body" | "content" | "headline" | "media" | "section" | "visibility"
export type SettingsWalkthroughTab = "setup" | "account" | "design" | "sharing" | "scheduler" | "gallery" | "imports" | "mobile" | "storage"
export type WebsiteWalkthroughGoal = "about-contact" | "first-site" | "gear" | "homepage" | "portfolio" | "publish" | "settings-overview" | "social-campaign" | "start-here"
export type WebsiteWalkthroughDestination =
  | { control: WebsiteControlTarget; kind: "section"; sectionKey: WebsiteSectionOrderKey }
  | { kind: "panel"; panel: "library" | "photos" | "website" }
  | { kind: "tool"; tool: "pages" | "style" }
  | { kind: "address" }
  | { kind: "preview" }
  | { kind: "scheduler" }
  | { kind: "settings"; tab: SettingsWalkthroughTab }

export type WebsiteWalkthroughStep = {
  description: string
  destination: WebsiteWalkthroughDestination
  id: string
  title: string
}

export type WebsiteWalkthrough = {
  goal: WebsiteWalkthroughGoal
  intro: string
  steps: WebsiteWalkthroughStep[]
  title: string
}

export const websiteWalkthroughGoalOptions: Array<{ goal: WebsiteWalkthroughGoal; label: string; note: string }> = [
  { goal: "start-here", label: "Start Here: Tour PhotoView.io", note: "The complete recommended path from first upload to sharing" },
  { goal: "first-site", label: "Build my first website", note: "A complete guided setup from hero to Preview" },
  { goal: "homepage", label: "Improve my homepage", note: "Clarify the opening message, image, and design" },
  { goal: "portfolio", label: "Show my photography", note: "Choose portfolios and how visitors browse them" },
  { goal: "about-contact", label: "Tell my story", note: "Create About and Contact sections visitors trust" },
  { goal: "gear", label: "Add my equipment", note: "Build camera, lens, and accessory recommendations" },
  { goal: "social-campaign", label: "Run a social campaign", note: "Design, connect, schedule, review, and publish" },
  { goal: "publish", label: "Get ready to publish", note: "Review navigation, address, and final Preview" },
]

export const settingsWalkthroughGoalOptions: Array<{ goal: WebsiteWalkthroughGoal; label: string; note: string }> = [
  { goal: "start-here", label: "Start Here: Tour PhotoView.io", note: "The complete recommended path from first upload to sharing" },
  { goal: "settings-overview", label: "Tour every Settings page", note: "Nine short stops covering Social Settings through Storage" },
]

export const dashboardWalkthroughGoalOptions: Array<{ goal: WebsiteWalkthroughGoal; label: string; note: string }> = [
  { goal: "start-here", label: "Start Here: Tour PhotoView.io", note: "The complete recommended path from first upload to sharing" },
  { goal: "first-site", label: "Build my first website", note: "Create and preview a complete photography website" },
  { goal: "social-campaign", label: "Run a social campaign", note: "Design, schedule, review, and publish across connected accounts" },
  { goal: "settings-overview", label: "Tour every Settings page", note: "Understand every control before making changes" },
]

const walkthroughs: Record<WebsiteWalkthroughGoal, WebsiteWalkthrough> = {
  "start-here": {
    goal: "start-here",
    title: "Start Here: Learn PhotoView.io",
    intro: "Follow this recommended path once to understand what PhotoView.io does, where each job belongs, and what to do first. Nothing is published until you choose to share or publish it.",
    steps: [
      { id: "start-dashboard", title: "Begin with your portfolio dashboard", description: "See the active portfolio, upload photographs, choose a cover, arrange the display order, hide work, and preview what visitors will see. Changes here save automatically.", destination: { kind: "panel", panel: "photos" } },
      { id: "start-organize", title: "Organize the complete photo library", description: "Use Library to search, tag, caption, move, or remove photographs across portfolios. This is the best place for bulk organization.", destination: { kind: "panel", panel: "library" } },
      { id: "start-website", title: "Build the public website", description: "Open My Website to choose a template and create the home, About, Trips, Articles, Contact, equipment, and custom pages. Preview before anything goes live.", destination: { kind: "panel", panel: "website" } },
      { id: "start-social", title: "Add social account shortcuts", description: "Open Social Settings and enter account handles or public URLs. These destinations become available when you share your work.", destination: { kind: "settings", tab: "setup" } },
      { id: "start-design", title: "Choose the gallery presentation", description: "Open Design to preview a real portfolio with different gallery templates, themes, layouts, image frames, and cover treatments.", destination: { kind: "settings", tab: "design" } },
      { id: "start-gallery", title: "Set privacy, access, and watermarks", description: "Open Gallery to control the selected portfolio's public access, downloads, labels, cover behavior, and text or custom-image watermark.", destination: { kind: "settings", tab: "gallery" } },
      { id: "start-sharing", title: "Share exactly what you intend", description: "Open Sharing to choose all portfolios, one portfolio, or individual photographs. Copy a secure link, send an email invitation, create a QR code, or prepare an embed.", destination: { kind: "settings", tab: "sharing" } },
      { id: "start-campaign", title: "Create an automated social campaign", description: "Open Scheduler to choose photographs, design the post, write the message and call to action, connect eligible accounts, set the timing, review the queue, and activate only when ready.", destination: { kind: "scheduler" } },
      { id: "start-mobile", title: "Prepare mobile access", description: "Choose the portfolios for a phone-friendly companion, send its link, and add it to a mobile home screen for quick presentation access.", destination: { kind: "settings", tab: "mobile" } },
      { id: "start-account", title: "Review the account and storage", description: "Confirm the signed-in email, plan, billing, usage, and storage capacity. These pages also explain what counts toward the plan limit.", destination: { kind: "settings", tab: "account" } },
      { id: "start-preview", title: "Preview before publishing", description: "Return to the website builder, check every page as a visitor, then publish only when the address, navigation, contact details, and starter copy are ready.", destination: { kind: "preview" } },
    ],
  },
  "first-site": {
    goal: "first-site",
    title: "Build your first photography website",
    intro: "This tour guides you through the few decisions that make the biggest difference, then takes you to a clean final Preview.",
    steps: [
      { id: "first-hero-copy", title: "Introduce your work", description: "Write a clear headline and one supporting sentence for the opening screen.", destination: { control: "headline", kind: "section", sectionKey: "home:hero" } },
      { id: "first-hero-image", title: "Choose the opening photograph", description: "Pick the image visitors should remember first and set its focal point.", destination: { control: "media", kind: "section", sectionKey: "home:hero" } },
      { id: "first-featured", title: "Choose your strongest work", description: "Select the portfolios or photographs that deserve the first gallery position.", destination: { control: "content", kind: "section", sectionKey: "home:featuredPortfolio" } },
      { id: "first-about", title: "Add the photographer behind the work", description: "Write a short, human About section and optionally add your portrait.", destination: { control: "body", kind: "section", sectionKey: "page:about" } },
      { id: "first-contact", title: "Make contact possible", description: "Add the email address that should receive visitor inquiries.", destination: { control: "content", kind: "section", sectionKey: "page:contact" } },
      { id: "first-design", title: "Choose the visual finish", description: "Review the template, colors, typography, frame, and image shape together.", destination: { kind: "tool", tool: "style" } },
      { id: "first-preview", title: "Review the visitor experience", description: "Open the full draft Preview and inspect the website without builder controls.", destination: { kind: "preview" } },
    ],
  },
  homepage: {
    goal: "homepage",
    title: "Polish your homepage",
    intro: "This tour focuses on the opening message, visual hierarchy, and the work visitors see first.",
    steps: [
      { id: "home-headline", title: "Sharpen the main headline", description: "Change, hide, or remove the headline over the hero image.", destination: { control: "headline", kind: "section", sectionKey: "home:hero" } },
      { id: "home-image", title: "Set the hero image", description: "Choose a portfolio cover, a Library photo, or a custom upload.", destination: { control: "media", kind: "section", sectionKey: "home:hero" } },
      { id: "home-intro", title: "Tighten the introduction", description: "Explain what kind of photography visitors are about to see.", destination: { control: "body", kind: "section", sectionKey: "home:textBlock" } },
      { id: "home-featured", title: "Curate featured work", description: "Choose the work source and presentation that follows the opening.", destination: { control: "content", kind: "section", sectionKey: "home:featuredPortfolio" } },
      { id: "home-design", title: "Compare the design", description: "Try templates, colors, fonts, image frames, and shapes while watching the canvas.", destination: { kind: "tool", tool: "style" } },
    ],
  },
  portfolio: {
    goal: "portfolio",
    title: "Build a stronger photography presentation",
    intro: "This tour helps you decide which work appears and whether it is shown as a grid, slideshow, film strip, or portfolio cards.",
    steps: [
      { id: "portfolio-featured", title: "Choose the featured work", description: "Select one portfolio, a curated set, or everything visible.", destination: { control: "content", kind: "section", sectionKey: "home:featuredPortfolio" } },
      { id: "portfolio-grid", title: "Configure the full portfolio grid", description: "Choose what the larger browsing section should include.", destination: { control: "content", kind: "section", sectionKey: "home:portfolioGrid" } },
      { id: "portfolio-headline", title: "Name the section", description: "Give visitors a useful reason to explore the work, or hide the headline entirely.", destination: { control: "headline", kind: "section", sectionKey: "home:featuredPortfolio" } },
      { id: "portfolio-design", title: "Finish the gallery style", description: "Adjust the template, image frame, shape, typography, and colors.", destination: { kind: "tool", tool: "style" } },
    ],
  },
  "about-contact": {
    goal: "about-contact",
    title: "Tell your story and invite contact",
    intro: "This path helps visitors understand the photographer and gives them a clear way to start a conversation.",
    steps: [
      { id: "story-about-headline", title: "Write the About headline", description: "Use a short headline that sounds like you, or hide it if the photograph should lead.", destination: { control: "headline", kind: "section", sectionKey: "page:about" } },
      { id: "story-about-body", title: "Write the photographer story", description: "Add the useful personal context visitors need without writing a full biography.", destination: { control: "body", kind: "section", sectionKey: "page:about" } },
      { id: "story-about-image", title: "Add an optional portrait", description: "Upload a photographer portrait or leave the section text-only.", destination: { control: "media", kind: "section", sectionKey: "page:about" } },
      { id: "story-contact", title: "Set the contact destination", description: "Choose where visitor messages should be delivered.", destination: { control: "content", kind: "section", sectionKey: "page:contact" } },
    ],
  },
  gear: {
    goal: "gear",
    title: "Build What’s in My Bag",
    intro: "Add the equipment you genuinely use, explain why it matters, and optionally attach product or affiliate links.",
    steps: [
      { id: "gear-intro", title: "Introduce the equipment list", description: "Write a short note explaining how you choose and use your gear.", destination: { control: "body", kind: "section", sectionKey: "page:gear" } },
      { id: "gear-products", title: "Find cameras, lenses, and accessories", description: "Use Quick add gear to list products in plain English, choose a major retailer or any custom affiliate store, review likely matches, and approve the correct tiles.", destination: { control: "content", kind: "section", sectionKey: "page:gear" } },
      { id: "gear-navigation", title: "Check the navigation link", description: "Choose the words visitors will see and whether the link belongs in the top menu or website footer.", destination: { control: "visibility", kind: "section", sectionKey: "page:gear" } },
    ],
  },
  "social-campaign": {
    goal: "social-campaign",
    title: "Build and run a social media campaign",
    intro: "This tour takes you through the complete campaign workflow without publishing until you explicitly activate the reviewed plan.",
    steps: [
      { id: "social-purpose", title: "Choose the campaign purpose", description: "Open Scheduler, choose the portfolio, and name the campaign so its goal stays clear while you build it.", destination: { kind: "scheduler" } },
      { id: "social-design", title: "Select a design and message", description: "Choose Original photo, Gallery spotlight, Editorial story, Client invitation, or Print launch. Add the headline, supporting text, call to action, destination link, and private campaign direction.", destination: { kind: "scheduler" } },
      { id: "social-photos", title: "Choose the exact photographs", description: "Select only the visible photographs you want included. Hidden work is always skipped, and selected photographs follow portfolio order.", destination: { kind: "scheduler" } },
      { id: "social-accounts", title: "Connect and select destinations", description: "Securely connect eligible Facebook Pages and Instagram Professional accounts through Meta, then choose every account that should receive this campaign.", destination: { kind: "scheduler" } },
      { id: "social-pace", title: "Set the publishing pace", description: "Choose the first local date and time, posts per publishing day, days between publishing days, spacing between posts, and whether the campaign should repeat.", destination: { kind: "scheduler" } },
      { id: "social-posts", title: "Review every prepared post", description: "Edit per-post text when needed and confirm each designed image, caption, destination link, selected account, and exact publishing time in the queue preview.", destination: { kind: "scheduler" } },
      { id: "social-save", title: "Save without publishing", description: "Choose Save plan whenever you want to keep the campaign as a draft. Saving never sends a social post.", destination: { kind: "scheduler" } },
      { id: "social-activate", title: "Activate when everything is ready", description: "Activate publishing only after the queue and connected destinations are correct. Return to Scheduler to monitor delivery history, pause the plan, or disconnect an account.", destination: { kind: "scheduler" } },
    ],
  },
  publish: {
    goal: "publish",
    title: "Prepare the website for publishing",
    intro: "This tour checks the visitor path, contact destination, website address, and final Preview in a sensible order.",
    steps: [
      { id: "publish-navigation", title: "Review pages and starter text", description: "Confirm which pages appear in the top menu or footer, replace their starter text, and hide anything that is not ready.", destination: { kind: "tool", tool: "pages" } },
      { id: "publish-contact", title: "Confirm contact delivery", description: "Make sure visitor inquiries have a valid delivery email.", destination: { control: "content", kind: "section", sectionKey: "page:contact" } },
      { id: "publish-address", title: "Review the website address", description: "Set the PhotoView.io address or prepare a custom domain.", destination: { kind: "address" } },
      { id: "publish-preview", title: "Open the final Preview", description: "Inspect the complete visitor experience before sharing the address.", destination: { kind: "preview" } },
    ],
  },
  "settings-overview": {
    goal: "settings-overview",
    title: "Tour PhotoView.io Settings",
    intro: "This tour opens every Settings page and explains the result each one controls. You can stop at any step to make changes, then continue whenever you are ready.",
    steps: [
      { id: "settings-setup", title: "Add your social profiles", description: "Open Social Settings to add the public account handles or URLs that PhotoView.io uses for sharing shortcuts.", destination: { kind: "settings", tab: "setup" } },
      { id: "settings-account", title: "Know which account is open", description: "Confirm the signed-in email, then review the plan, trial, usage, billing, referrals, cancellation, and access controls.", destination: { kind: "settings", tab: "account" } },
      { id: "settings-design", title: "Design the gallery experience", description: "Select a preview portfolio, compare templates, and tune the visual presentation while watching the live preview.", destination: { kind: "settings", tab: "design" } },
      { id: "settings-sharing", title: "Choose exactly what you share", description: "Select a target, then use its link, email invitation, embed, social destination, or QR code with a clear preview of the outcome.", destination: { kind: "settings", tab: "sharing" } },
      { id: "settings-scheduler", title: "Build a complete social campaign", description: "Design the campaign, choose photographs and connected accounts, set the pace, review every post, and activate only when ready.", destination: { kind: "settings", tab: "scheduler" } },
      { id: "settings-gallery", title: "Control the active gallery", description: "Set access, privacy, downloads, covers, labels, and text or custom-image watermarks for the selected portfolio.", destination: { kind: "settings", tab: "gallery" } },
      { id: "settings-imports", title: "Choose an import system", description: "The Imports workspace has full pages for Lightroom, Phone, Smart Folders, SmugMug Import, and Photo Upload. Each page explains setup, destination choices, and what happens after the photographs arrive.", destination: { kind: "settings", tab: "imports" } },
      { id: "settings-mobile", title: "Prepare a mobile companion", description: "Choose which portfolios appear, send the phone-friendly link, and install it on a home screen for fast access.", destination: { kind: "settings", tab: "mobile" } },
      { id: "settings-storage", title: "Understand capacity", description: "Review usage, learn which generated and original files count, and see how PhotoView.io handles accounts approaching their plan limit.", destination: { kind: "settings", tab: "storage" } },
    ],
  },
}

export function getWebsiteWalkthrough(goal: WebsiteWalkthroughGoal): WebsiteWalkthrough {
  return walkthroughs[goal]
}

export function classifyWebsiteWalkthroughGoal(request: string): WebsiteWalkthroughGoal {
  const normalized = request.toLowerCase()
  if (/social|campaign|facebook|instagram|schedule (a )?post|automatic post|publish (a )?post/.test(normalized)) return "social-campaign"
  if (/camera|lens|gear|bag|equipment|affiliate|accessor/.test(normalized)) return "gear"
  if (/about|bio|story|contact|inquir|email form/.test(normalized)) return "about-contact"
  if (/publish|domain|address|go live|launch|ready to share/.test(normalized)) return "publish"
  if (/portfolio|gallery|slideshow|film strip|thumbnail|show my (work|photo)/.test(normalized)) return "portfolio"
  if (/hero|homepage|home page|headline|opening|first image/.test(normalized)) return "homepage"
  return "first-site"
}

export function getWebsiteEditHint(
  sectionLabel: string,
  control: WebsiteControlTarget,
): { description: string; title: string } {
  switch (control) {
    case "headline":
      return { title: "Edit this headline", description: `Change, hide, or remove it in ${sectionLabel} → Headline.` }
    case "body":
      return { title: "Edit this text", description: `Change or hide this copy in ${sectionLabel} → Body text.` }
    case "media":
      return { title: "Change this image", description: `Choose or adjust the image in ${sectionLabel} → Image controls.` }
    case "content":
      return { title: `Edit ${sectionLabel}`, description: `Manage the items and presentation in ${sectionLabel} → Content.` }
    case "visibility":
      return { title: "Change visibility or navigation", description: `Show, hide, or rename this page in ${sectionLabel} → Visibility.` }
    default:
      return { title: `Edit ${sectionLabel}`, description: `Expand ${sectionLabel} in the Build your site menu to change this section.` }
  }
}
