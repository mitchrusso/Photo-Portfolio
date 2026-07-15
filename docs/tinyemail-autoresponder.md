# PhotoViewPro TinyEmail Autoresponder

## Lists And Tags

Create these lists:

- `PhotoView.io Trial`
- `PhotoView.io Customers`

Create/use these tags:

- `photoviewpro:trial`
- `photoviewpro:trial-registered`
- `photoviewpro:trial-converted`
- `photoviewpro:customer`
- `photoviewpro:canceled`
- `photoviewpro:payment-failed`
- `photoviewpro:plan:starter`
- `photoviewpro:plan:growth`
- `photoviewpro:plan:studio`
- `photoviewpro:plan:premier`
- `photoviewpro:storage-75`
- `photoviewpro:storage-90`
- `photoviewpro:storage-exceeded`

Trial registration webhook payload should add the trial tags and start this sequence.

Stripe conversion webhook payload should:

- remove `photoviewpro:trial`
- add `photoviewpro:customer`
- add `photoviewpro:trial-converted`
- move or copy the subscriber to `PhotoView.io Customers`
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

Preview: A focused link gets more attention than a giant unsorted collection.

Body:

Hi {{ first_name }},

When you share your work, don’t make people browse your entire library.

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

### Customer Email 2: Day 2

Subject: Make your best portfolio easier to share

Preview: One focused gallery link can do more than a full website link.

Body:

Hi {{ first_name }},

Now that your PhotoViewPro account is active, make sure your strongest portfolio is easy to send.

Open Settings > Sharing and choose whether you want to share:

- the full portfolio grid
- one specific portfolio
- an embeddable version for another website
- a mobile-friendly companion link

Then configure the social accounts you actually use. PhotoViewPro is built so a photographer can publish a curated portfolio without asking the viewer to dig through everything.

### Customer Email 3: Day 5

Subject: Keep originals safe, but show lighter files first

Preview: Display images can load fast while originals stay preserved.

Body:

Hi {{ first_name }},

PhotoViewPro is designed around a simple storage idea:

- keep the original image safe
- generate smaller display files for browsing
- let mobile viewers see a fast, clean gallery
- reserve full-resolution downloads for when they are actually needed

That keeps the experience polished while still protecting the work you uploaded.

Check Account > Usage to see current storage.

### Customer Email 4: Day 10

Subject: A portfolio is not a storage dump

Preview: Hide what does not belong in the public story.

Body:

Hi {{ first_name }},

The strongest portfolios are edited.

Inside each portfolio, review the photos and hide anything that does not belong in the public presentation. The image can remain in your account, but it does not need to appear in the gallery.

Use PhotoViewPro like a publishing layer: show the strongest work, keep the rest private, and make the viewing experience feel intentional.

## Usage Warning Sequences

These sequences are started by the hourly usage checker at `/api/usage/check-thresholds`. The endpoint is protected by `CRON_SECRET` and is scheduled in `vercel.json`.

### Storage 75%

Trigger tag: `photoviewpro:storage-75`

Subject: Your PhotoViewPro storage is 75% full

Preview: You still have room, but it is a good time to review your plan.

Body:

Hi {{ first_name }},

Your PhotoViewPro account has reached about 75% of its storage allowance.

No action is required today, but this is a good moment to review what is in the account:

- remove images you no longer need
- keep only curated portfolios public
- upgrade before uploads are interrupted

You can review usage and upgrade options from your Account page.

### Storage 90%

Trigger tag: `photoviewpro:storage-90`

Subject: Your PhotoViewPro storage is almost full

Preview: Upgrade or clean up before new uploads are blocked.

Body:

Hi {{ first_name }},

Your PhotoViewPro account is using about 90% of its storage allowance.

To avoid upload interruptions, choose one of these options:

- upgrade to the next plan
- remove files you no longer need
- contact us for a larger storage package

If you enabled auto-rollover, we will use your selected overage preference when the account reaches its limit.

### Storage Exceeded

Trigger tag: `photoviewpro:storage-exceeded`

Subject: Your PhotoViewPro storage limit has been reached

Preview: Uploads may pause until you upgrade or free up space.

Body:

Hi {{ first_name }},

Your PhotoViewPro account has reached its storage limit.

Existing galleries remain available, but new uploads may be paused until you upgrade, purchase more storage, or remove files.

Go to your Account page to choose your next step.

## Payment And Cancellation Sequences

### Payment Failed

Trigger tag: `photoviewpro:payment-failed`

Subject: Please update your PhotoViewPro payment method

Preview: Keep your galleries live by updating your billing details.

Body:

Hi {{ first_name }},

We could not complete the latest PhotoViewPro payment.

Please update your payment method so your portfolios, embeds, and mobile galleries stay available without interruption.

### Canceled

Trigger tag: `photoviewpro:canceled`

Subject: Your PhotoViewPro subscription has been canceled

Preview: Here is what happens next.

Body:

Hi {{ first_name }},

Your PhotoViewPro subscription has been canceled.

Your account access and gallery availability will follow the subscription terms shown in your account. If you canceled by mistake or want to keep your portfolios online, return to your Account page and reactivate.

## Automation Rules

Start trial sequence when tag is added:

- `photoviewpro:trial`

Stop trial sequence when any of these tags are added:

- `photoviewpro:customer`
- `photoviewpro:trial-converted`

Start customer sequence when tag is added:

- `photoviewpro:customer`

Start usage warning sequences when these tags are added:

- `photoviewpro:storage-75`
- `photoviewpro:storage-90`
- `photoviewpro:storage-exceeded`

Start billing sequences when these tags are added:

- `photoviewpro:payment-failed`
- `photoviewpro:canceled`

Segment by plan using:

- `photoviewpro:plan:starter`
- `photoviewpro:plan:growth`
- `photoviewpro:plan:studio`
- `photoviewpro:plan:premier`

## App Integration

The app updates TinyEmail directly when `TINYEMAIL_API_KEY` is configured. If that key is not configured, it falls back to `AUTORESPONDER_WEBHOOK_URL`.

The app sends autoresponder events from:

- `/api/trial/register` for `trial_registered`
- `/api/stripe/webhook` for `trial_converted`
- `/api/usage/check-thresholds` for storage warning tags

The usage checker is scheduled hourly by Vercel Cron. It will only send a new warning when the subscriber crosses a higher alert level. For example, a subscriber gets the 75% storage tag once, then the 90% storage tag only after crossing 90%.

## TinyEmail Setup Checklist

1. Create or confirm the `PhotoView.io Trial` and `PhotoView.io Customers` lists.
2. Create every tag listed in the Lists And Tags section.
3. Create the trial automation and trigger it from `photoviewpro:trial`.
4. Add stop rules to the trial automation for `photoviewpro:customer` and `photoviewpro:trial-converted`.
5. Create the customer automation and trigger it from `photoviewpro:customer`.
6. Create one short automation for each usage warning tag.
7. Create the payment failed and canceled automations.
8. Test with a sandbox registration email before sending traffic to the live registration page.

## TinyEmail Workflow Setup Notes

TinyEmail's Workflows screen may hide the `Add New` button in narrower browser widths. Use a desktop-width browser, then open:

```text
https://app.tinyemail.com/main/workflows
```

Choose `Add New` > `From Scratch` to create draft workflows.

Observed limitation: the Workflow `API` trigger says API keys for triggering workflows are only available to Enterprise customers. On the current account, do not rely on direct Workflow API triggers unless the account is upgraded or TinyEmail support enables that capability.

Preferred current approach:

- PhotoViewPro updates TinyEmail contacts directly through `TINYEMAIL_API_KEY`.
- TinyEmail automations should be started from contact tags such as `photoviewpro:trial`, `photoviewpro:customer`, and `photoviewpro:storage-90`.
- Keep workflows as drafts until the trigger rule is confirmed and tested with a sandbox subscriber.
