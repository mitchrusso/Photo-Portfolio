# Design QA: Lightroom imports and Social Settings

## Evidence

- Source screenshot: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_AYapgQ/Screenshot 2026-07-18 at 12.21.24 PM.png`
- Updated implementation: `docs/lightroom/lightroom-imports-settings-qa.png`
- State tested: authenticated dashboard, Settings > Imports, local production build data

## Comparison

The original Lightroom panel used four terse steps, exposed the word “Endpoint” without explaining it, and did not show how a photographer chooses between a new and an existing portfolio. The updated implementation:

- defines the endpoint as the secure web address that receives the photographs;
- separates the site URL from the private API key and explains both;
- provides a downloadable, installable Lightroom Classic plugin package;
- shows a four-stage visual workflow: select photos, choose a destination, export, and review;
- gives seven beginner-oriented setup and publishing steps;
- supports both creating a portfolio and appending to an existing portfolio;
- renames Setup to Social Settings and updates contextual help accordingly.

## Quality checks

- Typography: heading, body, instructional, and monospace technical text follow the existing dashboard hierarchy.
- Spacing: the workflow cards and numbered instructions have consistent rhythm and remain readable without becoming a dense text wall.
- Color: existing PhotoView.io cream, charcoal, and gold tokens are preserved.
- Icons: existing Lucide icons are used consistently; no raster art or mismatched icon set was introduced.
- Accessibility: download remains a semantic link; settings controls remain labeled native inputs and buttons.
- Responsive behavior: content remains within the existing two-column settings layout and can stack at the dashboard breakpoint.
- Browser console: no errors were recorded while opening Settings and switching to Imports.
- React review: no new conditional hooks, unstable list keys, unlabelled interactive divs, or unnecessary effects were introduced.

## Findings and resolutions

- P1: Beginners could not understand or complete Lightroom setup. Resolved with plain-language definitions and a start-to-finish guide.
- P1: The described new/existing portfolio choice did not exist in the plugin. Resolved in the Lightroom UI and import API.
- P2: The Setup label inaccurately described a social-only page. Resolved by renaming it Social Settings throughout the dashboard, tour, and AI help.
- P2: The downloadable package could become stale after source changes. Resolved by rebuilding and integrity-testing the ZIP after the final plugin edit.
- P3: The full-page browser screenshot tool repeats sticky dashboard chrome while stitching. A focused implementation capture was also reviewed; this is a capture-tool artifact, not an application rendering defect.

## Final result

passed
