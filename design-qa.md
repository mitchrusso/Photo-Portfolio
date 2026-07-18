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

## Final result

passed
