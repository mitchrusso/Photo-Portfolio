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
}

type MagicLoginInput = {
  firstName?: string | null
  loginUrl: string
}

export type TrialEducationKey =
  | "trial_day_1_cover"
  | "trial_day_3_mobile"
  | "trial_day_5_sharing"
  | "trial_day_8_protection"
  | "trial_day_11_publish"
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
        <p>Start with one curated gallery. Pick 10-25 images, choose a cover, and make the viewing experience feel intentional before worrying about every possible business feature.</p>
        <p>Your trial runs through <strong>${trialEnd}</strong>.</p>
        <p style="margin:28px 0;">
          <a href="${dashboardUrl}" style="display:inline-block;background:#1d2b22;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Open your dashboard</a>
        </p>
        <p style="font-size:14px;color:#726b60;">PhotoViewPro is not your entire photo business platform yet. It is the fastest, cleanest way to publish a cinematic portfolio from curated work.</p>
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

const trialEducationTemplates: Record<TrialEducationKey, { body: string; preview: string; subject: string; title: string }> = {
  trial_day_1_cover: {
    body: "The cover image is the front door to a portfolio. Choose the image that should represent the gallery, then check whether the image displays full-frame, the filmstrip feels easy to browse, and the gallery feels clean on mobile. Today’s goal is one gallery you would be comfortable texting to a client, editor, or friend.",
    preview: "Choose the cover first, then tune the viewing experience.",
    subject: "The fastest way to make your first portfolio look polished",
    title: "Start with the cover image",
  },
  trial_day_3_mobile: {
    body: "Most people will see your work on a phone first. Open your portfolio on your phone and ask whether you can swipe naturally, get back to the grid quickly, and browse without the controls competing with the photograph.",
    preview: "Your gallery should feel natural when someone swipes through it.",
    subject: "Mobile is not a smaller desktop",
    title: "Check the phone experience",
  },
  trial_day_5_sharing: {
    body: "A focused link gets more attention than a giant archive. In the Sharing tab, choose whether you are sharing the full portfolio grid or one specific portfolio, then use the configured social buttons, email invite, QR code, or embed code.",
    preview: "A focused link gets more attention than a giant archive.",
    subject: "Sharing one portfolio is better than sharing everything",
    title: "Share one clear story",
  },
  trial_day_8_protection: {
    body: "Some galleries should be public. Some should be unlisted. Some should allow downloads. Some should not. Review privacy, downloads, copy/share options, watermark text or image, cover image, and hidden photos so protection supports the presentation instead of cluttering it.",
    preview: "Watermarks, downloads, privacy, and social sharing should be subscriber choices.",
    subject: "Protect your images without making the gallery ugly",
    title: "Tune protection and sharing",
  },
  trial_day_11_publish: {
    body: "Before your trial ends, aim for 3-5 strong portfolios, a strong cover image for each, a homepage cover style you like, mobile viewing checked, social accounts configured, and at least one portfolio shared publicly. Start with the work that best represents you.",
    preview: "Build a small portfolio system, not a giant unfinished website.",
    subject: "What to publish before your trial ends",
    title: "Build the smallest useful portfolio system",
  },
  trial_day_13_expiring: {
    body: "Your PhotoViewPro trial is almost over. If the platform is helping you publish better-looking portfolios faster, keep your account active so your galleries stay available and your publishing workflow stays intact.",
    preview: "Keep your portfolios live and continue publishing curated work.",
    subject: "Your PhotoViewPro trial ends soon",
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
  const surveyEmail = process.env.SUPPORT_EMAIL ?? "support@photoviewpro.com"
  const surveySubject = encodeURIComponent("Why I canceled PhotoViewPro")
  const surveyBody = encodeURIComponent([
    "Hi PhotoViewPro team,",
    "",
    "I canceled because:",
    "",
    "[ ] The cost is too high",
    "[ ] The service did not work for me",
    "[ ] The site lacks a feature I need for the way I work",
    "[ ] I did not have enough time to set it up",
    "[ ] I only needed it temporarily",
    "[ ] Other:",
    "",
    "Additional notes:",
  ].join("\n"))
  const surveyUrl = `mailto:${surveyEmail}?subject=${surveySubject}&body=${surveyBody}`

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
    text: `Hi ${input.firstName || "there"},\n\nYour PhotoViewPro subscription has been canceled. Your account access and gallery availability will follow the subscription terms shown in your account.\n\nPlease tell us why you canceled by replying with one of these reasons:\n- The cost is too high\n- The service did not work for me\n- The site lacks a feature I need for the way I work\n- I did not have enough time to set it up\n- I only needed it temporarily\n- Other\n\nOpen your account: ${input.accountUrl}`,
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
