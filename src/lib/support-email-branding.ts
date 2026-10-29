export const PHOTOVIEW_SUPPORT_EMAIL = "support@photoview.io"

export function supportEmailAddress() {
  return PHOTOVIEW_SUPPORT_EMAIL
}

export function supportEmailFrom() {
  return `PhotoView.io Support <${PHOTOVIEW_SUPPORT_EMAIL}>`
}

export function escapeSupportEmailHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function supportEmailLayout(content: string, preview?: string) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://photoview.io").replace(/\/+$/, "")
  const safePreview = preview ? escapeSupportEmailHtml(preview) : "PhotoView.io Support"
  const supportAddress = escapeSupportEmailHtml(supportEmailAddress())

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>PhotoView.io Support</title>
  </head>
  <body style="margin:0;background:#f4f1eb;color:#253028;font-family:Arial,Helvetica,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden">${safePreview}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1eb;padding:32px 16px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #ded7ca;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(31,45,36,.08)">
            <tr>
              <td style="padding:24px 30px;background:#1d2b22;border-bottom:4px solid #d8a84f">
                <div style="font-size:20px;line-height:1.2;color:#ffffff;font-weight:700;letter-spacing:.02em">PhotoView<span style="color:#d8a84f">.io</span></div>
                <div style="margin-top:6px;font-size:12px;line-height:1.3;color:#d8e1db;letter-spacing:.12em;text-transform:uppercase">Customer Support</div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;font-size:16px;line-height:1.65;color:#343a35">${content}</td>
            </tr>
            <tr>
              <td style="padding:18px 30px;background:#faf8f4;border-top:1px solid #e8e1d6;font-size:12px;line-height:1.6;color:#6d706b">
                <strong style="color:#1d2b22">PhotoView.io Support</strong><br>
                Reply to this email or contact <a href="mailto:${supportAddress}" style="color:#8e651d;text-decoration:underline">${supportAddress}</a>.<br>
                <a href="${appUrl}" style="color:#8e651d;text-decoration:underline">Visit PhotoView.io</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
