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
  usedBytes: number
  workspaceName: string
}

type MagicLoginInput = {
  firstName?: string | null
  loginUrl: string
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

  return sendLifecycleEmail({
    html: layout({
      preview,
      html: `
        <h1 style="margin:18px 0 16px;font-size:26px;line-height:1.2;color:#1f211e;">Your ${metricLabel} ${subjectLevel}</h1>
        <p>Hi ${name},</p>
        <p><strong>${workspaceName}</strong> has used <strong>${used}</strong> of <strong>${limit}</strong> ${metricLabel}.</p>
        <p>${exceeded ? "Please review your account now to choose an upgrade, approve an overage, or free up room." : "No panic, but this is the right time to review your plan and overage preferences before you hit the limit."}</p>
        <p style="margin:28px 0;">
          <a href="${input.accountUrl}" style="display:inline-block;background:#1d2b22;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700;">Review account usage</a>
        </p>
      `,
    }),
    preview,
    subject,
    text: `Hi ${input.firstName || "there"},\n\n${input.workspaceName} has used ${used} of ${limit} ${metricLabel}.\n\nReview account usage: ${input.accountUrl}`,
    to,
  })
}
