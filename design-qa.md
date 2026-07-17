# Social Campaign Showcase and Tutorial — Design QA

- Source visual truth: `docs/audits/social-automation-2026-07-17/08-home-features-source.png` and `docs/audits/social-automation-2026-07-17/05-campaign-designer.png`
- Implementation screenshot: `docs/audits/social-automation-2026-07-17/06-marketing-social-showcase.png`
- Viewport: 1264 × 720 desktop capture; mobile layout checked at a 390 × 844 override
- State: public homepage at `#social-campaigns`; subscriber dashboard with PhotoView.io Tours open to Run a social campaign
- Full-view comparison evidence: `docs/audits/social-automation-2026-07-17/07-marketing-showcase-comparison.png`
- Focused region comparison: not needed. The campaign showcase itself fills the implementation viewport, and the source campaign designer is legible enough to verify its real imagery and controls.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: the section uses the homepage's existing sans-serif family, heavy display hierarchy, muted long-form copy, compact uppercase eyebrow, and restrained small-print treatment. Headline wrapping remains balanced on desktop and stacks safely on mobile.
- Spacing and layout rhythm: the showcase preserves the site's max-width, 6-pixel-equivalent card radius, generous section padding, compact bordered cards, and gold-accent rhythm. The two-column desktop layout becomes a single column on mobile; browser measurements confirmed the page body stays inside the mobile viewport with no horizontal overflow.
- Colors and visual tokens: the dark green-black feature surface, PhotoView gold, warm white, muted borders, and low-opacity secondary copy all come from the existing marketing and scheduler palette.
- Image quality and asset fidelity: the showcase uses a real, privacy-safe crop of the implemented Campaign Designer. No placeholder photography, recreated interface art, substitute logo, or invented product screen appears in the marketing section.
- Copy and content: the promise matches current capability. It states that direct publishing supports eligible Facebook Pages and Instagram Professional accounts, that multiple eligible destinations can be selected, and that other platforms depend on publishing API access.
- Interaction and accessibility: the main call to action is a real registration link, icons are decorative companions to headings, heading levels remain semantic, image alternative text describes the product screen, and the new tutorial's Show me action opens Settings → Scheduler.

## Interaction Verification

- Opened PhotoView.io Tours from the subscriber dashboard and confirmed Run a social campaign appears as a named option.
- Started the eight-step campaign tutorial and confirmed its title, progress, first instruction, Previous/Next controls, and Show me action.
- Selected Show me and confirmed the dashboard moved to Scheduler while the tutorial remained open.
- Confirmed the public showcase contains a working Start building a campaign link.
- Confirmed AI Help ranks the complete campaign topic first for automation, multiple-account connection, failed-post, pause, and repeat questions.
- Checked browser output for the homepage and tutorial flow; no functional console error was introduced by this change.

## Comparison History

- Initial comparison: the new showcase matched the homepage's type, spacing, border, icon, and gold-accent system. No P0/P1/P2 mismatch was found.
- Responsive check: mobile browser metrics reported a 417-pixel body inside a 433-pixel CSS viewport, confirming no horizontal overflow. The campaign cards and product screenshot stack vertically as intended.

## Follow-up Polish

- P3: add platform-specific campaign examples when additional publishing APIs become available.
- P3: replace the current implementation screenshot after the first live customer campaign produces approved, non-private campaign analytics.

final result: passed
