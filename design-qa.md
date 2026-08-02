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
