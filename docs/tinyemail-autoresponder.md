# PhotoViewPro TinyEmail Autoresponder

## Lists And Tags

Create these lists:

- `PhotoViewPro Trial`
- `PhotoViewPro Customers`

Create/use these tags:

- `photoviewpro:trial`
- `photoviewpro:trial-registered`
- `photoviewpro:trial-converted`
- `photoviewpro:customer`
- `photoviewpro:plan:starter`
- `photoviewpro:plan:growth`
- `photoviewpro:plan:studio`
- `photoviewpro:plan:archive`

Trial registration webhook payload should add the trial tags and start this sequence.

Stripe conversion webhook payload should:

- remove `photoviewpro:trial`
- add `photoviewpro:customer`
- add `photoviewpro:trial-converted`
- move or copy the subscriber to `PhotoViewPro Customers`
- stop the trial education sequence
- start a customer onboarding sequence

## Trial Sequence

### Email 1: Immediately

Subject: Welcome to PhotoViewPro — your 14-day trial is ready

Preview: Start by publishing one beautiful portfolio, not rebuilding your entire business.

Body:

Hi {{ first_name }},

Welcome to PhotoViewPro.

Your trial is designed around one clear outcome: publish a cinematic portfolio that looks excellent on desktop and feels effortless on mobile.

Start with one curated gallery. Pick 10-25 images, choose a cover, and make the viewing experience feel intentional before you worry about every possible business feature.

Your first steps:

1. Open your dashboard.
2. Create or import one portfolio.
3. Choose a cover image.
4. Open the gallery on your phone and desktop.
5. Share the link with someone whose opinion you trust.

PhotoViewPro is not trying to replace your entire photography business platform yet. It is the fastest, cleanest way to publish a cinematic portfolio from curated work.

Mitch / PhotoViewPro

### Email 2: Day 1

Subject: The fastest way to make your first portfolio look polished

Preview: Choose the cover first, then tune the viewing experience.

Body:

Hi {{ first_name }},

The cover image is the front door to a portfolio.

Before uploading everything, choose the image that should represent the gallery. Then open the portfolio and check three things:

- Does the image display full-frame?
- Does the filmstrip make it easy to browse?
- Does the gallery feel clean on mobile?

If the answer is yes, you are already ahead of most portfolio pages.

Today’s goal: publish one gallery you would be comfortable texting to a client, editor, or friend.

### Email 3: Day 3

Subject: Mobile is not a smaller desktop

Preview: Your gallery should feel natural when someone swipes through it.

Body:

Hi {{ first_name }},

Most people will see your work on a phone first.

That means the mobile experience should not feel like a squeezed-down desktop page. In PhotoViewPro, mobile viewing is built around full-screen lightbox behavior, swipe navigation, quick exit, and a return-to-grid flow.

Open your portfolio on your phone and ask:

- Can I swipe naturally?
- Can I get back to the grid quickly?
- Are the controls helping or distracting?

If the photo is the hero, the interface is doing its job.

### Email 4: Day 5

Subject: Sharing one portfolio is better than sharing everything

Preview: A focused link gets more attention than a giant archive.

Body:

Hi {{ first_name }},

When you share your work, don’t make people browse your entire archive.

Send the portfolio that matches the moment:

- Travel work to a travel buyer
- Wedding work to a wedding prospect
- Fine art work to a collector
- Event work to the event client

In PhotoViewPro, use the Sharing tab to choose whether you’re sharing the full portfolio grid or one specific portfolio. Then use the configured social buttons, email invite, QR code, or embed code.

One link. One story. Better response.

### Email 5: Day 8

Subject: Protect your images without making the gallery ugly

Preview: Watermarks, downloads, privacy, and social sharing should be subscriber choices.

Body:

Hi {{ first_name }},

Photo protection should be flexible.

Some galleries should be public. Some should be unlisted. Some should allow downloads. Some should not. Some need a watermark. Some look better without one.

In your gallery settings, review:

- Privacy
- Downloads
- Public copy/share options
- Watermark text or image
- Cover image
- Hidden photos

The goal is control without clutter.

### Email 6: Day 11

Subject: What to publish before your trial ends

Preview: Build a small portfolio system, not a giant unfinished website.

Body:

Hi {{ first_name }},

Before your trial ends, aim for this simple setup:

- 3-5 strong portfolios
- A strong cover image for each
- A homepage cover style you like
- Mobile viewing checked
- Social accounts configured
- At least one portfolio shared publicly

That is enough to know whether PhotoViewPro fits your publishing workflow.

You can always expand later. Start with the work that best represents you.

### Email 7: Day 13

Subject: Your PhotoViewPro trial ends soon

Preview: Keep your portfolios live and continue publishing curated work.

Body:

Hi {{ first_name }},

Your PhotoViewPro trial is almost over.

If the platform is helping you publish better-looking portfolios faster, keep your account active so your galleries stay available and your publishing workflow stays intact.

What you keep:

- Portfolio-first gallery display
- Mobile-friendly viewing
- Subscriber-controlled downloads, sharing, privacy, and watermarking
- Storage matched to your selected plan
- A cleaner way to publish curated work

Thanks for trying PhotoViewPro.

## Customer Sequence

### Customer Email 1: Immediately After Payment

Subject: You’re in — welcome as a PhotoViewPro customer

Preview: Your trial is now an active account.

Body:

Hi {{ first_name }},

Welcome as a PhotoViewPro customer.

Your account has moved from trial to active. The next best step is to turn your strongest work into a small, polished portfolio system:

1. Finalize your homepage cover.
2. Make sure each portfolio has a chosen cover image.
3. Configure social sharing accounts.
4. Confirm your storage plan fits your workflow.
5. Share one portfolio publicly.

We’ll keep improving PhotoViewPro around the same mission: cinematic portfolio display on desktop, effortless viewing on mobile.

## Automation Rules

Start trial sequence when tag is added:

- `photoviewpro:trial`

Stop trial sequence when any of these tags are added:

- `photoviewpro:customer`
- `photoviewpro:trial-converted`

Start customer sequence when tag is added:

- `photoviewpro:customer`

Segment by plan using:

- `photoviewpro:plan:starter`
- `photoviewpro:plan:growth`
- `photoviewpro:plan:studio`
- `photoviewpro:plan:archive`

## App Integration

The app sends `AUTORESPONDER_WEBHOOK_URL` payloads from:

- `/api/trial/register` for `trial_registered`
- `/api/stripe/webhook` for `trial_converted`

Use TinyEmail directly if it supports inbound webhooks. If not, use Zapier, Make, or Pabbly:

PhotoViewPro webhook -> TinyEmail add/update subscriber -> add/remove tags -> start/stop automation.
