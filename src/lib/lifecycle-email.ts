import { createCancellationSurveyToken } from "@/lib/cancellation-survey-token"
import type { FeatureAcademyKey } from "@/lib/feature-academy"
import {
  recordOperationalEvent,
  resolveOperationalEventsByFingerprintPrefix,
} from "@/lib/operational-monitoring"

type LifecycleEmailStatus = "not_configured" | "sent" | "failed"

type EmailPayload = {
  html: string
  preview?: string
  replyTo?: string
  subject: string
  text: string
  to: string
}

type TrialWelcomeInput = {
  dashboardUrl: string
  firstName: string
  planName: string
  trialEndsAt: Date
}

type UsageWarningInput = {
  accountUrl: string
  firstName?: string | null
  level: 75 | 90 | 100
  limitBytes: number
  upgradePlanName?: string | null
  usedBytes: number
  workspaceName: string
}

type CustomerLifecycleInput = {
  accountUrl: string
  firstName?: string | null
  surveyUrl?: string
}

type HelpNudgeInput = {
  accountUrl: string
  firstName?: string | null
  kind: "no_uploads" | "no_cover"
}

type MagicLoginInput = {
  firstName?: string | null
  loginUrl: string
}

export type TrialEducationKey =
  | "trial_day_1_cover"
  | "trial_day_2_upload"
  | "trial_day_3_mobile"
  | "trial_day_4_hide"
  | "trial_day_5_sharing"
  | "trial_day_6_homepage"
  | "trial_day_7_watermark"
  | "trial_day_8_embed"
  | "trial_day_9_lightroom"
  | "trial_day_10_storage"
  | "trial_day_11_social"
  | "trial_day_12_polish"
  | "trial_day_13_expiring"

export type CustomerEducationKey =
  | "customer_day_2_sharing"
  | "customer_day_5_storage"
  | "customer_day_10_editing"

type SequenceInput = {
  accountUrl: string
  firstName?: string | null
  key: TrialEducationKey | CustomerEducationKey | FeatureAcademyKey
}

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? process.env.RESEND_FROM_EMAIL

  if (!apiKey || !from) return null
  return { apiKey, from }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value)
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(bytes >= 10 * 1024 ** 3 ? 0 : 1)} GB`
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

function layout({ html, preview }: { html: string; preview?: string }) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>PhotoView.io</title>
  </head>
  <body style="margin:0;background:#f7f4ef;color:#1f211e;font-family:Arial,Helvetica,sans-serif;">
    ${preview ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #dfd6c8;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 30px 10px;">
                <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#b98225;font-weight:700;">PhotoView.io</div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 30px;font-size:16px;line-height:1.65;color:#34342f;">
                ${html}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export async function sendLifecycleEmail(
  payload: EmailPayload,
  options: { idempotencyKey?: string } = {},
): Promise<LifecycleEmailStatus> {
  const config = getEmailConfig()
  if (!config) return "not_configured"

  try {
    const response = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({
        from: config.from,
        html: payload.html,
        ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
        subject: payload.subject,
        text: payload.text,
        to: payload.to,
      }),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
      },
      method: "POST",
    })

    if (!response.ok) {
      await recordOperationalEvent({
        category: "EMAIL",
        fingerprint: `email:resend:${response.status}`,
        message: `Resend rejected a lifecycle email with HTTP ${response.status}.`,
        metadata: { status: response.status },
        severity: response.status >= 500 ? "CRITICAL" : "ERROR",
        source: "lifecycle-email",
      })
      return "failed"
    }

    await resolveOperationalEventsByFingerprintPrefix("email:resend:")
    return "sent"
  } catch (error) {
    await recordOperationalEvent({
      category: "EMAIL",
      fingerprint: "email:resend:network",
      message: error instanceof Error ? error.message : "Resend email delivery failed",
      severity: "CRITICAL",
      source: "lifecycle-email",
    })
    return "failed"
  }
}

export function sendAdminSubscriberEmail(
  to: string,
  input: { message: string; replyTo: string; subject: string },
) {
  const message = input.message.trim()
  const subject = input.subject.trim()

  return sendLifecycleEmail({
    html: layout({
      preview: subject,
      html: `
        <h1 style="margin:18px 0 16px;font-size:28px;line-height:1.2;color:#1f211e;">${escapeHtml(subject)}</h1>
        <div style="white-space:pre-wrap">${escapeHtml(message)}</div>
      `,
    }),
    preview: subject,
    replyTo: input.replyTo,
    subject,
    text: message,
    to,
  })
}

export function sendTrialWelcomeEmail(to: string, input: TrialWelcomeInput, idempotencyKey?: string) {
  const firstName = escapeHtml(input.firstName)
  const planName = escapeHtml(input.planName)
  const trialEnd = formatDate(input.trialEndsAt)
  const dashboardUrl = input.dashboardUrl
  const preview = "Start by publishing one cinematic portfolio, then check it on mobile."

  return sendLifecycleEmail({
    html: layout({
      preview,
      html: `
        <h1 style="margin:18px 0 16px;font-size:28px;line-height:1.2;color:#1f211e;">Your 14-day trial is ready</h1>
        <p>Hi ${firstName},</p>
        <p>Welcome to PhotoView.io. Your ${planName} trial is designed around one clear outcome: publish a cinematic portfolio that looks excellent on desktop and feels effortless on mobile.</p>
        <p>Start with one curated gallery. Pick 10-25 images, choose a cover, and make the viewing experience feel intentional before organizing every photo you have ever made.</p>
        <p>Your trial runs through <strong>${trialEnd}</strong>.</p>
        <p style="margin:28px 0;">
          <a href="${dashboardUrl}" style="display:inline-block;background:#1d2b22;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Open your dashboard</a>
        </p>
        <p style="font-size:14px;color:#726b60;">PhotoView.io is a focused place to store, curate, display, and share the photographs you care about most.</p>
      `,
    }),
    preview,
    subject: "Welcome to PhotoView.io - your 14-day trial is ready",
    text: `Hi ${input.firstName},\n\nWelcome to PhotoView.io. Your ${input.planName} trial is ready and runs through ${trialEnd}.\n\nStart with one curated gallery, choose a cover, and check the experience on mobile and desktop.\n\nOpen your dashboard: ${dashboardUrl}`,
    to,
  }, { idempotencyKey })
}

export function sendPaidWelcomeEmail(to: string, input: CustomerLifecycleInput, idempotencyKey?: string) {
  const firstName = escapeHtml(input.firstName?.trim() || "there")
  const preview = "Your first payment is complete and your PhotoView.io subscription is active."

  return sendLifecycleEmail({
    html: layout({
      preview,
      html: `
        <h1 style="margin:18px 0 16px;font-size:28px;line-height:1.2;color:#1f211e;">You are in. Welcome as a PhotoView.io customer.</h1>
        <p>Hi ${firstName},</p>
        <p>Your first payment is complete and your PhotoView.io subscription is active. The next best step is to turn your strongest work into a small, polished portfolio system.</p>
        <p>Finalize your homepage cover, choose a cover image for each portfolio, configure social sharing, and confirm that your storage plan fits your workflow.</p>
        <p style="margin:28px 0;">
          <a href="${input.accountUrl}" style="display:inline-block;background:#1d2b22;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Open your account</a>
        </p>
      `,
    }),
    preview,
    subject: "You are in - welcome as a PhotoView.io customer",
    text: `Hi ${input.firstName || "there"},\n\nYour first payment is complete and your PhotoView.io subscription is active. Finalize your homepage cover, choose portfolio cover images, configure social sharing, and confirm your storage plan.\n\nOpen your account: ${input.accountUrl}`,
    to,
  }, { idempotencyKey })
}

export function sendMagicLoginEmail(to: string, input: MagicLoginInput) {
  const firstName = escapeHtml(input.firstName?.trim() || "there")
  const preview = "Use this secure link to open your PhotoView.io dashboard."

  return sendLifecycleEmail({
    html: layout({
      preview,
      html: `
        <h1 style="margin:18px 0 16px;font-size:28px;line-height:1.2;color:#1f211e;">Your secure login link</h1>
        <p>Hi ${firstName},</p>
        <p>Use the button below to sign in to your PhotoView.io subscriber dashboard. This link can only be used once and expires soon.</p>
        <p style="margin:28px 0;">
          <a href="${input.loginUrl}" style="display:inline-block;background:#1d2b22;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Open PhotoView.io</a>
        </p>
        <p style="font-size:14px;color:#726b60;">If you did not request this link, you can ignore this email.</p>
      `,
    }),
    preview,
    subject: "Your PhotoView.io login link",
    text: `Hi ${input.firstName || "there"},\n\nUse this secure link to sign in to PhotoView.io. It can only be used once and expires soon:\n\n${input.loginUrl}\n\nIf you did not request this link, you can ignore this email.`,
    to,
  })
}

export function sendHelpNudgeEmail(to: string, input: HelpNudgeInput, idempotencyKey?: string) {
  const firstName = escapeHtml(input.firstName?.trim() || "there")
  const isNoUploads = input.kind === "no_uploads"
  const title = isNoUploads ? "Need help uploading your first photos?" : "Need help choosing a portfolio cover?"
  const body = isNoUploads
    ? "It looks like a week has gone by and no photos have been uploaded yet. That usually means setup got interrupted, the import workflow was unclear, or there is a question we can answer."
    : "It looks like you have started building a portfolio, but no cover image has been selected yet. A strong cover is the easiest way to make the whole gallery feel intentional."
  const action = isNoUploads
    ? "Open PhotoView.io and upload one small set of 10-25 images. If you want help, reply to this email and tell us where you got stuck."
    : "Open the portfolio, choose the image you want visitors to see first, and click Set portfolio cover. If you want a second opinion, reply with the gallery link."

  return sendLifecycleEmail({
    html: layout({
      preview: title,
      html: `
        <h1 style="margin:18px 0 16px;font-size:28px;line-height:1.2;color:#1f211e;">${title}</h1>
        <p>Hi ${firstName},</p>
        <p>${body}</p>
        <p>${action}</p>
        <p style="margin:28px 0;">
          <a href="${input.accountUrl}" style="display:inline-block;background:#1d2b22;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Open PhotoView.io</a>
        </p>
      `,
    }),
    preview: title,
    subject: isNoUploads ? "Can we help you upload your first photos?" : "Can we help you choose a portfolio cover?",
    text: `Hi ${input.firstName || "there"},\n\n${body}\n\n${action}\n\nOpen PhotoView.io: ${input.accountUrl}`,
    to,
  }, { idempotencyKey })
}

const trialEducationTemplates: Record<TrialEducationKey, { body: string; preview: string; subject: string; title: string }> = {
  trial_day_1_cover: {
    body: "Start with one portfolio, not everything you have ever shot. Choose the cover image first. It is the front door to the gallery and sets the expectation for the whole presentation.",
    preview: "Choose one portfolio and one strong cover.",
    subject: "Day 1: Start with the cover image",
    title: "Start with the cover image",
  },
  trial_day_2_upload: {
    body: "Upload only the strongest 10-25 images first. A tight edit makes PhotoView.io feel polished fast, and it gives you something worth sharing before you spend time organizing a larger body of work.",
    preview: "Upload a tight set before building a full body of work.",
    subject: "Day 2: Upload a smaller, stronger set",
    title: "Upload a tighter set",
  },
  trial_day_3_mobile: {
    body: "Open your portfolio on your phone today. Swipe through it, rotate the phone, and use the return-to-grid control. If the photo feels like the hero, the mobile experience is doing its job.",
    preview: "Check the mobile lightbox with your own eyes.",
    subject: "Day 3: Mobile is not a smaller desktop",
    title: "Check the phone experience",
  },
  trial_day_4_hide: {
    body: "Use hide instead of delete when you are unsure. Hidden images stay in the portfolio record, but they do not appear in the public presentation. That lets you shape the story without losing work.",
    preview: "Hide weaker images without deleting them.",
    subject: "Day 4: Edit what visitors see",
    title: "Edit the public story",
  },
  trial_day_5_sharing: {
    body: "Share one specific portfolio today. A focused link gets more attention than a giant unsorted collection. Use Sharing to choose the target, copy the link, email it, or generate a QR code.",
    preview: "Send one specific portfolio link.",
    subject: "Day 5: Share one clear story",
    title: "Share one clear story",
  },
  trial_day_6_homepage: {
    body: "Set your homepage cover style. Use a rotating cover if you want the site to feel alive, or choose one static image if you want a clean, controlled first impression.",
    preview: "Choose how the public homepage introduces the work.",
    subject: "Day 6: Tune the homepage first impression",
    title: "Tune the homepage cover",
  },
  trial_day_7_watermark: {
    body: "Decide whether this portfolio needs a watermark. Use text for a simple mark or upload an image mark for a branded look. Keep it subtle enough that the photograph still leads.",
    preview: "Protect images without cluttering them.",
    subject: "Day 7: Set a tasteful watermark",
    title: "Protect without clutter",
  },
  trial_day_8_embed: {
    body: "If you already have a website, use the embed option. It lets you place a PhotoView.io portfolio on your existing site without asking visitors to leave your brand.",
    preview: "Embed a portfolio on an existing website.",
    subject: "Day 8: Add a portfolio to your own site",
    title: "Use the embed code",
  },
  trial_day_9_lightroom: {
    body: "If Lightroom is part of your workflow, open Settings > Imports and review the Lightroom setup. The goal is simple: export curated work into PhotoView.io without rebuilding the gallery by hand.",
    preview: "Connect publishing to the workflow you already use.",
    subject: "Day 9: Publish from Lightroom",
    title: "Connect Lightroom",
  },
  trial_day_10_storage: {
    body: "Open My Account and check storage usage. PhotoView.io keeps originals preserved while display images make public browsing faster, especially on mobile.",
    preview: "Know how much storage your portfolio uses.",
    subject: "Day 10: Check your usage",
    title: "Check your storage",
  },
  trial_day_11_social: {
    body: "Add the social accounts you actually use. Then the Sharing tab can show those buttons when you are ready to post a selected portfolio link.",
    preview: "Set up the social buttons you will actually use.",
    subject: "Day 11: Make sharing faster",
    title: "Connect your social accounts",
  },
  trial_day_12_polish: {
    body: "Do one final polish pass. Check each portfolio cover, remove weak public images, confirm mobile viewing, and make sure the homepage feels like the work you want people to remember.",
    preview: "A small polish pass makes the whole site feel better.",
    subject: "Day 12: Polish before you promote",
    title: "Polish the presentation",
  },
  trial_day_13_expiring: {
    body: "Your PhotoView.io trial is almost over. If the platform is helping you publish better-looking portfolios faster, keep your account active so your galleries, embeds, and mobile viewing stay available.",
    preview: "Keep your portfolios, embeds, and mobile galleries live.",
    subject: "Day 13: Your trial ends soon",
    title: "Your trial ends soon",
  },
}

const customerEducationTemplates: Record<CustomerEducationKey, { body: string; preview: string; subject: string; title: string }> = {
  customer_day_2_sharing: {
    body: "Make sure your strongest portfolio is easy to send. Open Settings > Sharing and choose whether you want to share the full portfolio grid, one specific portfolio, an embeddable version for another website, or a mobile-friendly companion link.",
    preview: "One focused gallery link can do more than a full website link.",
    subject: "Make your best portfolio easier to share",
    title: "Make sharing easier",
  },
  customer_day_5_storage: {
    body: "PhotoView.io keeps originals safe, generates smaller display files for browsing, lets mobile viewers see a fast gallery, and reserves full-resolution downloads for when they are actually needed. Check Account > Usage to see current storage.",
    preview: "Display images can load fast while originals stay preserved.",
    subject: "Keep originals safe, but show lighter files first",
    title: "Storage should support presentation",
  },
  customer_day_10_editing: {
    body: "The strongest portfolios are edited. Inside each portfolio, review the photos and hide anything that does not belong in the public presentation. Use PhotoView.io like a publishing layer: show the strongest work, keep the rest private, and make the viewing experience intentional.",
    preview: "Hide what does not belong in the public story.",
    subject: "A portfolio is not a storage dump",
    title: "Edit the public story",
  },
}

const featureAcademyTemplates: Record<FeatureAcademyKey, { body: string; preview: string; subject: string; title: string }> = {
  academy_referral_reward: {
    body: "Invite another photographer from My Account using your personal referral link. When a referred trial becomes a paid subscription, PhotoView.io permanently adds 1 GB to your storage allowance. Each qualifying referral earns the reward once, so sharing with photographers who will genuinely use the platform helps both of you.",
    preview: "A qualifying referral permanently adds 1 GB to your storage.",
    subject: "Earn a permanent 1 GB referral reward",
    title: "Grow your storage through referrals",
  },
  academy_website_builder: {
    body: "Open the Website Builder to turn your photography into a complete public site. Choose a visual style, arrange the homepage sections, control which pages are visible, select portfolio covers, add navigation, and preview the result before publishing. Start with the pages you need now; hidden sections stay available when you are ready for them.",
    preview: "Build and publish a complete photography website from one workspace.",
    subject: "Build more than a gallery with PhotoView.io",
    title: "Build your photography website",
  },
  academy_blog_trip_diary: {
    body: "Use Trips / Blog to tell the story around the photographs. Create entries for assignments, journeys, locations, or behind-the-scenes notes, then combine narrative text with your visual work. It can be a traditional blog, a trip diary, or a running field journal without maintaining a separate publishing system.",
    preview: "Turn photographs and field notes into a blog or trip diary.",
    subject: "Use your PhotoView.io site as a blog or trip diary",
    title: "Tell the story behind the photographs",
  },
  academy_affiliate_gear: {
    body: "What’s in My Bag lets visitors explore the equipment behind your work. Add exact product-page links, organize items by category, approve the correct matches, and include your permitted affiliate tracking. When a visitor follows a qualifying link and buys, the retailer may pay you a commission at no added cost to the buyer. Always follow the retailer’s program rules and keep the affiliate disclosure visible.",
    preview: "Turn an honest gear list into a useful, disclosed affiliate resource.",
    subject: "Make What’s in My Bag useful—and potentially profitable",
    title: "Share your gear and affiliate links",
  },
  academy_useful_articles: {
    body: "Useful Articles gives longer educational content a permanent home on your website. Publish location guides, technique notes, equipment lessons, or client resources with clear titles and focused copy. Helpful original articles give visitors another reason to return and can improve how search engines understand the subjects your site covers.",
    preview: "Publish lasting guides that help visitors and strengthen your site.",
    subject: "Create useful articles visitors can find again",
    title: "Teach what you know",
  },
  academy_social_queue: {
    body: "Use the Social Scheduler to prepare an approval-based queue from your portfolio work. Choose what to feature, review the suggested schedule, and keep the captions and links organized before posting. Direct automatic publishing is not enabled yet, so you remain in control of the final post while PhotoView.io helps plan the queue.",
    preview: "Plan an approval-based social queue without giving up control.",
    subject: "Plan your social posts from one organized queue",
    title: "Prepare social posts in advance",
  },
  academy_portfolio_galleries: {
    body: "Create separate portfolio galleries for distinct bodies of work—weddings, landscapes, assignments, travel, or client stories. Each gallery can contain its own curated photographs, cover, order, and public presentation. PhotoView.io does not impose a separate gallery-count cap, although every plan’s storage allowance still applies to the photographs you upload.",
    preview: "Separate bodies of work into focused, curated portfolio galleries.",
    subject: "Organize multiple bodies of work into galleries",
    title: "Give every portfolio a clear purpose",
  },
  academy_mobile_companion: {
    body: "Create a Mobile Companion when you want your work to fill a phone screen with minimal distraction. Select the portfolios to include, generate the mobile link, and share it by email or QR code. Viewers can add it to their home screen for quick access, making it useful for meetings, events, and in-person conversations.",
    preview: "Create a full-width mobile viewer and share it by link or QR code.",
    subject: "Put a focused PhotoView.io viewer on any phone",
    title: "Create a Mobile Companion",
  },
  academy_embed_portfolios: {
    body: "Already have a website? Use Sharing to generate an embed for the full portfolio grid or a specific portfolio. Paste the responsive embed code into a page on your existing site so visitors can explore the work without leaving your domain. The embed expands to the available width while keeping the presentation contained and polished.",
    preview: "Place a responsive PhotoView.io gallery inside an existing website.",
    subject: "Embed your portfolios on the website you already own",
    title: "Bring PhotoView.io into your existing site",
  },
  academy_privacy_protection: {
    body: "Match the protection settings to the audience. Hide images that are not ready for public presentation, use a gallery password for restricted access, choose whether downloads are allowed, and add a subtle text or image watermark when appropriate. These controls help you publish intentionally while preserving your originals.",
    preview: "Use visibility, passwords, downloads, and watermarks intentionally.",
    subject: "Choose the right protection for each portfolio",
    title: "Control how your work is viewed",
  },
  academy_import_workflows: {
    body: "Settings > Imports brings existing work into PhotoView.io without rebuilding everything one photograph at a time. Choose the workflow that fits your source—Lightroom, SmugMug, a desktop folder, or a mobile device—then review the imported galleries before publishing. A smaller first import is the safest way to confirm naming and organization.",
    preview: "Move work from Lightroom, SmugMug, desktop folders, or mobile.",
    subject: "Use the fastest import path for your current workflow",
    title: "Bring your existing work with you",
  },
  academy_library_organization: {
    body: "Treat the library as your working collection and each public gallery as a deliberate edit. Use clear gallery names, reorder photographs to shape the sequence, update titles and descriptions in batches, and hide images that do not support the story. Good organization makes future publishing and sharing much faster.",
    preview: "Organize once so future publishing and sharing stay fast.",
    subject: "Turn your photo library into an organized publishing system",
    title: "Organize for the next portfolio, too",
  },
  academy_sharing_tools: {
    body: "The Sharing area gives each presentation more than one route to its audience. Copy a direct link, email a selected portfolio, create a QR code for print or events, prepare a social post, or generate an embed for another website. Choose the narrowest destination that matches the conversation instead of always sending visitors to the homepage.",
    preview: "Use direct links, email, QR codes, social tools, and embeds.",
    subject: "Share the right portfolio in the right format",
    title: "Make every share more focused",
  },
  academy_business_pages: {
    body: "A photography site needs context as well as images. Use About for your story and portrait, Contact for inquiries, Custom Page for services or project information, and the navigation and social profile settings to help visitors move confidently through the site. Show only the pages that support the experience you want today.",
    preview: "Add the pages that turn a portfolio into a complete business website.",
    subject: "Complete your site with About, Contact, and custom pages",
    title: "Give visitors a clear next step",
  },
  academy_merlin_help: {
    body: "When you are unsure where to begin, select Take a Tour inside PhotoView.io. Choose the feature or outcome you want—such as publishing a website, sharing a portfolio, or checking storage—and follow the guided tour to reach the right controls. You can also describe the result you want in plain language and PhotoView.io will choose the shortest reliable tour.",
    preview: "Choose an outcome and follow a guided PhotoView.io Tour.",
    subject: "Take a Tour of the PhotoView.io tools you need",
    title: "Get help without leaving your workspace",
  },
}

export function sendSequenceEmail(to: string, input: SequenceInput, idempotencyKey?: string) {
  const firstName = escapeHtml(input.firstName?.trim() || "there")
  const template = input.key.startsWith("trial_")
    ? trialEducationTemplates[input.key as TrialEducationKey]
    : input.key.startsWith("academy_")
      ? featureAcademyTemplates[input.key as FeatureAcademyKey]
      : customerEducationTemplates[input.key as CustomerEducationKey]

  return sendLifecycleEmail({
    html: layout({
      preview: template.preview,
      html: `
        <h1 style="margin:18px 0 16px;font-size:28px;line-height:1.2;color:#1f211e;">${template.title}</h1>
        <p>Hi ${firstName},</p>
        <p>${template.body}</p>
        <p style="margin:28px 0;">
          <a href="${input.accountUrl}" style="display:inline-block;background:#1d2b22;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Open PhotoView.io</a>
        </p>
      `,
    }),
    preview: template.preview,
    subject: template.subject,
    text: `Hi ${input.firstName || "there"},\n\n${template.body}\n\nOpen PhotoView.io: ${input.accountUrl}`,
    to,
  }, { idempotencyKey })
}

export function sendPaymentFailedEmail(to: string, input: CustomerLifecycleInput, idempotencyKey?: string) {
  const firstName = escapeHtml(input.firstName?.trim() || "there")
  const preview = "Keep your galleries live by updating your billing details."

  return sendLifecycleEmail({
    html: layout({
      preview,
      html: `
        <h1 style="margin:18px 0 16px;font-size:28px;line-height:1.2;color:#1f211e;">Please update your payment method</h1>
        <p>Hi ${firstName},</p>
        <p>We could not complete the latest PhotoView.io payment. Please update your payment method so your portfolios, embeds, and mobile galleries stay available without interruption.</p>
        <p style="margin:28px 0;">
          <a href="${input.accountUrl}" style="display:inline-block;background:#1d2b22;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Manage billing</a>
        </p>
      `,
    }),
    preview,
    subject: "Please update your PhotoView.io payment method",
    text: `Hi ${input.firstName || "there"},\n\nWe could not complete the latest PhotoView.io payment. Please update your payment method so your portfolios stay available.\n\nManage billing: ${input.accountUrl}`,
    to,
  }, { idempotencyKey })
}

export function sendSubscriptionCanceledEmail(
  to: string,
  input: CustomerLifecycleInput,
  idempotencyKey?: string,
) {
  const firstName = escapeHtml(input.firstName?.trim() || "there")
  const preview = "Please tell us why you canceled."
  const fallbackSurveyToken = createCancellationSurveyToken({ email: to })
  const surveyUrl = input.surveyUrl ?? `${new URL(input.accountUrl).origin}/cancel-survey?token=${encodeURIComponent(fallbackSurveyToken)}`

  return sendLifecycleEmail({
    html: layout({
      preview,
      html: `
        <h1 style="margin:18px 0 16px;font-size:28px;line-height:1.2;color:#1f211e;">Your subscription has been canceled</h1>
        <p>Hi ${firstName},</p>
        <p>Your PhotoView.io subscription has been canceled. Your account access and gallery availability will follow the subscription terms shown in your account.</p>
        <p>If you canceled by mistake or want to keep your portfolios online, return to your Account page and reactivate.</p>
        <p>Before you go, would you tell us why you canceled? Your answer helps us decide what to improve next.</p>
        <ul style="margin:0 0 22px 20px;padding:0;color:#3d3a35;line-height:1.65;">
          <li>The cost is too high</li>
          <li>The service did not work for you</li>
          <li>The site lacks a feature you need for the way you work</li>
          <li>You did not have enough time to set it up</li>
          <li>You only needed it temporarily</li>
          <li>Something else</li>
        </ul>
        <p style="margin:28px 0;">
          <a href="${surveyUrl}" style="display:inline-block;background:#d8a84f;color:#171814;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Tell us why you canceled</a>
        </p>
        <p style="margin:28px 0;">
          <a href="${input.accountUrl}" style="display:inline-block;background:#1d2b22;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Open your account</a>
        </p>
      `,
    }),
    preview,
    subject: "Your PhotoView.io subscription has been canceled",
    text: `Hi ${input.firstName || "there"},\n\nYour PhotoView.io subscription has been canceled. Your account access and gallery availability will follow the subscription terms shown in your account.\n\nPlease tell us why you canceled: ${surveyUrl}\n\nOpen your account: ${input.accountUrl}`,
    to,
  }, { idempotencyKey })
}

export function sendUsageWarningEmail(to: string, input: UsageWarningInput) {
  const name = escapeHtml(input.firstName?.trim() || "there")
  const exceeded = input.level === 100
  const subjectLevel = exceeded ? "limit has been reached" : `is ${input.level}% used`
  const subject = `Your PhotoView.io storage ${subjectLevel}`
  const preview = exceeded
    ? "Review your account to keep uploads and gallery viewing running smoothly."
    : "You still have options, but now is the right time to review usage."
  const used = formatBytes(input.usedBytes)
  const limit = formatBytes(input.limitBytes)
  const workspaceName = escapeHtml(input.workspaceName)
  const upgradePlanName = escapeHtml(input.upgradePlanName ?? "the next plan")
  const upgradeCopy = exceeded
    ? `Please review your account now to choose an upgrade, approve extra storage, or free up room. The fastest capacity increase is to move to ${upgradePlanName}.`
    : "No panic, but this is the right time to review your plan and storage preferences before you hit the limit."

  return sendLifecycleEmail({
    html: layout({
      preview,
      html: `
        <h1 style="margin:18px 0 16px;font-size:26px;line-height:1.2;color:#1f211e;">Your storage ${subjectLevel}</h1>
        <p>Hi ${name},</p>
        <p><strong>${workspaceName}</strong> has used <strong>${used}</strong> of <strong>${limit}</strong> storage.</p>
        <p>${upgradeCopy}</p>
        <p style="margin:28px 0;">
          <a href="${input.accountUrl}" style="display:inline-block;background:#1d2b22;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Review account usage</a>
        </p>
      `,
    }),
    preview,
    subject,
    text: `Hi ${input.firstName || "there"},\n\n${input.workspaceName} has used ${used} of ${limit} storage.\n\n${upgradeCopy}\n\nReview account usage: ${input.accountUrl}`,
    to,
  })
}
