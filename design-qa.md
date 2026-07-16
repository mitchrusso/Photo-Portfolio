# Design QA: compact header, Library deletion, and marketing cleanup

## Source visual truth

- Desired compact header reference: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_qaCjRB/Screenshot 2026-07-16 at 12.02.51 PM.png`
- Regressed expanded-header reference: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_e2QHue/Screenshot 2026-07-16 at 1.02.45 PM.png`
- Library missing-actions reference: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_AI2ew7/Screenshot 2026-07-16 at 1.07.22 PM.png`

## Implementation evidence

- Compact-header screenshot: `/tmp/photoview-dashboard-condensed-header.png`
- Library controls screenshot: `/tmp/photoview-library-delete-controls.png`
- Features-page screenshot: `/tmp/photoview-features-video-demo-removed.png`
- Viewport: 1422 × 800, authenticated light-theme dashboard and public marketing page.
- State: Sloss Furnaces dashboard, Library with one selected photo, and homepage Features section.

## Full-view comparison evidence

- Opened the desired and regressed dashboard references together with the browser-rendered implementation. The implementation restores the three fixed 40 × 40 icon controls at the right edge, preserves the title and sync metadata, and does not introduce horizontal scrolling.
- Opened the Library reference together with the selected-photo implementation. The implementation adds a visible red `Delete 1` bulk action while retaining Show, Hide, caption, metadata, and clear-selection controls.
- The public homepage renders the new looping-MP4 website-header copy and exposes no Demo navigation or hero link. `/demo` now returns the standard 404 page.

## Focused region comparison evidence

- Header control region: Ask AI, Tour, and theme buttons are icon-only visually; each retains an accessible name and tooltip. Measured document width shows no horizontal overflow.
- Library selection region: browser DOM confirmed `Delete 1`, `Hide`, Caption, and `Delete photo` are all present for a selected image. The destructive actions use the existing red danger treatment.
- Portfolio toolbar: source and code inspection confirm a separate `Delete portfolio` action with a typed `DELETE` confirmation. It is disabled when only one portfolio remains so the dashboard cannot enter an invalid empty-workspace state.

## Required fidelity surfaces

- Fonts and typography: existing PhotoView.io families, weights, and hierarchy are unchanged. Hidden header labels use `sr-only`, so accessibility remains intact without changing visual density.
- Spacing and layout rhythm: three 40 px square controls with 8 px gaps match the intended compact toolbar. The Library bulk row wraps safely and keeps destructive actions grouped with selection controls.
- Colors and visual tokens: existing green, gold, neutral, and red danger tokens are reused; no new palette was introduced.
- Image quality and asset fidelity: subscriber photographs and crops are unchanged. Existing Lucide icons are reused for toolbar and deletion actions; no placeholder or approximate assets were added.
- Copy and content: Features explicitly states that the website header supports an uploaded looping MP4 video. Demo copy and links were removed.

## Interaction and console checks

- Verified Dashboard → Library navigation.
- Selected a photo without triggering deletion and confirmed single-photo and bulk-delete controls.
- Verified Caption and Hide remain available.
- Verified `/demo` is removed and returns 404.
- Browser console errors: none on dashboard or homepage.
- Automated checks: TypeScript, 74 regression tests, lint, and production build passed.

## Comparison history

- P1: header labels had expanded after commit `c4c33d9`, materially changing density. Fixed with permanent icon-only controls and strengthened regression coverage.
- P1: Library exposed selection and metadata but not permanent deletion. Restored single and bulk photo deletion, plus whole-portfolio deletion with storage cleanup.
- P2: public marketing still linked to a broken private-photo Demo. Removed both routes and all public entry links.
- Post-fix browser evidence confirms no remaining actionable P0, P1, or P2 findings.

final result: passed
