# Design QA — Three Darren Carroll–inspired templates

Date: 2026-07-29

## Result

Passed. No open P0, P1, or P2 visual or interaction issues remain.

## Comparison setup

- Browser: Codex in-app browser
- State: signed-in QA subscriber, website draft preview
- Browser viewport: 1422 × 800 CSS pixels at DPR 0.9
- Screenshot normalization: the browser capture's valid 1265 × 720 top-left viewport was extracted before comparison
- Source references were resized with `contain` onto a 1265 × 720 neutral canvas; implementation screenshots were not stretched

## Full-view comparisons

| Template | Source reference | Implementation | Combined comparison |
| --- | --- | --- | --- |
| Editorial rail | `/Users/mitchrusso/.codex/generated_images/019fa3ec-c96b-7d42-bb7d-e9629d890c04/call_I1TWMvDg3dCHwq1CW9Lv79wQ.png` | `artifacts/editorial-rail-preview-crop-2026-07-29.png` | `artifacts/design-qa-editorial-rail-comparison.png` |
| Masonry journal | `/Users/mitchrusso/.codex/generated_images/019fa3ec-c96b-7d42-bb7d-e9629d890c04/call_YzZDB3u44q8wlB8IOlbaiLZM.png` | `artifacts/masonry-journal-preview-crop-2026-07-29.png` | `artifacts/design-qa-masonry-journal-comparison.png` |
| Dark filmstrip | `/Users/mitchrusso/.codex/generated_images/019fa3ec-c96b-7d42-bb7d-e9629d890c04/call_VzacpEnSQItD77nUg8yuYGUr.png` | `artifacts/dark-filmstrip-preview-final-crop-2026-07-29.png` | `artifacts/design-qa-dark-filmstrip-comparison.png` |

The full views cover the important composition regions: navigation, template identity, image presentation, portfolio navigation, and the film strip. A separate builder capture, `artifacts/full-frame-grid-builder-2026-07-29.png`, records the new crop-free grid option with mixed landscape and portrait images.

## Findings and resolution

- Editorial rail: the fixed light rail, restrained typography, generous gallery whitespace, full-frame hero, and bottom image navigation match the selected direction. Subscriber names are allowed to wrap instead of being truncated.
- Masonry journal: the dark navigation rail and light masonry wall match the source structure. Every photograph retains its natural aspect ratio; the smaller QA collection naturally creates more open space than the larger source collection.
- Dark filmstrip: the dark top navigation, project caption rail, large full-frame image, navigation controls, and thumbnail strip match the source hierarchy. Previous, next, contact-sheet, and thumbnail selection states were exercised.
- Film Strip editor: generic headline controls initially appeared in this media-only block and were removed.
- Reordering: the visible Film Strip Move up / Move down controls initially targeted a legacy section order. They now update the same Home block order used by drag-and-drop and were verified by moving the block down and back up.
- Full-frame grid: the new option appears in the existing grid display controls and renders natural-aspect images with no forced crop.

## Verification

- `npm test`: 191 tests passed
- `npx tsc --noEmit`: passed
- `npm run lint`: passed
- `git diff --check`: passed
- `npm run build`: passed with safe local URL overrides for malformed placeholder URL values in `.env.production.local`; no environment file was changed
