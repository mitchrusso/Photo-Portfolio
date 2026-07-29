# Design QA — responsive website width and custom pages

- Source visual truth: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_SBny4p/Screenshot 2026-07-27 at 9.04.03 AM.png`
- Browser-rendered implementation:
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-width-desktop-crop.png`
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-width-mobile-crop.png`
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-builder-width-controls-crop.png`
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-builder-custom-pages-crop.png`
- Combined comparison evidence: `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-width-comparison.png`
- Desktop viewport: 1895 × 857 CSS px, device scale factor reported by the in-app browser as 0.9. The implementation capture was cropped to the browser viewport because the in-app browser screenshot backend tiled the surrounding surface.
- Mobile viewport: 390 × 844 CSS px, device scale factor 0.9. The implementation capture was cropped to the 351 × 760 browser surface; DOM measurements confirmed a 373 px document width within the 390 px viewport and no horizontal overflow.
- Source pixels: 1895 × 858.
- State: light builder chrome, Cinematic home template, Adaptive Width for the public preview; Full Screen selected in the builder control capture; five independent custom pages created in the local QA workspace.

## Full-view comparison evidence

The source showed the existing adaptive presentation: content centered over a full-bleed background with comfortable side margins. The implementation preserves that visual hierarchy and spacing in Adaptive Width. Full Screen is now an explicit alternative in Template Controls and changes the published renderer from `max-width: 1120px` to the full available width while retaining section padding as safe margins.

The custom-page implementation uses the established left-rail card system. Pages are stacked under Additional pages, use the existing gold selected state, and update the Live Canvas without introducing a new visual language.

## Focused region comparison evidence

- Template Controls: the two width choices are visible together, have concise explanatory copy, expose pressed state, and fit the existing control density.
- Additional pages: five independently addressable custom-page cards fit the existing accordion pattern; each has its own title, body, navigation label, navigation placement, visibility, headline alignment, and remove action.
- Mobile: navigation wraps without horizontal overflow, the Hero stacks vertically, and actions remain visible.

## Findings

- No actionable P0, P1, or P2 visual differences remain.
- P3: the in-app browser emitted an existing Next.js LCP advisory for the Hero image. The visible Hero image already uses eager/priority loading; this does not affect the requested layout or interaction.

## Required fidelity surfaces

- Fonts and typography: existing template font families, weights, headline hierarchy, labels, and compact helper copy are preserved.
- Spacing and layout rhythm: Adaptive Width retains the source’s centered rhythm; Full Screen removes the desktop cap while preserving responsive padding; custom-page cards match neighboring page cards.
- Colors and visual tokens: existing PhotoView cream, dark green, gold selected state, and red destructive action are reused.
- Image quality and asset fidelity: the existing subscriber imagery and background treatment are unchanged; no placeholder or synthetic asset was introduced.
- Copy and content: control names are “Adaptive Width” and “Full Screen”; the Additional pages helper explicitly states the five-page limit.

## Interaction and console checks

- Switched Adaptive Width to Full Screen and verified `aria-pressed` changed immediately.
- Created four additional pages, verified five total page records, and verified Add page disables at the limit.
- Renamed the fifth page, switched to the fourth page, and verified their values remain independent.
- Verified each custom page receives independent navigation and content controls.
- Verified desktop and mobile rendering, including no mobile horizontal overflow.
- No console errors were observed. One non-blocking existing Next.js image LCP advisory was present.

## Comparison history

No P0/P1/P2 finding was identified in the first normalized comparison, so no visual fix iteration was required after the capture.

final result: passed

---

# Coral Panorama template — Design QA — 2026-07-29

## Evidence

- Source URL: `https://www.chrissylynn.photography/index/G0000cjrpojPC3_4/thumbs`
- Source visual truth:
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/artifacts/chrissylynn-source-desktop-top-2026-07-29.png`
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/artifacts/chrissylynn-source-desktop-image-open-2026-07-29.png`
- Browser-rendered implementation:
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/artifacts/coral-panorama-builder-focused-2026-07-29.png`
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/artifacts/coral-panorama-builder-viewer-focused-2026-07-29.png`
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/artifacts/coral-panorama-builder-mobile-2026-07-29.png`
- Combined source/implementation comparison:
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/artifacts/design-qa-coral-panorama-comparison.png`
- Source capture: 1913 × 922 px. Implementation capture: 1898 × 859 px in the Chrome website builder.
- Normalization: the source page was cropped to its first 1913 × 800 px; the implementation was cropped to the 1110 × 522 px Live Canvas. Each panel was contained in a 1200 × 620 px white comparison panel. The final two-state comparison is 2400 × 1240 px.
- State: desktop contact sheet in the top row and desktop two-image viewer in the bottom row. The source and implementation use different photographs and identity copy by design; PhotoView uses subscriber-owned identity and portfolio assets.

## Full-view comparison evidence

The normalized comparison preserves the source's defining composition: an airy white identity header, oversized thin coral display text, sparse navigation, an edge-to-edge two-row horizontal contact sheet, and a two-image viewing state. The implementation keeps those mechanics while using the subscriber's site name, navigation, and photographs. The longer subscriber name wraps to two intentional lines without splitting a word.

## Focused region comparison evidence

The full comparison is sufficiently large to read the identity, primary navigation, image seams, and viewer transition. Separate focused crops were not needed. The builder captures additionally show the grid, expand, previous, and next controls, while the mobile capture verifies the responsive identity stack and horizontal photo rail.

## Required fidelity surfaces

- Fonts and typography: the implementation uses a thin sans-serif display treatment with tight negative tracking and low line height, matching the source's oversized wordmark character. Long subscriber names scale down and wrap at word boundaries.
- Spacing and layout rhythm: the large white identity field, centered sparse navigation, two-row image density, narrow seams, and edge-to-edge viewer preserve the source hierarchy. The PhotoView builder frame is excluded from the normalized comparison.
- Colors and visual tokens: the template uses a white ground and `#eb5b43` coral for identity, navigation, and controls, closely matching the source palette.
- Image quality and asset fidelity: subscriber photographs render at full image quality with responsive cover treatment. No source photography, logo, or branding was copied into PhotoView.
- Copy and content: source-specific business names and menu labels were replaced with subscriber-controlled PhotoView identity, portfolio, information, and contact labels.

## Interaction and responsive checks

- Clicking a contact-sheet photograph opens the two-image viewer.
- Previous and next controls advance the image pair.
- Grid returns to the two-row contact sheet; expand opens the two-image viewer.
- Portfolio and Info dropdowns open and expose real subscriber destinations.
- Mobile preview preserves the identity, navigation, horizontal contact sheet, and two-image viewer.
- No runtime error overlay or error alert appeared during interaction testing.

## Findings

- No actionable P0, P1, or P2 differences remain.
- P3: with a long subscriber name, the identity occupies two lines and therefore uses more header height than the source's short single-line logo. This is an intentional responsive accommodation rather than truncating or splitting the subscriber's name.

## Comparison history

1. Initial browser check found a P1 layout failure: the two contact-sheet rows collapsed to zero height inside the constrained Live Canvas. The contact sheet and viewer were changed to fill an absolute `inset-0` stage, and the sheet received an explicit full-height two-row grid. The revised browser capture shows both rows at usable height.
2. The next comparison found a P2 typography problem: the long subscriber identity broke inside “Photographer” and clipped at the edge. The responsive display size and wrapping rules were revised to preserve whole words. The final comparison shows “Mitch Russo - Photographer” on two clean lines.
3. The final normalized two-state comparison found no remaining P0, P1, or P2 issue.

## Implementation checklist

- Coral Panorama appears in the website template picker and applies its saved visual preset.
- Contact-sheet, viewer, menu, navigation, and mobile states are operational.
- Subscriber content is preserved; no reference-site assets are bundled.
- TypeScript, ESLint, 191 regression tests, production build, and diff whitespace checks pass.

final result: passed

---

# Custom Home Blocks — Design QA — 2026-07-29

## Evidence

- Source visual truth: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_UEkMmZ/Screenshot 2026-07-29 at 9.34.05 AM.png`
- Browser-rendered implementation:
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/artifacts/custom-blocks-builder-2026-07-29.png`
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/artifacts/custom-blocks-controls-2026-07-29.png`
- Combined comparison input: `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/artifacts/custom-blocks-comparison-2026-07-29.png`
- Source pixels: 356 × 660.
- Implementation pixels: 1898 × 915; Chrome CSS viewport measured 1913 × 922 at device scale factor 1.
- Comparison pixels: 1980 × 1044. The source menu was normalized to 520 px wide; the desktop implementation was normalized to 1420 px wide and placed beside it.
- State: light subscriber website builder, Museum Index template, Home page, with one unsaved text block (“Portraits”) and one unsaved curated portfolio grid. The QA data was discarded by reloading after capture.

## Full-view comparison evidence

The source establishes the existing compact card language: a narrow drag handle, a clear title and helper line, a right-side disclosure control, light cream borders, and dense vertical stacking. The implementation extends that same system in the Home page blocks menu. Add controls sit directly under the Home-block explanation, custom cards use the same drag affordance and typography, and the Live Canvas remains dominant beside the narrow editor rail.

## Focused-region comparison evidence

The focused controls screenshot clearly shows both custom cards, their expanded editing fields, visibility controls, move controls, removal action, and the associated Live Canvas. A separate crop was not needed because field labels, text, card boundaries, and canvas content are legible at the captured density.

## Required fidelity surfaces

- Fonts and typography: existing builder sans-serif weights, compact helper copy, and template-specific canvas typography are preserved.
- Spacing and layout rhythm: custom cards reuse the established rail width, padding, borders, drag column, and vertical rhythm; the two add buttons form a compact paired control.
- Colors and visual tokens: existing cream surfaces, dark-green primary action, gold focus treatment, and red destructive action are reused.
- Image quality and asset fidelity: portfolio grids use the subscriber’s real portfolio covers through `next/image`; no placeholder, synthetic, or approximate art was introduced.
- Copy and content: labels are concise and task-specific—Text block, Portfolio grid, Heading, Supporting text, and Portfolios in this grid.

## Findings

- No actionable P0, P1, or P2 visual or interaction findings remain.
- P3: when two custom blocks are expanded simultaneously, the sticky Save card reduces the immediately visible portion of the lowest portfolio checklist. The rail remains scrollable and all controls are reachable.

## Primary interactions tested

- Added a text block and verified the custom-block count changed from 0/12 to 1/12.
- Expanded the text block, changed its heading and supporting text, and verified the Live Canvas updated immediately.
- Added a portfolio grid and verified both seeded portfolios were selected and rendered in the Live Canvas.
- Confirmed the custom block cards expose drag handles, hide/show controls, move controls, and remove controls.
- Reloaded without saving and verified the temporary QA blocks were discarded.
- Checked Chrome console errors: none.

## Comparison history

No P0/P1/P2 issue was found in the first combined comparison, so no visual-fix iteration was required.

final result: passed

---

# Museum Index Hero Copy Inset QA — 2026-07-29

## Evidence

- Source visual truth: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_btIctD/Screenshot 2026-07-29 at 9.28.28 AM.png`
- Browser-rendered implementation: `.qa-museum-hero-copy-inset-v2.png`
- Normalized implementation crop: `.qa-museum-hero-copy-inset-v2-crop.png`
- Side-by-side comparison input: `.qa-museum-hero-spacing-comparison.png`
- Source pixels: 1135 × 776.
- Browser screenshot pixels and CSS viewport: 1898 × 915 at device density 1.
- Comparison normalization: the 1110 × 755 Live Canvas region was cropped from the browser screenshot and scaled to 1135 × 776 before side-by-side comparison.
- State: subscriber website builder, Museum Index template, Home page, overlay Hero, Show full image.

## Full-view Comparison

The source shows the Hero label and heading beginning at the exact left boundary of the contained photograph. The revised browser capture adds a 32px desktop inset outside the existing text-panel padding, moving both lines comfortably inside the image while preserving the full-frame photograph, header, typography, overlay, and background treatment.

## Focused-region Comparison

The lower-left Hero region was clearly readable in the normalized side-by-side comparison, so no additional crop was needed. The image boundary and text start position are visible in both halves: the source has effectively no inner clearance, while the implementation has approximately 40px of visible clearance after scaling.

## Findings

- No remaining P0, P1, or P2 mismatch for the requested spacing correction.
- Fonts and typography: unchanged; serif heading and tracked uppercase label retain their prior hierarchy.
- Spacing and layout rhythm: passed; overlay copy is now inset from the photograph edge without materially changing vertical placement.
- Colors and visual tokens: unchanged and consistent with Museum Index.
- Image quality and asset fidelity: unchanged; the supplied photograph remains full-frame and sharp.
- Copy and content: unchanged.
- Browser console errors: none.

## Comparison History

1. P2 source finding: lower-left Hero copy touched the contained photograph’s left boundary.
2. Fix: added responsive horizontal padding to the overlay-copy wrapper (`16px` compact, `32px` desktop).
3. Post-fix evidence: `.qa-museum-hero-spacing-comparison.png` shows the label and heading visibly inside the photograph with no new crop or layout regression.

## Primary Interaction Tested

- Reloaded the local subscriber builder and confirmed the Museum Index Home Hero rendered in the saved state.
- Confirmed the overlay label and heading remained visible after the spacing change.

## Implementation Checklist

- [x] Inset overlay copy from the Hero image boundary.
- [x] Preserve mobile-safe spacing.
- [x] Preserve full-frame image behavior.
- [x] Run TypeScript, lint, and regression tests.
- [x] Compare source and implementation in one normalized image.
- [x] Check browser console errors.

final result: passed

---

# Story Portfolio Templates — Design QA

## Comparison target

- Source visual truth:
  - Editorial Story: `/Users/mitchrusso/.codex/generated_images/019fa3ec-c96b-7d42-bb7d-e9629d890c04/call_D89EUp54uzNv691AkbDgpMea.png`
  - Cinematic Chapters: `/Users/mitchrusso/.codex/generated_images/019fa3ec-c96b-7d42-bb7d-e9629d890c04/call_7DeHwctx6rxmPM7S54knLG6N.png`
  - Museum Index: `/Users/mitchrusso/.codex/generated_images/019fa3ec-c96b-7d42-bb7d-e9629d890c04/call_0fECo2RxfQ3OJGqSS9aKgO1b.png`
- Browser-rendered implementation:
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-editorial-story-builder-v2.png`
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-cinematic-chapters-builder.png`
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-museum-index-builder-v2.png`
  - Mobile: `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-museum-index-mobile-builder-v3.png`
- Side-by-side comparison boards:
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-editorial-comparison.png`
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-cinematic-comparison.png`
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-museum-comparison.png`

## Normalization

- Source images: 1487 × 1058 px at 1× density.
- Chrome capture viewport: 1898 × 915 CSS px at 1× density.
- Desktop Live Canvas content region: approximately 1110 px wide.
- Simulated mobile Live Canvas content region: 393 px wide.
- Comparison boards: each source and implementation region normalized to 720 × 512 px, combined into one 1440 × 512 px image.
- State: each desktop template selected in the builder with the same seeded subscriber portfolio. The source concepts use generated example photographs and names; the implementation intentionally uses the subscriber’s real selected photography, portfolio names, colors, and copy.

## Full-view comparison evidence

- Editorial Story preserves the reference hierarchy: dominant cover image, centered circular menu, story arrows, restrained identity, then the large editorial story title and narrative region.
- Cinematic Chapters preserves the dark inset image stage, centered menu, chapter counter and arrows, lower-left title treatment, Frame/Contact Sheet control, and chapter strip.
- Museum Index preserves the fixed catalog header, left story information column, large right-hand photograph, project counter, Grid/Single switch, and bottom project index.
- The implementations intentionally omit the fictional identities and photographs from the concepts because PhotoView must render subscriber-owned content.

## Focused-region comparison evidence

- Overlay index: `.qa-story-index-overlay.png` confirms a translucent full-screen story list and separate website-page column.
- Alternate view: `.qa-cinematic-contact-sheet.png` confirms the Contact Sheet control changes the live canvas from Frame view to a photo grid.
- Mobile: `.qa-museum-index-mobile-builder-v3.png` confirms the compact one-column catalog layout, truncated identity, centered menu, and no horizontal overflow.

## Required fidelity surfaces

- Fonts and typography: PhotoView’s existing editorial/classic/clean font classes preserve the intended serif display and neutral sans-serif UI hierarchy. Long subscriber portfolio names wrap rather than truncate in display titles; compact identity labels truncate safely.
- Spacing and layout rhythm: the three templates have intentionally distinct systems—full-bleed editorial, inset cinematic, and two-column catalog. Large image areas, thin rules, generous whitespace, and compact controls track the concepts.
- Colors and visual tokens: each template has a dedicated preset and still honors subscriber-editable background, text, and accent colors. The cinematic shell stays black to preserve image-stage contrast.
- Image quality and asset fidelity: the templates use PhotoView’s actual display images through `next/image`; no placeholder art, copied source-site assets, handcrafted SVG, or CSS illustration substitutes were introduced.
- Copy and content: all headings, statements, identities, gallery names, captions, and counts come from existing subscriber settings and portfolio data. New interface labels are concise and consistent: Selected stories, Grid, Story, Frame, Contact sheet, and Single.

## Findings

No actionable P0, P1, or P2 findings remain.

- [P3] Very long portfolio names can produce a dramatic three-line Museum Index title.
  - Location: Museum Index main title.
  - Evidence: the seeded “QA Sandbox Portfolio” wraps more aggressively than the short “Salt Road” concept title.
  - Impact: this is stylistically acceptable and remains readable, but some subscribers may prefer a shorter display title.
  - Follow-up: consider a future optional website display title separate from the portfolio’s internal name.

## Comparison history

1. [P2] The open story index left an underlying menu button in the accessibility tree.
   - Fix: suppress the page-level menu control while the index overlay is open.
   - Post-fix evidence: Chrome reported exactly one visible “Close story index” control.
2. [P2] Switching templates retained the previous Live Canvas scroll position.
   - Fix: reset the Live Canvas to the top whenever a template is selected.
   - Post-fix evidence: `.qa-museum-index-builder-v2.png` opens at the Museum Index header and first story.
3. [P2] The simulated 393 px mobile canvas inherited desktop media-query behavior.
   - Fix: add an explicit compact rendering mode for the builder’s mobile simulator while retaining normal responsive behavior on published pages.
   - Post-fix evidence: `.qa-museum-index-mobile-builder-v3.png` shows a contained single-column layout without clipped navigation.

## Primary interactions tested

- Selected all three templates from the template filmstrip.
- Opened and closed the story index.
- Switched Cinematic Chapters from Frame to Contact Sheet.
- Switched the builder between desktop and mobile canvases.
- Confirmed previous/next controls expose disabled state when only one selected story is available.
- Confirmed browser-rendered images load from the existing PhotoView media routes. The dev server reported only the existing Next.js LCP optimization advisory; no runtime error was observed during the tested interactions.

## Implementation checklist

- [x] Three selectable templates with distinct presets and mini previews.
- [x] Shared subscriber-backed story navigation.
- [x] Full-screen story index and website navigation.
- [x] Previous/next story controls.
- [x] Grid, Story, Frame, Contact Sheet, and Single views.
- [x] Desktop and compact mobile builder rendering.
- [x] AI Help, Tour, homepage template showcase, PRD, and regression coverage.

## Follow-up polish

- A future optional display-title field would let subscribers shorten long internal portfolio names for the most typographic templates.

final result: passed
