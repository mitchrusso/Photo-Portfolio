type TwilioVerifyResponse = {
  code?: number
  message?: string
  sid?: string
  status?: string
}

export type AdminSmsMfaConfig = {
  enabled: boolean
  maskedPhone: string | null
  phone: string | null
  ready: boolean
  issues: string[]
}

function configured(name: string) {
  return process.env[name]?.trim() ?? ""
}

function maskPhone(phone: string) {
  const visible = phone.slice(-4)
  return `••• ••• ${visible}`
}

export function getAdminSmsMfaConfig(): AdminSmsMfaConfig {
  const enabled = configured("ADMIN_SMS_MFA_ENABLED").toLowerCase() === "true"
  const phone = configured("SUPERADMIN_MFA_PHONE_E164")
  const serviceSid = configured("TWILIO_VERIFY_SERVICE_SID")
  const apiKeySid = configured("TWILIO_API_KEY_SID")
  const apiKeySecret = configured("TWILIO_API_KEY_SECRET")
  const accountSid = configured("TWILIO_ACCOUNT_SID")
  const authToken = configured("TWILIO_AUTH_TOKEN")
  const issues: string[] = []

  if (!/^\+[1-9]\d{7,14}$/.test(phone)) issues.push("a SuperAdmin phone in E.164 format")
  if (!/^VA[0-9a-fA-F]{32}$/.test(serviceSid)) issues.push("a Twilio Verify Service SID")
  if (!(apiKeySid && apiKeySecret) && !(accountSid && authToken)) issues.push("Twilio API credentials")

  return {
    enabled,
    issues,
    maskedPhone: phone ? maskPhone(phone) : null,
    phone: /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null,
    ready: issues.length === 0,
  }
}

function twilioCredentials() {
  const apiKeySid = configured("TWILIO_API_KEY_SID")
  const apiKeySecret = configured("TWILIO_API_KEY_SECRET")
  if (apiKeySid && apiKeySecret) return { password: apiKeySecret, username: apiKeySid }

  const accountSid = configured("TWILIO_ACCOUNT_SID")
  const authToken = configured("TWILIO_AUTH_TOKEN")
  if (accountSid && authToken) return { password: authToken, username: accountSid }
  return null
}

async function twilioVerifyRequest(path: string, params: Record<string, string>) {
  const config = getAdminSmsMfaConfig()
  const credentials = twilioCredentials()
  const serviceSid = configured("TWILIO_VERIFY_SERVICE_SID")
  if (!config.ready || !credentials || !config.phone) throw new Error("SuperAdmin SMS verification is not configured.")

  const response = await fetch(`https://verify.twilio.com/v2/Services/${encodeURIComponent(serviceSid)}/${path}`, {
    body: new URLSearchParams(params),
    cache: "no-store",
    headers: {
      Authorization: `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  })
  const body = await response.json().catch(() => ({})) as TwilioVerifyResponse

  if (!response.ok) {
    const error = new Error(body.message || `Twilio Verify returned HTTP ${response.status}`)
    ;(error as Error & { status?: number }).status = response.status
    throw error
  }

  return body
}

export async function sendSuperAdminSmsCode() {
  const config = getAdminSmsMfaConfig()
  if (!config.phone) throw new Error("SuperAdmin SMS phone is not configured.")
  const result = await twilioVerifyRequest("Verifications", { Channel: "sms", To: config.phone })
  if (result.status !== "pending") throw new Error("Twilio did not accept the verification request.")
  return result.sid ?? null
}

export async function checkSuperAdminSmsCode(code: string) {
  const config = getAdminSmsMfaConfig()
  if (!config.phone) throw new Error("SuperAdmin SMS phone is not configured.")
  const result = await twilioVerifyRequest("VerificationCheck", { Code: code, To: config.phone })
  return result.status === "approved"
}
