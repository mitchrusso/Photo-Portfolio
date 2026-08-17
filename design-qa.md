# Website builder Save footer — Design QA — 2026-07-31

## Evidence

- Source visual truth: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_tECajk/Screenshot 2026-07-31 at 5.21.11 PM.png`
- Browser-rendered implementation: `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-save-footer-frame.png`
- Combined comparison: `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-save-footer-comparison.png`
- Source pixels: 366 × 430.
- Implementation pixels: 1561 × 889. The in-app browser measured a 1422 × 800 CSS viewport at device pixel ratio 0.9.
- State: light website builder, Template controls expanded, Image frame and Image shape controls visible, unsaved changes present.

## Findings and comparison history

1. The source showed a P1 usability issue: a sticky 86-pixel save card covered the Image shape choices and made the final controls difficult to reach.
2. The save state was rebuilt as a compact 57-pixel footer row in normal layout flow. It is visually integrated with the editor frame using a shared top border and background rather than floating over the choices.
3. Post-fix browser measurements report the footer as `position: static` and `overlap: false`. Image shape choices remain fully visible while the persistent toolbar Save action remains available.

## Required fidelity surfaces

- Fonts and typography: existing compact label and button typography are preserved; redundant explanatory copy was removed from the footer.
- Spacing and layout rhythm: the footer now occupies reserved space after the controls, with no overlay, rounded floating card, or elevated shadow.
- Colors and visual tokens: existing PhotoView red unsaved state, cream panel, and border colors are preserved.
- Image quality and assets: no imagery or raster assets were changed; the existing Save icon is retained.
- Copy and content: “Unsaved changes,” “Save,” and “Saved” remain clear without repeating the longer instruction already represented by the controls.

## Interaction and console checks

- Expanded Template controls in the running builder.
- Scrolled through Image frame and Image shape choices.
- Verified the footer is in normal document flow and has no geometric overlap with the controls.
- No console errors were observed.

No actionable P0, P1, or P2 findings remain. A focused comparison was used because the request concerned one narrow editor-frame region.

final result: passed

---

# Commercial Casebook design QA

## Evidence

- Source visual truth: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_LqP9Kj/Screenshot 2026-08-02 at 2.09.22 PM.png`
- Browser-rendered implementation: `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-commercial-casebook-full.png`
- Focused implementation region: `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-commercial-casebook-after.png`
- Combined comparison: `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-commercial-casebook-comparison.png`
- Route: `http://localhost:4173/dashboard?panel=website`
- State: authenticated website builder, desktop preview, Commercial Casebook selected, portfolio cards visible
- Browser viewport: 1896 × 947 CSS pixels at device scale 1
- Live Canvas CSS size: 1118 × 662 pixels; the focused visible capture is 1118 × 411 pixels because the canvas continues below the browser viewport
- Source pixels: 1057 × 798
- Implementation pixels: 1896 × 947
- Density normalization: source and implementation were scaled to the same 700-pixel comparison height without changing aspect ratio; focused image-card evidence was also inspected at native density

## Findings

No actionable P0, P1, or P2 visual differences remain for the reported defects.

- Fonts and typography: Existing Commercial Casebook type hierarchy remains intact. Removing the unsolicited section heading improves hierarchy without changing subscriber-authored titles.
- Spacing and layout rhythm: The project grid now begins with a clean 3-column rhythm and consistent vertical gaps. Removing the artificial image stages eliminates the uneven gray padding.
- Colors and visual tokens: The template root is transparent and inherits the subscriber's configured website background and text color for the full page. The previous hardcoded gray page background no longer masks a configured background image.
- Image quality and asset fidelity: Portfolio covers use their stored intrinsic dimensions and render at full width with automatic height. Images are neither cropped nor placed inside gray aspect-ratio boxes.
- Copy and content: The hardcoded “Featured projects” label is gone. Remaining visible project names and descriptions come from subscriber content.

## Full-view comparison evidence

The combined before/after comparison shows the original hardcoded “Featured projects” heading and gray image stages on the source side. The revised browser rendering removes that heading, removes the gray stages, and starts the portfolio grid directly beneath subscriber-authored introductory copy.

## Focused region comparison evidence

The focused card capture shows landscape and portrait covers retaining their natural aspect ratios within the same responsive grid. Browser measurements confirm transparent card parents, full-width images, and different rendered heights derived from each image's dimensions.

## Interaction and runtime checks

- Selected Commercial Casebook from the template strip.
- Scrolled the Live Canvas to inspect the card grid.
- Confirmed “Featured projects” is absent from rendered text.
- Confirmed the Commercial Casebook root computes to a transparent background.
- Confirmed visible image parents compute to transparent backgrounds.
- No application runtime errors were recorded. One Chrome-extension error from Grammarly and one development-only Next.js LCP suggestion were present and are unrelated to the template defect.

## Comparison history

### Iteration 1 — blocked

- P1: A non-subscriber-authored “Featured projects” heading appeared above the portfolio.
- P1: Fixed-ratio gray stages surrounded and cropped covers.
- P1: A hardcoded gray template root masked the configured website background through most of the page.

Fixes:

- Removed the hardcoded section heading.
- Replaced fixed aspect-ratio cover stages with intrinsic full-frame image rendering.
- Removed the hardcoded template background and text colors so the configured website-level background and colors apply throughout.

### Iteration 2 — passed

Post-fix browser evidence confirms that the unsolicited heading and gray stages are absent, natural image proportions are preserved, and the template surface inherits the website background.

## Residual test gaps

- The local subscriber state used for this capture has a background color but no background image selected. The inheritance path was verified through the rendered transparent template root and the shared website background style; a separate visual capture with a configured background image was not required to resolve the masking defect.

## Final result

final result: passed

---

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

# Scroll Stack website template — design QA

## Reference and implementation

- Reference: Alinea Invest desktop and 390 × 844 mobile captures saved under `artifacts/alinea-source-*`.
- Adaptation: PhotoView branding, subscriber-controlled copy, existing portfolio covers, portfolio links, and film-strip photographs replace all reference brand content.
- Core mechanics preserved: dark cinematic opening, large rounded project panels that layer during desktop scrolling, and a continuously moving photographic strip.
- Mobile behavior: the layered panels become a readable single-column sequence with full-width imagery and touch-friendly portfolio links.

## Findings and fixes

- P1 fixed: published mobile initially inherited the desktop two-column/sticky layout because the builder's `compact` flag is not present on public mobile pages. Responsive breakpoint classes now independently switch the public experience to a vertical sequence below `md`.
- P2 fixed: film-strip image widths and major headings now scale down at phone widths instead of relying only on the builder preview flag.
- P2 fixed: reduced-motion preferences stop the continuous marquee animation.
- No remaining P0, P1, or P2 code-level findings.

## Validation

- [x] Selectable in the shared template registry and builder
- [x] Saved style preset and forced film-strip activation
- [x] Builder, draft-preview, and published-site rendering
- [x] Homepage template rail and automatic 30-template count
- [x] Update-bell announcement with a new unread release bundle
- [x] Responsive desktop and mobile layout rules
- [x] Reduced-motion behavior
- [x] TypeScript, ESLint, regression tests, and diff checks

final result: passed

---

# Homepage feature inventory and settings showcase — Design QA — 2026-07-31

## Evidence

- Source visual truth:
  - `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_SXvCdD/Screenshot 2026-07-31 at 3.36.44 PM.png`
  - `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_THzTSz/Screenshot 2026-07-31 at 3.38.58 PM.png`
- Browser-rendered implementation:
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/artifacts/homepage-hero-mobile-final-2026-07-31.png`
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/artifacts/homepage-settings-updated-crop-2026-07-31.png`
- Combined source and implementation comparison:
  - `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/artifacts/homepage-request-comparison-2026-07-31.png`
- Tested states: supplied mobile hero size, desktop settings showcase, all 29 template previews, Custom pages marketing card, and the interactive Storage settings tab.

## Full-view comparison

The hero preserves the supplied hierarchy, color treatment, typography, CTA, and three-column feature inventory while adding Lightroom Plugin and 29 website templates as a fourth row. The settings showcase retains the existing cream-and-green visual system, but gives more width to the interactive panel and shortens the left copy so all nine settings tabs are visible at once.

The in-app browser screenshot backend tiled the surrounding browser surface at its active display scale. The normalized comparison retains the first rendered surface. DOM measurements were also used to verify the true responsive viewport and overflow behavior: the template label ended at 651 CSS px inside a 795 CSS px viewport, and the document remained narrower than the viewport.

## Focused findings

- Template inventory: the homepage rail renders 29 children and remains horizontally movable (`5,440px` content inside a `1,152px` rail).
- Settings bar: the tab list has equal `scrollWidth` and `clientWidth` values of `862px`; no tab is hidden or clipped.
- Interaction: selecting Storage changed its `aria-selected` state to `true` and displayed the correct capacity highlights.
- Build your site: rendered content includes the pluralized Custom pages label and the five-page explanation.
- No browser console errors were observed.

## Required fidelity surfaces

- Fonts and typography: the established sans-serif hierarchy is preserved; only the mobile feature inventory is reduced to 13px to accommodate the two longer labels.
- Spacing and layout rhythm: the hero keeps its supplied spacing and three-column grid. The settings split changes from 36/64 to 25/75, giving the tab bar enough room while retaining a readable left introduction.
- Colors and visual tokens: existing dark green, cream, gold, border, and shadow tokens are unchanged.
- Assets and icons: existing Lucide iconography is reused; no placeholder or synthetic asset was introduced.
- Copy and content: Lightroom Plugin, 29 website templates, all 29 preview cards, and Custom pages appear in the rendered UI.

## Comparison history

1. Initial mobile capture found a P2 issue: the longer template-count label approached the browser surface crop at the supplied size.
2. The feature inventory was tightened from 14px to 13px at the three-column breakpoint, and the Lightroom label was normalized to Lightroom Plugin.
3. Post-fix DOM measurements confirmed both new labels remain fully inside the true viewport with no horizontal page overflow.

## Verification

- [x] 202 regression tests
- [x] ESLint
- [x] TypeScript
- [x] Production build with valid local URL overrides
- [x] Desktop and mobile browser rendering
- [x] Settings tab interaction
- [x] Console error check

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

---

# Reference-inspired website templates — design QA

## Evidence

- Source visual truth: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/photoview-template-references/`
  - `porodina.png`, `scott-snyder.png`, `margaret-rajic.png`, `levon-biss.png`, `mike-kelley.png`, `clevershot.png`, `dean-bradshaw.png`, `zenns-foto.png`, `alex-oley.png`, and `william-lambelet.png`
- Browser-rendered implementation:
  - `.qa-inspired-kinetic-full.png`
  - `.qa-inspired-atelier-full-fixed.png`
  - `.qa-inspired-acclaim-mobile-builder.png`
- Combined comparison evidence:
  - `.qa-inspired-kinetic-comparison.png`
  - `.qa-inspired-atelier-comparison.png`
- Viewport: 1265 × 712 CSS pixels for the desktop source and implementation comparisons; the builder's built-in mobile canvas was used for the responsive pass.
- Pixel dimensions and normalization: Clevershot, Margaret Rajic, and the corresponding implementation captures were 1265 × 712 at device scale factor 1. The two combined comparison files place equal-size captures side by side without density scaling. Mike Kelley was captured at 1280 × 720; the remaining source captures were 1265 × 712.
- State: authenticated development subscriber, saved website draft, real QA portfolio images, Home page, desktop and mobile canvas states.

## Full-view comparison

The Clevershot comparison confirms that Kinetic Headline carries over the intended full-bleed photograph, restrained navigation, high-contrast oversized moving type, and low supporting copy without copying the source brand or artwork. The Margaret Rajic comparison confirms the segmented navigation, dark identity half, editorial serif name, pale project half, and portrait-oriented image stage.

All ten template choices were selected individually in the live builder. Each rendered its matching `data-inspired-template` root in both desktop and mobile canvas modes:

- Kinetic Headline
- Atelier Split
- Triptych Stage
- Commercial Casebook
- Studio Split
- Swiss Sequence
- Object Stage
- Specimen Wall
- Quiet Sequence
- Acclaim Portfolio

## Focused-region comparison

The headline/navigation region was checked in `.qa-inspired-kinetic-comparison.png`; headline scale, overflow behavior, image contrast, and navigation density preserve the source interaction idea while using PhotoView content and tokens. The split identity/image region was checked in `.qa-inspired-atelier-comparison.png`; the repaired name block now wraps within its panel and keeps the source's hierarchy.

## Required fidelity surfaces

- Fonts and typography: each mode has an intentional display treatment. The kinetic headline uses a heavy uppercase sans; Atelier and Acclaim use editorial serif hierarchy; Swiss and Specimen use small utility typography. No unintended truncation remains.
- Spacing and layout rhythm: desktop compositions preserve the reference mechanics, while the mobile canvas collapses split and triptych layouts into one-column experiences with reachable controls.
- Colors and tokens: each preset applies a coherent background, foreground, and accent combination through the existing website-template style system. Subscriber customization remains available.
- Image quality and asset fidelity: real PhotoView portfolio media is used throughout. No placeholder drawings, fake image assets, or copied source artwork were introduced.
- Copy and content: template names, descriptions, best-use guidance, AI Help, tooltips, and the first-website tour describe the actual behavior in plain language.
- Icons and controls: Lucide controls match the existing product. Previous/next, thumbnail/sequence, project index, navigation, and template selection controls were exercised.
- Accessibility: controls have accessible names, the marquee stops under `prefers-reduced-motion: reduce`, mobile navigation is constrained, and existing global focus styles remain in effect.

## Findings

No actionable P0, P1, or P2 findings remain.

The browser console contained no runtime errors. Next.js development warnings noted LCP images and one transient zero-height image during rapid template switching; the saved desktop and mobile states showed no missing or collapsed media. These are non-blocking performance diagnostics rather than visible fidelity failures.

## Comparison history

1. Initial Atelier Split comparison found a P2 typography issue: the long QA site name extended beyond the left panel at 1265 × 712.
2. The display scale was reduced from a 10vw maximum to a 6vw maximum, line height was relaxed, and long-name wrapping was enabled in `InspiredPortfolioExperience`.
3. `.qa-inspired-atelier-full-fixed.png` and `.qa-inspired-atelier-comparison.png` confirm the complete name now fits inside the identity panel with the intended hierarchy.
4. The post-fix desktop comparison and mobile canvas pass found no remaining P0/P1/P2 issues.

## Implementation checklist

- [x] Ten selectable template records and style presets
- [x] Builder mini previews and descriptive tooltips
- [x] Draft preview and published-site rendering path
- [x] Desktop and mobile variants
- [x] Primary template interactions
- [x] AI Help and guided-tour coverage
- [x] TypeScript, regression, lint, browser, and visual checks

## Follow-up polish

- P3: consider marking the first visible hero image as eager in a future performance pass to remove the Next.js development LCP advisory.

final result: passed

---

# Release notification center — design QA

## Evidence

- Source visual target: `.qa-inspired-kinetic-builder.png`, the established PhotoView website-builder toolbar before the notification control was added.
- Browser-rendered implementation:
  - `.qa-release-notification-unread.png`
  - `.qa-release-notification-panel.png`
  - `.qa-release-notification-dismissed.png`
  - `.qa-release-notification-builder.png`
  - `.qa-release-notification-mobile-header.png`
  - `.qa-release-notification-mobile-panel.png`
- Combined comparison evidence: `.qa-release-notification-comparison.png`
- Viewports: 1265 × 712 CSS pixels for desktop checks and 390 × 844 CSS pixels for the compact mobile check, both at device scale factor 1.
- State: authenticated development subscriber with the July 2026 release bundle initially unread, then opened/read, dismissed, and reopened after dismissal.

## Full-view comparison

The side-by-side website-builder comparison confirms the bell adds one compact control without changing the established toolbar height, spacing system, control radii, accent palette, or right-side publishing controls. The dashboard capture confirms the unread red treatment is visible without overpowering the existing gold and black interface.

The opened panel uses the same warm-white surfaces, thin borders, compact uppercase section labels, Lucide icon family, and dark primary action used elsewhere in PhotoView. Its fixed right-side desktop placement preserves the underlying workspace context; at 390 px it becomes an inset full-width sheet without horizontal clipping.

## Focused-region comparison

- Desktop header: `.qa-release-notification-unread.png` confirms the unread bell, red status dot, and gentle pulse fit between Tour and theme controls.
- Desktop panel: `.qa-release-notification-panel.png` confirms the release title, feature hierarchy, template chips, internal scrolling, and sticky Dismiss action.
- Website builder: `.qa-release-notification-builder.png` confirms all draft, save, address, preview, and template-selection controls remain reachable.
- Mobile header and panel: `.qa-release-notification-mobile-header.png` and `.qa-release-notification-mobile-panel.png` confirm the icon-only header remains usable and the notification sheet keeps readable margins, wrapped copy, reachable close control, and a persistent Dismiss button.

## Required fidelity surfaces

- Fonts and typography: existing PhotoView sans-serif hierarchy is preserved. Release metadata and category labels use the product's compact uppercase treatment; long feature descriptions wrap naturally at both tested widths.
- Spacing and layout rhythm: the bell uses the same 40 px control footprint as adjacent header actions. Panel sections use consistent separators and padding, with no collision against browser or dashboard edges.
- Colors and tokens: unread state uses semantic red only on the bell border, icon, background tint, and status dot. Read state returns to the standard neutral control styling.
- Image quality and asset fidelity: the component requires no new imagery. The Lucide Bell, Sparkles, Check, and X icons match the existing icon family; no custom SVG or CSS illustration was introduced.
- Copy and content: the panel includes Multiple Smart Folders, all ten reference-inspired templates, all seven story/index/panorama templates, Custom Home blocks and pages, multiple embed profiles, website backgrounds and display controls, two-factor protection, Quick Add Gear, and article/social publishing updates.
- Behavior and accessibility: the bell exposes an accessible unread label and expanded state, opening marks the bundle read, Dismiss persists the completed bundle, Escape and outside click close the panel, focus returns to the bell, and reduced-motion disables the pulse animation.
- Responsiveness: no clipping or overlap was observed at 1265 × 712 or 390 × 844. The mobile sheet remains inset from the viewport and its content scrolls independently behind a sticky footer.

## Findings

No actionable P0, P1, or P2 findings remain.

The browser console contained no warnings or runtime errors during the dashboard, notification, dismissal, website-builder, and mobile interaction checks.

## Primary interactions tested

- Opened the unread notification center from the dashboard header.
- Confirmed all release feature groups and template names are present in the rendered accessibility tree.
- Dismissed the release bundle and confirmed the dialog closed, the unread pulse was removed, and the bell returned to its neutral accessible label.
- Opened My Website and confirmed the notification bell remains available in the builder toolbar.
- Reopened the notification center at 390 × 844 and confirmed the sheet and sticky Dismiss action remain reachable.
- Confirmed there were no browser console warnings or errors.

## Implementation checklist

- [x] App-wide notification bell in dashboard and website-builder headers
- [x] Unread red pulse and status dot
- [x] Complete user-facing release roundup
- [x] Read and dismissed persistence
- [x] Sticky Dismiss action
- [x] Escape, outside-click, and focus-return behavior
- [x] Reduced-motion support
- [x] AI Help coverage
- [x] Regression, TypeScript, lint, browser, and responsive visual checks

final result: passed

---

# Atelier Split Bottom-Alignment Design QA

- Source visual truth: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_wKHvTA/Screenshot 2026-08-01 at 9.41.51 AM.png`
- Implementation capture: `.qa-atelier-bottom-fixed.png`
- Combined comparison: `.qa-atelier-bottom-comparison.png`
- Browser viewport: 1422 × 800 CSS pixels
- Source raster: 1664 × 803 pixels
- Implementation raster: 1561 × 889 pixels
- Comparison normalization: the 1120 × 782 source canvas was compared with the corresponding 870 × 623 implementation canvas resized to 1120 × 782.
- State: Website Builder → Home → Atelier Split → Hero editor → Vertical position → Bottom

## Full-view comparison

The source shows the selected Bottom state with no headline visible in the left panel. The corrected implementation keeps “I like the dark” fully visible near the bottom of that panel while preserving the template navigation, split layout, colors, typography, full-frame photograph, and builder controls.

## Focused-region comparison

The defect is isolated to the left Hero panel, so the normalized comparison focuses on the complete Live Canvas. After the final correction, the headline’s rendered bottom is 58 CSS pixels above the browser viewport edge. No additional close crop was needed because the headline, panel boundary, and Bottom control are all legible in the full canvas comparison.

## Required fidelity surfaces

- Fonts and typography: unchanged; the existing Atelier serif headline styling, scale, line height, and tracking are preserved.
- Spacing and layout rhythm: corrected; Bottom now provides a visible inset inside the embedded builder canvas.
- Colors and visual tokens: unchanged.
- Image quality and asset fidelity: unchanged; the photograph remains uncropped with `object-contain`.
- Copy and content: unchanged.

## Comparison history

1. P1 — Bottom alignment positioned the headline below the visible embedded canvas.
   - Fix: distinguish the embedded editing surface from the full-height published experience and size the Atelier main stage to the builder’s available height.
2. P2 — The first correction made the headline visible but left it too close to the viewport boundary.
   - Fix: add a builder-only 2rem bottom inset for Bottom alignment.
3. Final evidence — “I like the dark” is fully visible with a measured 58px viewport inset. Top, Middle, and Bottom were exercised without a runtime error alert.

## Findings

No actionable P0, P1, or P2 differences remain for this defect.

## Implementation checklist

- [x] Keep published Atelier pages full-height.
- [x] Fit the Atelier stage to the embedded builder canvas.
- [x] Keep Bottom-aligned headlines fully visible.
- [x] Add regression coverage.
- [x] Exercise Top, Middle, and Bottom in the browser.

final result: passed

## Accordion story design QA

Status: Passed

Reference: Retreat Strategy Co. “My Story”

Verified:

- Desktop uses a horizontal accordion with the active chapter expanded between narrow vertical chapter tabs.
- Chapters before and after the active chapter remain visible on the correct side.
- Mobile uses a stacked accordion with one expanded chapter.
- The selected portfolio image is shown full-frame with `object-contain`; it is never cropped.
- Colors and typography inherit the subscriber’s selected PhotoView template.
- The same component renders in Live Canvas and the published website preview.
- The feature remains available after switching between Atelier Split and Commercial Casebook.
- Chapter buttons expose `aria-expanded` and each active panel is a named region.
- Two to six chapters can be added, removed, renamed, reordered, and connected to portfolio images.
- AI Help, contextual tooltips, and a dedicated eight-step product tour explain setup and clarify that “Origin” is editable starter wording, separate from About and Story content.

Evidence: desktop and mobile local captures were compared with the reference; those temporary QA artifacts remain outside version control.

No P0, P1, or P2 visual defects remain.

---

# Blank canvas template and Featured portfolio picker — Design QA — 2026-08-17

## Evidence

- Source visual truth: user-supplied screenshot displayed in the request, reported at `/Users/Mitch/Desktop/Screenshot 2026-08-17 at 2.56.09 PM.png`.
- Browser-rendered blank template and builder state: `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-blank-template-canvas.png`.
- Browser-rendered Featured portfolio picker: `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox/.qa-blank-template-picker.png`.
- Source pixels: 610 × 1280 as displayed in the supplied screenshot.
- Implementation pixels: 1561 × 889 at the in-app browser's active desktop viewport. The picker measured 576 × 299 CSS pixels with two portfolios; it is capped at the viewport height for larger collections.
- State: authenticated light-theme website builder, desktop preview, Blank canvas selected, Featured work enabled, one of two portfolios selected.
- Density normalization: both source and implementation were reviewed at their native rendered density. The requested control keeps the source card's typography, borders, spacing, and gold selected state; the new modal is an intentional extension rather than a pixel-identical source element.

## Full-view comparison evidence

The supplied source established the visual language for the What to show controls. The browser-rendered implementation preserves those source and display choices, adds a compact Featured portfolios summary within the same card, and moves the long checkbox list into a centered modal. The modal uses the same cream surface, dark-green action, gold selected border, image thumbnails, and compact type hierarchy used throughout the builder.

Blank canvas appears first in the searchable template rail and is visually represented by three empty dashed section slots with library icons. Selecting it keeps the subscriber's identity and saved content intact while changing every built-in Home block to its hidden state. The existing eye controls and keyboard-accessible drag handles remain visible for construction and ordering.

## Focused region comparison evidence

Focused inspection of the picker confirmed that both portfolio thumbnails remain full-frame inside compact square previews, checkbox hit areas are aligned, the selection count updates immediately, and Clear selection, Close, Escape, overlay dismissal, and Done remain available without covering the list. A focused region was necessary because the request centered on one narrow control and its new popup state.

## Required fidelity surfaces

- Fonts and typography: existing builder font family, uppercase section labels, button weights, helper copy, and selection-count hierarchy are preserved.
- Spacing and layout rhythm: the inline card remains compact; the popup uses a 576-pixel desktop width, balanced 20-pixel padding, two-column portfolio rows, and a fixed footer outside the scroll region.
- Colors and visual tokens: existing cream, white, border beige, gold selected state, dark green, and overlay opacity are reused.
- Image quality and asset fidelity: real subscriber portfolio covers are loaded through the existing optimized image component; no synthetic or placeholder photographs were introduced. The blank-template preview uses the existing Lucide Plus icon.
- Copy and content: “Featured” keeps its original description, with explicit “Choose portfolios” / “Change selection” actions and clear immediate-preview guidance.

## Interaction and console checks

- Selected Blank canvas and verified all five built-in Home blocks changed to Show controls while their grab handles remained available.
- Searched for “blank” and verified only Blank canvas remained in the template results.
- Enabled Featured work and opened the picker from both the Featured source button and the Choose portfolios action.
- Selected a portfolio and verified the Done count changed from zero to one.
- Closed the picker with Escape and reopened and closed it with Done.
- No console errors were observed. One existing development-only Next.js LCP suggestion for a subscriber image remains unrelated to this change.

## Comparison history

No actionable P0, P1, or P2 finding was identified in the first normalized comparison, so no post-comparison visual correction was required.

final result: passed
