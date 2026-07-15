# Design QA — Two-Step Website Builder

- Source of truth: `/var/folders/pt/w_f45rcx7nddwvv62qq35cww0000gn/T/TemporaryItems/NSIRD_screencaptureui_vHNqkD/Screenshot 2026-07-15 at 4.03.27 PM.png`
- Implementation evidence: `.codex/audits/website-builder-2026-07-15/step-one-guidance.png` and `.codex/audits/website-builder-2026-07-15/step-two-inline-editor.png`
- Comparison viewport: 1668 × 822
- State: authenticated local dashboard → My Website. Step 1 shows the selected Cinematic Home design and revised guidance. Step 2 shows About me expanded with its full editor directly below the page heading.

## Full-view comparison

The source showed a narrow builder rail, flat navigation, a subtly selected template, and a separate three-step navigation model. The implementation keeps the wider 440px rail, reduces the workflow to two raised folder tabs, gives Step 1 explanatory guidance, and consolidates page selection and page editing into Step 2 accordions. The selected template remains unmistakable and image-frame controls remain visible in the Live Canvas.

## Focused-region comparison

- Navigation: only `Step 1. Design` and `Step 2. Site` remain. The redundant Step 3 tab and panel are gone.
- Template selector: the active Cinematic Home card has a four-pixel dark border, gold outer ring, shadow, `In use` badge, and `Selected design` caption.
- Step 1 guidance: the new copy explains that design is the first decision, can be changed, controls shapes and presentation, and precedes image placement.
- Step 2 accordions: each page opens its complete editor immediately below its heading. Clicking the same heading again or clicking Close collapses it. Opening another page moves the editor to that page.
- Home editing: the Home accordion retains its nested Home page sections and reordering/visibility controls, preserving the only useful section-level behavior from the former Step 3.

## Fidelity surfaces

- Typography: existing product typography and hierarchy preserved.
- Spacing and layout: the 440px builder rail accommodates explanatory copy and inline editor controls while leaving the Live Canvas visible.
- Colors and tokens: existing dark green, gold, parchment, and neutral border palette reused.
- Image quality: source photography and crop behavior remain unchanged.
- Copy: revised Step 1 guidance and Step 2 accordion directions describe the actual interaction without referring to removed Build controls.

## Interaction verification

- Step 1 and Step 2 switch to the correct panels; no Step 3 control remains.
- Step 1 is the initial builder panel and displays the revised guidance.
- About me opens inline, exposes all former section-editor controls, and closes when its heading is clicked again.
- Home opens inline and exposes its nested Home page sections.
- The open page heading exposes `aria-expanded`; the selected template retains `aria-pressed`.
- Automated interaction checks and the local development log showed no application errors during the reviewed flow.

## Comparison history

1. P1: page selection jumped subscribers into a separate Step 3 editor, breaking the mental model. Fixed by portaling the complete editor directly beneath the expanded Step 2 page heading.
2. P1: page cards opened but could not be toggled closed. Fixed with a conventional accordion interaction, `aria-expanded`, a rotating chevron, heading-click collapse, and a visible Close action.
3. P2: Step 3 duplicated Step 2 and section controls without an independent job. Removed it; the useful section controls now live inside Step 2.
4. P2: Step 1 guidance did not explain what subscribers were deciding. Replaced it with the requested plain-language explanation.
5. P2: the Contact canvas note still referred to removed Build controls. Updated it to direct subscribers to Contact in Step 2. Site, and updated AI help language to match.

No remaining P0, P1, or P2 visual or interaction issues were found in this scope.

final result: passed
