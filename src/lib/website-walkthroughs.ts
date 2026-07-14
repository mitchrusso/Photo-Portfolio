import type { WebsiteSectionOrderKey } from "./website-builder-rules"

export type WebsiteControlTarget = "body" | "content" | "headline" | "media" | "section" | "visibility"
export type WebsiteWalkthroughGoal = "about-contact" | "first-site" | "gear" | "homepage" | "portfolio" | "publish"
export type WebsiteWalkthroughDestination =
  | { control: WebsiteControlTarget; kind: "section"; sectionKey: WebsiteSectionOrderKey }
  | { kind: "tool"; tool: "pages" | "style" }
  | { kind: "address" }
  | { kind: "preview" }

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
  { goal: "first-site", label: "Build my first website", note: "A complete guided setup from hero to Preview" },
  { goal: "homepage", label: "Improve my homepage", note: "Clarify the opening message, image, and design" },
  { goal: "portfolio", label: "Show my photography", note: "Choose portfolios and how visitors browse them" },
  { goal: "about-contact", label: "Tell my story", note: "Create About and Contact sections visitors trust" },
  { goal: "gear", label: "Add my equipment", note: "Build camera, lens, and accessory recommendations" },
  { goal: "publish", label: "Get ready to publish", note: "Review navigation, address, and final Preview" },
]

const walkthroughs: Record<WebsiteWalkthroughGoal, WebsiteWalkthrough> = {
  "first-site": {
    goal: "first-site",
    title: "Build your first photography website",
    intro: "Merlin will guide you through the few decisions that make the biggest difference, then take you to a clean final Preview.",
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
    intro: "This walkthrough focuses on the opening message, visual hierarchy, and the work visitors see first.",
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
    intro: "Merlin will help decide which work appears and whether it is shown as a grid, slideshow, film strip, or portfolio cards.",
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
      { id: "gear-navigation", title: "Check the menu label", description: "Choose the words visitors will see in the website’s top navigation.", destination: { control: "visibility", kind: "section", sectionKey: "page:gear" } },
    ],
  },
  publish: {
    goal: "publish",
    title: "Prepare the website for publishing",
    intro: "Merlin will check the visitor path, contact destination, website address, and final Preview in a sensible order.",
    steps: [
      { id: "publish-navigation", title: "Review pages and navigation", description: "Confirm which pages appear in the top menu and how each one is labeled.", destination: { kind: "tool", tool: "pages" } },
      { id: "publish-contact", title: "Confirm contact delivery", description: "Make sure visitor inquiries have a valid delivery email.", destination: { control: "content", kind: "section", sectionKey: "page:contact" } },
      { id: "publish-address", title: "Review the website address", description: "Set the PhotoViewPro address or prepare a custom domain.", destination: { kind: "address" } },
      { id: "publish-preview", title: "Open the final Preview", description: "Inspect the complete visitor experience before sharing the address.", destination: { kind: "preview" } },
    ],
  },
}

export function getWebsiteWalkthrough(goal: WebsiteWalkthroughGoal): WebsiteWalkthrough {
  return walkthroughs[goal]
}

export function classifyWebsiteWalkthroughGoal(request: string): WebsiteWalkthroughGoal {
  const normalized = request.toLowerCase()
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
      return { title: `Edit ${sectionLabel}`, description: `Open ${sectionLabel} in the Build panel to change this section.` }
  }
}
