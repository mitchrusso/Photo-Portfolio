type LifecycleEmailStatus = "not_configured" | "sent" | "failed"

type EmailPayload = {
  html: string
  preview?: string
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
  metric: "storage" | "bandwidth"
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
  key: TrialEducationKey | CustomerEducationKey
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
    <title>PhotoViewPro</title>
  </head>
  <body style="margin:0;background:#f7f4ef;color:#1f211e;font-family:Arial,Helvetica,sans-serif;">
    ${preview ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #dfd6c8;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 30px 10px;">
                <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#b98225;font-weight:700;">PhotoViewPro</div>
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

export async function sendLifecycleEmail(payload: EmailPayload): Promise<LifecycleEmailStatus> {
  const config = getEmailConfig()
  if (!config) return "not_configured"

  try {
    const response = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({
        from: config.from,
        html: payload.html,
        subject: payload.subject,
        text: payload.text,
        to: payload.to,
      }),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    return response.ok ? "sent" : "failed"
  } catch {
    return "failed"
  }
}

export function sendTrialWelcomeEmail(to: string, input: TrialWelcomeInput) {
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
        <p>Welcome to PhotoViewPro. Your ${planName} trial is designed around one clear outcome: publish a cinematic portfolio that looks excellent on desktop and feels effortless on mobile.</p>
        <p>Start with one curated gallery. Pick 10-25 images, choose a cover, and make the viewing experience feel intentional before organizing every photo you have ever made.</p>
        <p>Your trial runs through <strong>${trialEnd}</strong>.</p>
        <p style="margin:28px 0;">
          <a href="${dashboardUrl}" style="display:inline-block;background:#1d2b22;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Open your dashboard</a>
        </p>
        <p style="font-size:14px;color:#726b60;">PhotoViewPro is a focused place to store, curate, display, and share the photographs you care about most.</p>
      `,
    }),
    preview,
    subject: "Welcome to PhotoViewPro - your 14-day trial is ready",
    text: `Hi ${input.firstName},\n\nWelcome to PhotoViewPro. Your ${input.planName} trial is ready and runs through ${trialEnd}.\n\nStart with one curated gallery, choose a cover, and check the experience on mobile and desktop.\n\nOpen your dashboard: ${dashboardUrl}`,
    to,
  })
}

export function sendPaidWelcomeEmail(to: string, input: CustomerLifecycleInput) {
  const firstName = escapeHtml(input.firstName?.trim() || "there")
  const preview = "Your trial is now an active PhotoViewPro customer account."

  return sendLifecycleEmail({
    html: layout({
      preview,
      html: `
        <h1 style="margin:18px 0 16px;font-size:28px;line-height:1.2;color:#1f211e;">You are in. Welcome as a PhotoViewPro customer.</h1>
        <p>Hi ${firstName},</p>
        <p>Your account is now connected to billing. The next best step is to turn your strongest work into a small, polished portfolio system.</p>
        <p>Finalize your homepage cover, choose a cover image for each portfolio, configure social sharing, and confirm that your storage plan fits your workflow.</p>
        <p style="margin:28px 0;">
          <a href="${input.accountUrl}" style="display:inline-block;background:#1d2b22;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Open your account</a>
        </p>
      `,
    }),
    preview,
    subject: "You are in - welcome as a PhotoViewPro customer",
    text: `Hi ${input.firstName || "there"},\n\nYour account is now connected to billing. Finalize your homepage cover, choose portfolio cover images, configure social sharing, and confirm your storage plan.\n\nOpen your account: ${input.accountUrl}`,
    to,
  })
}

export function sendMagicLoginEmail(to: string, input: MagicLoginInput) {
  const firstName = escapeHtml(input.firstName?.trim() || "there")
  const preview = "Use this secure link to open your PhotoViewPro dashboard."

  return sendLifecycleEmail({
    html: layout({
      preview,
      html: `
        <h1 style="margin:18px 0 16px;font-size:28px;line-height:1.2;color:#1f211e;">Your secure login link</h1>
        <p>Hi ${firstName},</p>
        <p>Use the button below to sign in to your PhotoViewPro subscriber dashboard. This link can only be used once and expires soon.</p>
        <p style="margin:28px 0;">
          <a href="${input.loginUrl}" style="display:inline-block;background:#1d2b22;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Open PhotoViewPro</a>
        </p>
        <p style="font-size:14px;color:#726b60;">If you did not request this link, you can ignore this email.</p>
      `,
    }),
    preview,
    subject: "Your PhotoViewPro login link",
    text: `Hi ${input.firstName || "there"},\n\nUse this secure link to sign in to PhotoViewPro. It can only be used once and expires soon:\n\n${input.loginUrl}\n\nIf you did not request this link, you can ignore this email.`,
    to,
  })
}

export function sendHelpNudgeEmail(to: string, input: HelpNudgeInput) {
  const firstName = escapeHtml(input.firstName?.trim() || "there")
  const isNoUploads = input.kind === "no_uploads"
  const title = isNoUploads ? "Need help uploading your first photos?" : "Need help choosing a portfolio cover?"
  const body = isNoUploads
    ? "It looks like a week has gone by and no photos have been uploaded yet. That usually means setup got interrupted, the import workflow was unclear, or there is a question we can answer."
    : "It looks like you have started building a portfolio, but no cover image has been selected yet. A strong cover is the easiest way to make the whole gallery feel intentional."
  const action = isNoUploads
    ? "Open PhotoViewPro and upload one small set of 10-25 images. If you want help, reply to this email and tell us where you got stuck."
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
          <a href="${input.accountUrl}" style="display:inline-block;background:#1d2b22;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Open PhotoViewPro</a>
        </p>
      `,
    }),
    preview: title,
    subject: isNoUploads ? "Can we help you upload your first photos?" : "Can we help you choose a portfolio cover?",
    text: `Hi ${input.firstName || "there"},\n\n${body}\n\n${action}\n\nOpen PhotoViewPro: ${input.accountUrl}`,
    to,
  })
}

const trialEducationTemplates: Record<TrialEducationKey, { body: string; preview: string; subject: string; title: string }> = {
  trial_day_1_cover: {
    body: "Start with one portfolio, not everything you have ever shot. Choose the cover image first. It is the front door to the gallery and sets the expectation for the whole presentation.",
    preview: "Choose one portfolio and one strong cover.",
    subject: "Day 1: Start with the cover image",
    title: "Start with the cover image",
  },
  trial_day_2_upload: {
    body: "Upload only the strongest 10-25 images first. A tight edit makes PhotoViewPro feel polished fast, and it gives you something worth sharing before you spend time organizing a larger archive.",
    preview: "Upload a tight set before building a full archive.",
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
    body: "Share one specific portfolio today. A focused link gets more attention than a giant archive. Use Sharing to choose the target, copy the link, email it, or generate a QR code.",
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
    body: "If you already have a website, use the embed option. It lets you place a PhotoViewPro portfolio on your existing site without asking visitors to leave your brand.",
    preview: "Embed a portfolio on an existing website.",
    subject: "Day 8: Add a portfolio to your own site",
    title: "Use the embed code",
  },
  trial_day_9_lightroom: {
    body: "If Lightroom is part of your workflow, open Settings > Imports and review the Lightroom setup. The goal is simple: export curated work into PhotoViewPro without rebuilding the gallery by hand.",
    preview: "Connect publishing to the workflow you already use.",
    subject: "Day 9: Publish from Lightroom",
    title: "Connect Lightroom",
  },
  trial_day_10_storage: {
    body: "Open My Account and check storage and monthly bandwidth. PhotoViewPro keeps originals preserved while display images make public browsing faster, especially on mobile.",
    preview: "Know what storage and bandwidth are doing.",
    subject: "Day 10: Check your usage",
    title: "Check storage and bandwidth",
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
    body: "Your PhotoViewPro trial is almost over. If the platform is helping you publish better-looking portfolios faster, keep your account active so your galleries, embeds, and mobile viewing stay available.",
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
    body: "PhotoViewPro keeps originals safe, generates smaller display files for browsing, lets mobile viewers see a fast gallery, and reserves full-resolution downloads for when they are actually needed. Check Account > Usage to see current storage and bandwidth.",
    preview: "Display images can load fast while originals stay preserved.",
    subject: "Keep originals safe, but show lighter files first",
    title: "Storage should support presentation",
  },
  customer_day_10_editing: {
    body: "The strongest portfolios are edited. Inside each portfolio, review the photos and hide anything that does not belong in the public presentation. Use PhotoViewPro like a publishing layer: show the strongest work, keep the rest private, and make the viewing experience intentional.",
    preview: "Hide what does not belong in the public story.",
    subject: "A portfolio is not an archive",
    title: "Edit the public story",
  },
}

export function sendSequenceEmail(to: string, input: SequenceInput) {
  const firstName = escapeHtml(input.firstName?.trim() || "there")
  const template = input.key.startsWith("trial_")
    ? trialEducationTemplates[input.key as TrialEducationKey]
    : customerEducationTemplates[input.key as CustomerEducationKey]

  return sendLifecycleEmail({
    html: layout({
      preview: template.preview,
      html: `
        <h1 style="margin:18px 0 16px;font-size:28px;line-height:1.2;color:#1f211e;">${template.title}</h1>
        <p>Hi ${firstName},</p>
        <p>${template.body}</p>
        <p style="margin:28px 0;">
          <a href="${input.accountUrl}" style="display:inline-block;background:#1d2b22;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Open PhotoViewPro</a>
        </p>
      `,
    }),
    preview: template.preview,
    subject: template.subject,
    text: `Hi ${input.firstName || "there"},\n\n${template.body}\n\nOpen PhotoViewPro: ${input.accountUrl}`,
    to,
  })
}

export function sendPaymentFailedEmail(to: string, input: CustomerLifecycleInput) {
  const firstName = escapeHtml(input.firstName?.trim() || "there")
  const preview = "Keep your galleries live by updating your billing details."

  return sendLifecycleEmail({
    html: layout({
      preview,
      html: `
        <h1 style="margin:18px 0 16px;font-size:28px;line-height:1.2;color:#1f211e;">Please update your payment method</h1>
        <p>Hi ${firstName},</p>
        <p>We could not complete the latest PhotoViewPro payment. Please update your payment method so your portfolios, embeds, and mobile galleries stay available without interruption.</p>
        <p style="margin:28px 0;">
          <a href="${input.accountUrl}" style="display:inline-block;background:#1d2b22;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Manage billing</a>
        </p>
      `,
    }),
    preview,
    subject: "Please update your PhotoViewPro payment method",
    text: `Hi ${input.firstName || "there"},\n\nWe could not complete the latest PhotoViewPro payment. Please update your payment method so your portfolios stay available.\n\nManage billing: ${input.accountUrl}`,
    to,
  })
}

export function sendSubscriptionCanceledEmail(to: string, input: CustomerLifecycleInput) {
  const firstName = escapeHtml(input.firstName?.trim() || "there")
  const preview = "Please tell us why you canceled."
  const surveyUrl = input.surveyUrl ?? `${new URL(input.accountUrl).origin}/cancel-survey?email=${encodeURIComponent(to)}`

  return sendLifecycleEmail({
    html: layout({
      preview,
      html: `
        <h1 style="margin:18px 0 16px;font-size:28px;line-height:1.2;color:#1f211e;">Your subscription has been canceled</h1>
        <p>Hi ${firstName},</p>
        <p>Your PhotoViewPro subscription has been canceled. Your account access and gallery availability will follow the subscription terms shown in your account.</p>
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
    subject: "Your PhotoViewPro subscription has been canceled",
    text: `Hi ${input.firstName || "there"},\n\nYour PhotoViewPro subscription has been canceled. Your account access and gallery availability will follow the subscription terms shown in your account.\n\nPlease tell us why you canceled: ${surveyUrl}\n\nOpen your account: ${input.accountUrl}`,
    to,
  })
}

export function sendUsageWarningEmail(to: string, input: UsageWarningInput) {
  const name = escapeHtml(input.firstName?.trim() || "there")
  const metricLabel = input.metric === "storage" ? "storage" : "bandwidth"
  const exceeded = input.level === 100
  const subjectLevel = exceeded ? "limit has been reached" : `is ${input.level}% used`
  const subject = `Your PhotoViewPro ${metricLabel} ${subjectLevel}`
  const preview = exceeded
    ? "Review your account to keep uploads and gallery viewing running smoothly."
    : "You still have options, but now is the right time to review usage."
  const used = formatBytes(input.usedBytes)
  const limit = formatBytes(input.limitBytes)
  const workspaceName = escapeHtml(input.workspaceName)
  const upgradePlanName = escapeHtml(input.upgradePlanName ?? "the next plan")
  const upgradeCopy = input.metric === "bandwidth" && exceeded
    ? `Public gallery viewing has been paused until the bandwidth period resets or the account is upgraded. The fastest fix is to move to ${upgradePlanName}.`
    : exceeded
      ? "Please review your account now to choose an upgrade, approve an overage, or free up room."
      : "No panic, but this is the right time to review your plan and overage preferences before you hit the limit."

  return sendLifecycleEmail({
    html: layout({
      preview,
      html: `
        <h1 style="margin:18px 0 16px;font-size:26px;line-height:1.2;color:#1f211e;">Your ${metricLabel} ${subjectLevel}</h1>
        <p>Hi ${name},</p>
        <p><strong>${workspaceName}</strong> has used <strong>${used}</strong> of <strong>${limit}</strong> ${metricLabel}.</p>
        <p>${upgradeCopy}</p>
        <p style="margin:28px 0;">
          <a href="${input.accountUrl}" style="display:inline-block;background:#1d2b22;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Review account usage</a>
        </p>
      `,
    }),
    preview,
    subject,
    text: `Hi ${input.firstName || "there"},\n\n${input.workspaceName} has used ${used} of ${limit} ${metricLabel}.\n\n${upgradeCopy}\n\nReview account usage: ${input.accountUrl}`,
    to,
  })
}
