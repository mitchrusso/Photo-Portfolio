# Design QA: subscriber feedback and compact builder toolbar

## Result

passed

## Sources and implementation

- Feedback reference: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_a4rzvZ/Screenshot 2026-07-16 at 9.14.36 AM.png`
- Feedback-type reference: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_jnDliZ/Screenshot 2026-07-16 at 9.15.27 AM.png`
- Toolbar reference: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_VlieoM/Screenshot 2026-07-16 at 9.13.32 AM.png`
- Feedback implementation: `src/components/feedback/subscriber-feedback.tsx`
- Feedback API: `src/app/api/feedback/route.ts`
- Toolbar implementation: `src/components/portfolio/portfolio-dashboard.tsx`
- Comparison images: `docs/design-qa/feedback-toolbar-2026-07-16/`

## Viewports and states checked

- Laptop builder viewport: 1422 px wide, authenticated website-builder state.
- Mobile feedback viewport: 433 px wide, authenticated dashboard state.
- Feedback launcher, open dialog, all four dropdown choices, valid/invalid submission states, screenshot attached, multiple-file input, Escape close, keyboard focus loop, and focus restoration.
- Referral shortcut landing at `/account#referrals` with the existing “Referral storage bonus” section visible.

## Full and focused comparison

- `feedback-modal-comparison.png` compares the ClickCoach reference with the implemented PhotoView.io dialog.
- `builder-toolbar-comparison.png` compares the previous two-row builder chrome with the final one-row toolbar.
- The feedback dialog preserves the reference hierarchy, spacing, control order, attachment actions, identity fields, and primary action. PhotoView.io colors and support wording are intentional brand adaptations.
- The builder toolbar intentionally consolidates two stacked rows into one sticky 75 px row while retaining every action.

## Fidelity findings

- Typography: existing PhotoView.io type system retained; title, labels, fields, and supporting copy match the reference hierarchy.
- Spacing and layout: modal uses a 520 px maximum width and remains within the 433 px mobile viewport. The laptop toolbar measured `clientWidth: 1371` and `scrollWidth: 1371`, with no horizontal overflow.
- Color: PhotoView.io dark green and gold replace the ClickCoach purple/blue treatment intentionally.
- Assets: Lucide interface icons are consistent with the application. The reference contains no custom image asset that needed reproduction.
- Copy: “Bug Report/Feature Request” and Bug, Improvement, Question, Feedback match the references. The recipient label is adapted to the PhotoView.io support team.

## Comparison history

- P1: screenshot capture initially failed when cloning modern `lab()`/`oklab()` colors. Added clone-safe RGB compatibility styles and foreign-object rendering; retest displayed “Screenshot attached.”
- P2: the first consolidated toolbar overflowed at laptop width. Shortened compact labels and reduced selector minimum width; measured retest confirmed no overflow.
- P2: custom modal initially lacked a complete keyboard loop. Added Tab/Shift+Tab focus containment, Escape close, and launcher-focus restoration.

## Interaction and console checks

- Confirmed session name and email auto-populate.
- Confirmed the submit action remains disabled until a type and message are present.
- Confirmed unauthenticated API requests return HTTP 401.
- Confirmed screenshot capture and referral navigation work.
- Confirmed the dialog fits on mobile and remains scrollable when needed.
- Browser console contained no implementation errors. Existing Next Image LCP warnings are unrelated to this change.
- No remaining P0, P1, or P2 findings.
