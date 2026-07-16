# Design QA: Draft Preview toolbar stacking

- Source visual truth: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_nXSgjS/Screenshot 2026-07-15 at 8.13.47 PM.png`
- Implementation screenshot: `/tmp/photoview-preview-toolbar-fixed.png`
- Combined comparison: `/tmp/photoview-toolbar-before-after.png`
- Viewport: 1295 × 874
- State: Draft Preview scrolled into the portfolio grid with the sticky preview toolbar visible

## Full-view comparison evidence

The source shows portfolio images and gold card borders visible through the translucent sticky toolbar. The revised implementation gives the toolbar a fully opaque `rgb(31, 42, 36)` background, `opacity: 1`, `z-index: 50`, and an isolating stacking context. Scrolled portfolio content now passes behind the toolbar without showing through it.

## Focused region comparison evidence

The toolbar was inspected at the top edge while the portfolio grid was scrolled underneath it. Its rendered height was 59.3px, its sticky top position remained 0, and no portfolio pixels or borders were visible inside the toolbar region. A separate focused crop was unnecessary because the toolbar occupies the complete top strip and is clearly readable in the full-state capture.

## Fidelity surfaces

- Fonts and typography: unchanged from the existing preview controls.
- Spacing and layout rhythm: toolbar height and control alignment are unchanged; only stacking and surface treatment changed.
- Colors and visual tokens: toolbar now uses the existing PhotoView.io dark green `#1f2a24` as an opaque application-chrome surface.
- Image quality and asset fidelity: portfolio imagery remains unchanged; all 20 rendered images loaded successfully with no failed images.
- Copy and content: unchanged.

## Comparison history

1. P1 finding: portfolio cards visibly bled through the sticky Draft Preview toolbar.
2. Fix: removed the theme-dependent translucent toolbar background and backdrop blur; added an opaque background, stronger stacking level, isolation, and a subtle separating shadow.
3. Post-fix evidence: scrolled browser verification reported `background-color: rgb(31, 42, 36)`, `opacity: 1`, `position: sticky`, `top: 0`, and `z-index: 50`. Browser console contained no errors.

## Findings

No remaining P0, P1, or P2 mismatch in the reported state.

final result: passed
