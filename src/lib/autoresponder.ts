type AutoresponderPayload = {
  addTags?: string[]
  email?: string
  event: string
  firstName?: string
  lastName?: string
  list?: string
  metadata?: Record<string, unknown>
  removeTags?: string[]
  source?: string
}

export const autoresponderTags = {
  customer: "photoviewpro:customer",
  trial: "photoviewpro:trial",
  trialRegistered: "photoviewpro:trial-registered",
  trialConverted: "photoviewpro:trial-converted",
} as const

export async function notifyAutoresponder(payload: AutoresponderPayload) {
  if (!process.env.AUTORESPONDER_WEBHOOK_URL) {
    return "not_configured"
  }

  try {
    const response = await fetch(process.env.AUTORESPONDER_WEBHOOK_URL, {
      body: JSON.stringify({
        source: "PhotoViewPro",
        ...payload,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    return response.ok ? "sent" : "failed"
  } catch {
    return "failed"
  }
}
