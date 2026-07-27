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
