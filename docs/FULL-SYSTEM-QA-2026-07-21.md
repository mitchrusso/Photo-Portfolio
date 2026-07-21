# PhotoView.io full-system QA report

Date: July 21, 2026  
Environment: isolated local development workspace (`dev@example.com`)  
Production subscriber data changed: no

## Result

The complete public site, authenticated subscriber workspace, website builder, Settings system, portfolio viewer, sharing tools, and representative protected APIs were swept. Reproducible defects were fixed as they were found. The final application passes the browser acceptance checks, 152 regression tests, ESLint, TypeScript, the optimized Next.js production build, the dependency security audit, and Git whitespace validation.

## What was exercised

### Public experience

- Marketing home, Articles & Tutorials, individual articles, comparison, contact, copyright/DMCA, privacy, terms, license, registration, login, portfolio index, website preview, blog, trips, gear, sitemap, robots, and health routes.
- Public portfolio index through an individual portfolio viewer.
- Gallery grid, previous/next photograph, lightbox, fullscreen control, Favorite, Share gallery, copy-link feedback, and QR-code help/dialog.
- Anonymous access boundaries for protected account, dashboard, SuperAdmin, and API routes.

### Subscriber workspace

- Desktop and mobile navigation, Dashboard, Library, My Website, Portfolios, Mobile Access, Settings, Account, logout link, Hints, AI Help, and Tours.
- Portfolio creation and permanent deletion, including exact `DELETE` confirmation.
- Cover selection, hide/show, thumbnail and single-image modes, drag/reorder presentation, portfolio information, sharing, and downloads.
- Library search, filters, selection, details, and destination controls.
- Gallery creation, rename, switching, moving a portfolio between galleries, and empty-gallery deletion.
- Account identity display, billing/storage summary, and referral link copy confirmation.
- Mobile companion copy-link feedback.
- Bug/Feature Request dialog, screenshot capture, file attachment affordance, reporter identity, and send-button validation. No real support email was sent during QA.

### Website builder and Settings

- Template switching, page/section editing, desktop/mobile previews, save states, and all four All Portfolios display modes: thumbnails, film strip, cover cards, and slideshow.
- All nine Settings tabs and all five Imports tabs: Lightroom, Phone, Smart Folders, SmugMug Import, and Photo Upload.
- Guided help is present for the current Settings and import organization.

### API and security coverage

- Authenticated reads for account summary, galleries, website draft, and social connections.
- Secure share-link creation and opaque public share URLs.
- Authorization behavior on privileged and workspace-scoped routes.
- Source checks for unsafe dynamic evaluation, untrusted target-blank links, public storage-reference leakage, private-network URL fetching, upload validation, signed tokens, Stripe webhook replay protection, SuperAdmin MFA, and workspace scoping.
- Production dependency audit: zero known high-severity production vulnerabilities.

## Defects fixed during this sweep

1. **Permanent portfolio deletion relied on a browser prompt.** Replaced it with an accessible in-page confirmation dialog requiring the exact word `DELETE`, a disabled destructive action until confirmed, progress feedback, and error handling.
2. **Mobile dashboard navigation was unlabeled and awkward.** Added an explicit Menu/Close control, expanded-state semantics, collapsed mobile sections, and automatic closing after navigation.
3. **Mobile companion copy offered no confirmation.** Added Copy, Copied, and Try again states with accessible labels.
4. **AI Portfolio Assistant could spin forever.** Added bounded client and server timeouts, disabled automatic retries, cleanup, and a useful retry message.
5. **The public portfolio index opened nonexistent `/g/...` routes.** Added working static demo-gallery routes and connected every demo card to the correct viewer.
6. **Feedback screenshots failed on the site's modern `lab()`/`oklab()` colors.** Added browser color normalization and native foreign-object rendering.
7. **Feedback screenshots could be tainted by protected gallery images.** Images are now safely inlined for capture, responsive image attributes are restored afterward, and the verified screenshot is attachable.
8. **Portfolio deletion and gallery terminology were unclear.** Subscriber-facing defaults now say `My Gallery (default)` while preserving the internal persistence sentinel.
9. **Some external links omitted opener protection.** Added `rel="noreferrer"` to the affected registration, embed, and sharing links.
10. **Above-the-fold portfolio covers produced an image-loading warning.** The first visible public cover now loads eagerly while later covers remain lazy.
11. **Dashboard cover loading was not prioritized consistently.** The active cover loads eagerly and non-active covers remain lazy.

## Final verification

- Regression suite: **152 passed, 0 failed**
- ESLint: **passed**
- TypeScript: **passed**
- Next.js production build: **passed**; 118 static pages generated
- `npm audit --omit=dev --audit-level=high`: **0 vulnerabilities**
- `git diff --check`: **passed**
- Browser console on the clean baseline: no application warnings or errors
- Feedback screenshot acceptance: **Screenshot captured and attached**

## Deliberately excluded from unattended execution

These flows require real third-party side effects or private credentials. Their code paths and safeguards were reviewed, but the final external action was not triggered:

- A live Stripe charge, refund, or customer-portal mutation.
- Delivery of a real Twilio SMS.
- Publishing to a subscriber's Facebook, Instagram, LinkedIn, Pinterest, X, TikTok, or YouTube account.
- App Store or Google Play submission.
- Sending a real feedback/support email.
- Importing or deleting content in a real SmugMug or subscriber workspace.

Those are release-checkpoint tests, not unresolved application defects.
