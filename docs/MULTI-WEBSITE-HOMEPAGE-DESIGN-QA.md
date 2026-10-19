# Multi-website homepage promotion design QA

- Source visual truth: `https://photoview.io/`, captured in the Codex in-app browser on 2026-10-19.
- Implementation: `http://localhost:4173/#multiple-websites`, captured in the Codex in-app browser on 2026-10-19.
- Desktop viewport: requested 1440 × 1100 CSS px at device density 1.
- Mobile viewport: requested 390 × 844 CSS px; the browser normalized this to 433 × 937 CSS px.
- State: public homepage, multi-website promotional section.

## Full-view comparison evidence

The live homepage capture and the local implementation capture were both opened and inspected. The implementation preserves the live site’s warm ivory surface, deep forest green, muted gold accent, editorial type hierarchy, thin borders, restrained corner radii, and photography-first composition. Browser security prevented the two captures from being composed into one side-by-side comparison document.

## Focused-region evidence

- Desktop: the complete promotional section was captured with the headline, three example websites, pricing summary, benefits, and CTAs visible.
- Mobile: the announcement, message hierarchy, price statement, benefits, and horizontally scrollable website rail were inspected. The document has no horizontal page overflow; the rail scrolls independently.
- Interaction: the announcement points to `#multiple-websites`, the primary CTA points to `/register`, and the secondary CTA points to `#pricing`.
- Browser console: no errors or warnings were reported after the preview was restarted with its local authentication secret.

## Required fidelity surfaces

- Fonts and typography: existing site type system and weights are reused; headline wrapping remains intentional at desktop and mobile widths.
- Spacing and layout rhythm: the split desktop composition is balanced; the mobile website examples use a horizontal snap rail to avoid an excessively tall stack.
- Colors and visual tokens: existing PhotoView ivory, forest, gold, border, and muted text tokens are reused.
- Image quality and asset fidelity: existing optimized PhotoView marketing photographs are used with responsive `next/image` sizing and deliberate crops.
- Copy and content: pricing, activation, unlimited drafts, PhotoView.io addresses, custom domains, and the trial CTA are stated directly.

## Comparison history

1. First desktop pass: the right visual column left excessive unused dark space.
2. Fix: vertically centered the website previews and pricing summary.
3. First mobile pass: stacking all three website previews made the section unnecessarily tall.
4. Fix: converted the examples into a contained horizontal snap rail and confirmed it does not create page-level overflow.
5. User review: the three examples still read as generic panels rather than distinct websites.
6. Fix: rebuilt every example as a miniature site with browser chrome, a named masthead, independent navigation, a unique visual template, an editorial headline, and a site-specific call to action. Fine Art now uses an image-led gallery treatment, Commercial uses a dark studio/case-study treatment, and Travel Stories uses a warm journal treatment.
7. Responsive verification: at the browser-normalized 433 px mobile width, each miniature site is 281 px wide inside a 343 px snap rail. The rail scrolls to 876 px independently while document width remains exactly 433 px.
8. Second user review: the portrait proportions still made the examples feel like similarly shaped panels.
9. Fix: replaced the portrait previews with three landscape website canvases and materially different page structures: a full-bleed panoramic fine-art homepage, an asymmetrical commercial case-study split, and an editorial travel-journal split.
10. Responsive verification: at the browser-normalized 416 px mobile width, every landscape site measures 287 × 172 px inside a 326 px snap rail. The 894 px rail scrolls independently while document width remains exactly 416 px. Desktop capture confirms all three landscape designs are simultaneously legible and visually distinct.
11. Third user review: the shared muted tan/editorial styling still made the examples feel generated from one visual system.
12. Fix: removed the shared browser frame and tan surfaces. Fine Art is now black, restrained, and image-led; Commercial is a hard-edged white/red Swiss-style grid; Travel Stories uses saturated blue, turquoise, coral, and a vivid panoramic sunset. Each preview now has a different border treatment, typography, spatial structure, and domain placement.
13. Mobile refinement: set an explicit 118 px canvas height below the small breakpoint so each 287 px preview remains unmistakably landscape instead of growing with its copy.
14. User review: the fine-art night photograph made the first design feel too dark overall.
15. Fix: replaced the night scene with a brighter blue-white Greenland glacier photograph and updated the collection title to match, preserving the black gallery frame while opening up the visual balance.
16. User review: the three previews were more distinctive, but still did not immediately read as complete websites.
17. Fix: added a full-width masthead to the top of every preview. Each masthead now keeps the site brand, PhotoView.io address, and page navigation together above the page content, while preserving the three distinct visual systems.

## Findings

- No actionable P0, P1, or P2 issue was found in the individual desktop and mobile reviews.
- Formal same-input visual comparison remains unavailable because the browser rejected the local comparison document under its URL security policy.
- User visual approval is required before commit or deployment.

final result: blocked
