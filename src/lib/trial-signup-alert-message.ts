type TrialSignupAlertDetails = {
  billingCycle: string
  email: string
  firstName: string
  lastName: string
  planName: string
  signupAt: Date
  trialEndsAt: Date
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function formatEasternDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "America/New_York",
  }).format(value)
}

function formatBillingCycle(value: string) {
  return value.toLowerCase() === "monthly" ? "Monthly" : "Annual"
}

export function buildTrialSignupAlert(details: TrialSignupAlertDetails) {
  const name = `${details.firstName.trim()} ${details.lastName.trim()}`.trim()
  const signupAt = formatEasternDateTime(details.signupAt)
  const trialEndsAt = formatEasternDateTime(details.trialEndsAt)
  const billingCycle = formatBillingCycle(details.billingCycle)
  const subject = `[PhotoView.io] New ${details.planName} trial — ${name}`
  const text = [
    "A new PhotoView.io trial is active.",
    "",
    `Subscriber: ${name}`,
    `Email: ${details.email}`,
    `Plan: ${details.planName}`,
    `Billing cycle: ${billingCycle}`,
    `Signed up: ${signupAt}`,
    `Trial ends: ${trialEndsAt}`,
  ].join("\n")

  return {
    html: `<!doctype html>
<html>
  <body style="margin:0;background:#f7f4ef;color:#1f211e;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border:1px solid #dfd6c8;border-radius:12px;">
          <tr><td style="padding:28px 30px;">
            <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#b98225;font-weight:700;">PhotoView.io beta</div>
            <h1 style="margin:14px 0 20px;font-size:28px;line-height:1.2;">A new trial is active</h1>
            <table role="presentation" width="100%" cellpadding="8" cellspacing="0" style="font-size:16px;line-height:1.5;border-collapse:collapse;">
              <tr><td style="color:#726b60;width:140px;">Subscriber</td><td><strong>${escapeHtml(name)}</strong></td></tr>
              <tr><td style="color:#726b60;">Email</td><td><a href="mailto:${escapeHtml(details.email)}" style="color:#1d2b22;">${escapeHtml(details.email)}</a></td></tr>
              <tr><td style="color:#726b60;">Trial level</td><td>${escapeHtml(details.planName)}</td></tr>
              <tr><td style="color:#726b60;">Billing cycle</td><td>${billingCycle}</td></tr>
              <tr><td style="color:#726b60;">Signed up</td><td>${escapeHtml(signupAt)} (Eastern Time)</td></tr>
              <tr><td style="color:#726b60;">Trial ends</td><td>${escapeHtml(trialEndsAt)} (Eastern Time)</td></tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
    subject,
    text,
  }
}
