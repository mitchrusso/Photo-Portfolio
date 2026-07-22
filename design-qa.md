# CRM guided outreach design QA

## Source visual truth

- Selected Product Design direction: `/Users/mitchrusso/.codex/generated_images/019f6c03-8716-7a70-9782-9987abd128a3/exec-532c5214-a8d7-45a2-810b-daf300014e81.png`
- Direction: Guided Partnership Playbook.

## Implementation evidence

- Browser-rendered implementation: `docs/design-qa/crm-guided-outreach-implementation.png`
- Local development preview: `http://localhost:4173/crm-design-preview`
- Production behavior: the preview route intentionally returns 404 outside development; the protected implementation lives at `/admin/partnerships`.
- State compared: ACDSee opportunity with a confirmed contact and a three-message draft sequence awaiting approval.

## Comparison findings and fixes

1. P1 workflow-state mismatch: the first implementation showed Step 2 as complete merely because a draft existed. Fixed so Step 2 is highlighted as the active approval gate until an administrator approves the sequence.
2. P1 schedule usability: follow-up editors expanded automatically and made the page unnecessarily tall. Fixed by placing each follow-up editor behind an explicit “Edit email” disclosure.
3. P1 delivery-state safety: repeated approval and invalid pause/resume transitions were possible through direct API calls. Fixed with server-side state guards and a controlled failed-message retry when a paused sequence resumes.
4. P2 density mismatch: the goal field occupied too much vertical space. Replaced it with a compact goal input beside a clear tone selector, allowing the email body and schedule to surface sooner.
5. P2 approval clarity: added an explicit AI drafting notice and gold approval action stating that no message sends before approval.
6. P2 competing automation risk: AI generation now refuses to create a second sequence while an active or paused sequence already exists for the partner.

## Interaction and system checks

- Administrator authorization and current SuperAdmin MFA are required by the CRM page and mutation endpoints.
- Opportunity and contact fields save through the database-backed CRM API.
- AI creates three editable emails with business-day spacing; deterministic fallback copy is used if generation is unavailable.
- Approval schedules emails and creates the related follow-up task and audit activity.
- The five-minute delivery job claims each due message atomically, preventing duplicate sends.
- A Gmail reply stops remaining follow-ups when “Stop when the contact replies” is enabled.
- Failed delivery pauses the sequence and surfaces the error; resume retries failed mail after a five-minute safety delay.
- Email is sent only through the server-held Gmail connection for `mitch@photoview.io`.
- 169 automated tests passed.
- ESLint passed.
- Production build passed.
- `git diff --check` passed.

## Visual review

- The implementation preserves the PhotoView dark navigation, warm neutral canvas, gold active state, white record cards, compact five-column opportunity summary, three-step workflow, two-column outreach workspace, and bottom context strip from the selected direction.
- Typography, spacing, borders, colors, control hierarchy, and desktop proportions are consistent with the existing PhotoView design system.
- No remaining P0, P1, or P2 visual findings.

## Final result

final result: passed
