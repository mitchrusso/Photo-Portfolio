import type { WebsiteTemplate } from "@/lib/website-builder-rules"

export type MarketingTemplate = {
  bestFor: string
  category: "Bold" | "Cinematic" | "Editorial" | "Minimal" | "Storytelling"
  description: string
  id: WebsiteTemplate
  label: string
}

export const marketingTemplates: MarketingTemplate[] = [
  { id: "blank-canvas", label: "Blank canvas", category: "Minimal", description: "Begin with an open page and choose every section, order, color, type style, and portfolio presentation.", bestFor: "Photographers who want complete control" },
  { id: "scroll-stack", label: "Scroll stack", category: "Cinematic", description: "Layer large portfolio panels through the scroll, then finish with a continuously moving image strip.", bestFor: "Travel, lifestyle, campaigns, and visual stories" },
  { id: "kinetic-headline", label: "Kinetic headline", category: "Bold", description: "Pair a full visual stage with a moving oversized headline that gives the opening immediate energy.", bestFor: "Commercial, architecture, cities, and brand work" },
  { id: "atelier-split", label: "Atelier split", category: "Editorial", description: "Balance an elegant identity panel with a numbered project carousel and restrained navigation.", bestFor: "Architecture, interiors, fashion, and premium studios" },
  { id: "triptych-stage", label: "Triptych stage", category: "Cinematic", description: "Present three photographs together in an immersive edge to edge stage.", bestFor: "Portraits, fashion, monochrome, and character studies" },
  { id: "commercial-casebook", label: "Commercial casebook", category: "Editorial", description: "Lead with a concise positioning statement, then organize commissioned work as labeled projects.", bestFor: "Campaigns, agencies, directors, and commercial studios" },
  { id: "studio-split", label: "Studio split", category: "Cinematic", description: "Keep studio identity fixed beside a tall visual stage built for photographs or hero video.", bestFor: "Hospitality, destinations, architecture, and production" },
  { id: "swiss-sequence", label: "Swiss sequence", category: "Editorial", description: "Use precise typography, generous space, and an asymmetric sequence to make every choice feel deliberate.", bestFor: "Fashion, fine art, and highly curated work" },
  { id: "object-stage", label: "Object stage", category: "Minimal", description: "Float individual photographs through quiet space like objects arranged in a design studio.", bestFor: "Products, food, still life, and crafted objects" },
  { id: "specimen-wall", label: "Specimen wall", category: "Minimal", description: "Create a quiet collection wall with an almost invisible interface and details revealed on hover.", bestFor: "Nature, macro, archives, and fine art" },
  { id: "quiet-sequence", label: "Quiet sequence", category: "Minimal", description: "Give one photograph at a time complete attention with fixed navigation and an optional index.", bestFor: "Landscape, architecture, artwork, and deliberate series" },
  { id: "acclaim-portfolio", label: "Acclaim portfolio", category: "Editorial", description: "Combine a centered photographic stage with structured recognition and project context.", bestFor: "Wedding, editorial, and established professionals" },
  { id: "cinematic-home", label: "Cinematic home", category: "Cinematic", description: "Open with a full screen photograph, then move into a strong portfolio grid and minimal navigation.", bestFor: "Travel, landscape, and fine art" },
  { id: "editorial-rail", label: "Editorial rail", category: "Editorial", description: "Place a restrained navigation rail beside one carefully framed photograph.", bestFor: "Editorial, sports, portraits, and assignments" },
  { id: "masonry-journal", label: "Masonry journal", category: "Storytelling", description: "Preserve mixed image shapes in a dense full frame wall beside a dark portfolio rail.", bestFor: "Documentary work and mixed orientation portfolios" },
  { id: "dark-filmstrip", label: "Dark filmstrip", category: "Cinematic", description: "Use a dramatic image stage, full frame viewing, project context, and a navigable film strip.", bestFor: "Adventure, landscape, equestrian, and cinematic work" },
  { id: "coral-panorama", label: "Coral panorama", category: "Bold", description: "Combine an oversized studio identity with a horizontally moving contact sheet.", bestFor: "Commercial, lifestyle, fashion, and assignments" },
  { id: "editorial-story", label: "Editorial story", category: "Storytelling", description: "Blend photographs and writing into a paced story that feels closer to a feature than a gallery.", bestFor: "Documentary, travel, editorial, and personal projects" },
  { id: "cinematic-chapters", label: "Cinematic chapters", category: "Storytelling", description: "Organize a body of work into visual chapters with immersive transitions and strong pacing.", bestFor: "Long form stories, campaigns, and travel series" },
  { id: "museum-index", label: "Museum index", category: "Minimal", description: "Present a disciplined visual archive with quiet museum inspired labels and navigation.", bestFor: "Fine art, collections, archives, and exhibitions" },
  { id: "split-hero", label: "Split hero", category: "Editorial", description: "Introduce the photographer and the work together in a balanced two panel opening.", bestFor: "Portrait, commercial, and personal brand portfolios" },
  { id: "gallery-wall", label: "Gallery wall", category: "Minimal", description: "Turn the page into a clean exhibition wall that keeps attention on the complete body of work.", bestFor: "Broad portfolios, fine art, and collections" },
  { id: "clean-grid", label: "Clean portfolio grid", category: "Minimal", description: "Make many projects easy to scan in a polished, responsive grid with little visual interference.", bestFor: "General portfolios and photographers with many projects" },
  { id: "editorial-magazine", label: "Editorial magazine", category: "Editorial", description: "Use strong type, image rhythm, and magazine inspired spacing to frame a point of view.", bestFor: "Fashion, culture, portraits, and editorial work" },
  { id: "story-journal", label: "Story journal", category: "Storytelling", description: "Mix visual sequences and written context in a personal journal style presentation.", bestFor: "Travel diaries, documentary work, and ongoing stories" },
  { id: "travel-atlas", label: "Travel atlas", category: "Storytelling", description: "Organize destinations and visual stories in a navigation system inspired by maps and field notes.", bestFor: "Travel, expeditions, and location based portfolios" },
  { id: "panorama-scroll", label: "Panorama scroll", category: "Cinematic", description: "Let wide photographs and visual sequences travel horizontally across the screen.", bestFor: "Panoramas, landscapes, architecture, and environments" },
  { id: "museum-wall", label: "Museum wall", category: "Minimal", description: "Create an exhibition style wall with measured spacing and quiet supporting information.", bestFor: "Fine art, exhibitions, and coherent collections" },
  { id: "portrait-card", label: "Portrait card", category: "Editorial", description: "Build an approachable introduction around a strong portrait, identity, and selected work.", bestFor: "Portraitists, personal brands, and independent studios" },
  { id: "gear-notebook", label: "Gear notebook", category: "Storytelling", description: "Connect photographs, field notes, equipment, and recommendations in one useful presentation.", bestFor: "Educators, reviewers, travel photographers, and creators" },
  { id: "bold-color", label: "Bold color", category: "Bold", description: "Use saturated color, oversized type, and graphic contrast to make the portfolio unmistakable.", bestFor: "Fashion, youth culture, music, and expressive commercial work" },
]

export const marketingTemplateCategories = ["All", "Cinematic", "Editorial", "Minimal", "Storytelling", "Bold"] as const
