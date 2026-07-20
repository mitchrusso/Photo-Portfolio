# Design QA: Site settings, Hero media, and gallery preview

## Evidence

- Gallery source: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_jDjI7N/Screenshot 2026-07-18 at 12.41.18 PM.png`
- Hero settings source: `/Users/mitchrusso/Desktop/Screenshot 2026-07-18 at 12.34.54 PM.png`
- Updated implementation: `docs/design-qa/site-settings-gallery-preview-qa.png`
- State tested: authenticated dashboard, Settings > Design, Myanmar portfolio, Cinematic dark template

## Comparison

The original preview repeated the selected portfolio cover as its first two tiles. The corrected preview renders four distinct Myanmar photographs, keeps the same template layout, and does not cycle back to an earlier source when a template has more spaces than available photographs.

The original Hero controls referred only to a cover and “Dim image,” leaving video behavior unclear. The revised controls say Home page Hero and Dim Hero media, explain that the overlay applies to photographs and video, identify an active Hero video when present, and link to the full My Website Hero controls.

## Quality checks

- Typography, spacing, color, borders, and template proportions remain consistent with the supplied screens.
- All four preview image URLs were inspected in the rendered DOM and were unique.
- The initial button is Saved and disabled; changing a setting produces one red Save button; saving returns it to Saved.
- The save control remains a native button, the Hero mode remains a labeled select, and the dim control remains a labeled checkbox and range input.
- The public website preview and dashboard preview both apply the Hero overlay to photographs and video.
- Browser console errors: none.

## Findings and resolutions

- P1: The cover image appeared twice in Live Gallery Preview. Resolved by sourcing preview tiles from the deduplicated photo sequence and using the cover only as an empty-gallery fallback.
- P1: Save provided no reliable unsaved state because Site settings were written automatically. Resolved with saved snapshots, a red Save state, and explicit persistence.
- P2: Video behavior was unclear. Resolved with video-aware mode copy, a direct Hero-controls link, and one dim control for photographs and video.
- P3: The browser capture surface repeats sticky dashboard chrome below its viewport boundary. The accepted comparison uses only the first complete viewport; this does not reproduce in the application DOM.

## Galleries navigation redesign — 2026-07-19

### Evidence

- Sidebar source: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_2gVPzj/Screenshot 2026-07-19 at 11.12.13 AM.png`
- New-gallery source: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_iz9imA/Screenshot 2026-07-19 at 11.14.23 AM.png`
- Sidebar comparison: `docs/design-qa/gallery-panel-comparison.png`
- New-gallery comparison: `docs/design-qa/gallery-dialog-comparison.png`
- State tested: authenticated production dashboard, Galleries expanded, named current gallery with one alternate empty gallery

### Comparison and findings

- P1: The previous sidebar did not identify the current gallery, truncated its name, and mixed gallery creation with an unexplained “All portfolios” row. Resolved with a dedicated Current gallery card, full wrapped name, portfolio count, Rename action, Add new gallery action, and a separate Switch gallery list.
- P1: The previous New gallery dialog implied that creating an empty gallery was an alternate checkbox choice. Resolved by making every newly created gallery empty and stating that directly.
- P2: Rename explanations discussed moving existing content even though the action only changes a name. Resolved with concise naming-only language.
- P2: A submitted new-gallery name could silently collide with an existing gallery. Resolved with a duplicate-name conflict response.
- The first unnamed gallery is presented as My Gallery and exposes Rename; no migration language is shown.
- Typography, color, borders, focus styling, button hierarchy, and spacing remain within the existing PhotoView.io dashboard system.
- Production DOM and both dialogs were verified after deployment. No application-origin browser console errors were present; the only logged errors came from an unrelated Chrome extension.

## Final result

passed

---

# Design QA — Dashboard help controls and Start Here tour

- Reference: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_gjqgns/Screenshot 2026-07-20 at 5.28.29 PM.png`
- Implementation capture: `docs/design-qa/dashboard-help-toolbar-qa.png`
- Verified state: authenticated desktop dashboard in light mode, helpful hints enabled.

## Visual comparison

- The four controls match the existing PhotoView.io pattern: hints toggle, AI help, guided tours, and theme control.
- Border, accent, icon, spacing, and button-height treatments remain consistent with the supplied reference.
- The controls remain contained in the page header without clipping or covering primary dashboard content.
- The optional hint appears as a separate contextual strip below the header, preserving the original toolbar density.

## Interaction coverage

- Hints toggle changes the contextual help state.
- Ask AI opens the dashboard-aware help panel.
- Take a Tour opens the tour selector with Start Here first.
- Start Here launches an 11-step tour and retains the tour while moving from Dashboard to Library.
- The same help controls were confirmed on Dashboard, Library, Settings, and My Website.
- No application-originated browser console errors were observed. Console errors were limited to an unrelated installed Chrome extension.

## Result

No P0, P1, or P2 visual or interaction issues remain.

final result: passed
