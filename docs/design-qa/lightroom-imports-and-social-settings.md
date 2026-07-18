# Design QA: Lightroom imports and Social Settings

## Evidence

- Source screenshot: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_AYapgQ/Screenshot 2026-07-18 at 12.21.24 PM.png`
- Updated implementation: `docs/lightroom/lightroom-imports-settings-qa.png`
- State tested: authenticated dashboard, Settings > Imports, local production build data

## Comparison

The original Lightroom panel used four terse steps, exposed the word “Endpoint” without explaining it, and did not show how a photographer chooses between a new and an existing portfolio. The updated implementation defines the endpoint, separates the site URL from the private API key, provides a downloadable plugin, shows a four-stage workflow, gives seven beginner steps, supports new and existing portfolios, and renames Setup to Social Settings.

## Quality checks

- Typography, spacing, colors, and icons follow the existing dashboard system.
- The download is a semantic link and settings remain native labeled controls.
- The responsive two-column layout stacks at the dashboard breakpoint.
- Browser console errors: none.

## Findings and resolutions

- P1: Beginners could not understand or complete Lightroom setup. Resolved.
- P1: New/existing portfolio selection did not exist in the plugin. Resolved.
- P2: Setup inaccurately described a social-only page. Resolved.
- P2: Downloadable plugin package could become stale. Resolved and archive-tested.

final result: passed
