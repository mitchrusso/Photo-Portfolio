# PhotoView.io social automation audit — July 17, 2026

## Executive conclusion

The audit found that PhotoView.io originally had a useful queue planner but no delivery engine. The implementation that followed this audit now adds the secure foundation for direct Facebook Page and Instagram Professional publishing: exact photo selection, every-N-days cadence, editable post text, Meta OAuth, encrypted provider tokens, persistent delivery jobs, scheduled processing, retry handling, pause/cancel behavior, and delivery history.

Automatic publishing remains deliberately unavailable until PhotoView.io's Meta app credentials and approval are configured. The interface states this clearly and disables activation when no authorized destination exists.

Implementation evidence: `04-implemented-scheduler.png`.

## Tested flow

1. Opened Settings → Setup and reviewed social account configuration. The fields store public profile URLs for manual sharing; they are not publishing authorization.
   - Evidence: `01-social-setup.png`
2. Opened Settings → Scheduler, chose a portfolio and Facebook, and reviewed all controls.
   - Evidence: `02-scheduler-draft.png`
3. Configured two posts per day, spaced four hours apart. The preview correctly produced seven posts over several days.
   - Evidence: `03-scheduler-queue.png`
4. Saved the draft, waited for subscriber-workspace synchronization, reloaded the page, and confirmed that the selected platform and 2-post/4-hour cadence persisted.
5. Ran the regression suite before implementation. All 87 tests passed, including the scheduler test that verifies hidden-photo exclusion, visible-photo order, captions, and 3-hour spacing.
6. Searched the application for delivery infrastructure. No social OAuth connection, scheduled publisher, delivery worker, retry/status flow, or social delivery API is implemented. The UI explicitly hard-codes the automatic connection count to zero.

No external social post was attempted because the product has no authorized publishing connection and the audit did not modify a real social account.

## Implementation completed after the audit

- Subscribers can select the exact visible photos to include and edit the exact text for each scheduled post.
- Cadence supports one to thirty days between posting days, one to three posts per posting day, and explicit spacing.
- The queue adds the public portfolio link when requested and shows the resulting posting dates before activation.
- Facebook Pages and Instagram Professional accounts can be connected through Meta OAuth without collecting social-media passwords.
- Provider access tokens are encrypted at rest and OAuth state is signed, expiring, and bound to the subscriber workspace.
- Activation creates persistent delivery records. A protected five-minute production job claims due work safely, publishes it, records platform post IDs, and retries transient failures up to five times.
- Pausing a plan or disconnecting a destination cancels unpublished deliveries.
- The scheduler distinguishes **Save plan** from **Activate publishing** and shows recent delivery outcomes.
- Regression coverage increased to 89 tests; lint, TypeScript, Prisma validation, and the production build all pass.

## What works well

- The four-step flow is understandable: choose work, platforms, pace, and post details.
- Hidden photos are automatically excluded.
- The visual queue makes dates, times, platforms, images, and order easy to inspect.
- Draft settings persist after subscriber-workspace synchronization.
- The product correctly states that profile URLs allow manual sharing and that automatic publishing requires authorization.
- The repeat option is off by default, which prevents accidental endless recycling.
- Inputs have visible labels and generally adequate target sizes.

## Material product gaps

### Critical — automation is not implemented

- `Activate queue` only saves `status: active`; it does not publish anything.
- There is no OAuth authorization, background scheduler/worker, delivery log, retry handling, failure alert, or analytics.
- Because the button looks operational, subscribers could reasonably believe their work will publish when it will not.

Recommendation: until real delivery exists, rename the feature **Social Queue Planner**, replace `Activate queue` with **Save plan**, and state that each post still requires manual approval. Do not sell it as automation yet.

### High — users cannot precisely choose the content

- A user chooses one portfolio, then every visible photo is included in display order.
- Individual photos cannot be selected, excluded, reordered, skipped, rescheduled, or edited from the queue.
- One caption rule is applied to every platform. There is no platform-specific text, crop, preview, hashtags, or link behavior.
- Every queued item targets all selected networks instead of allowing per-post network choices.
- The `Include portfolio link` value is saved, but the queue builder does not use it or attach a link to a scheduled item.

Recommendation: add an explicit photo-selection step and an editable per-post preview where users can change image, order, caption, destination networks, link, and scheduled time.

### High — cadence choices are too narrow

- Current choices are 1–3 posts per day and fixed 2, 3, 4, 5, 6, 8, 10, or 12-hour spacing.
- There is no “every N days,” weekly cadence, weekday selection, blackout hours, end date, campaign duration, or explicit timezone control.
- Adding fixed 24-hour increments can shift local posting time across daylight-saving transitions.

Recommendation: support daily, selected weekdays, every N days, and a custom schedule; let the user choose a timezone and show the resulting local time before activation.

### Medium — accessibility and clarity

- Platform selectors do not expose `aria-pressed`, so assistive technology cannot reliably announce selected state.
- The numbered sections are visually styled paragraphs rather than semantic headings.
- Disabled networks rely heavily on reduced opacity and a small `SET UP` label.

Recommendation: add toggle semantics, semantic subheadings, and stronger disabled-state explanations.

## Recommended delivery sequence

1. **Truthful preview release:** relabel the current feature as a queue planner, fix the unused portfolio-link option, add photo selection and per-post editing.
2. **One-network publishing pilot:** implement secure authorization and real delivery for a single network, including revoke, status, retries, and failure alerts.
3. **Scheduling controls:** add weekdays/every-N-days/custom timing, timezone, and campaign end behavior.
4. **Multi-network expansion:** add platform-specific media and caption rules, then additional authorized networks.
5. **Value layer:** delivery history, engagement analytics, best-time suggestions, reusable campaign templates, and AI-assisted captions that always require subscriber review.

## Product opportunity

This can become a major differentiator because PhotoView.io already knows the photographer's portfolios, order, captions, hidden state, and public links. The safest high-value version is not “set it and forget it” first; it is a trustworthy campaign builder with exact previews, explicit authorization, reliable delivery evidence, and simple recovery when a network rejects a post.
