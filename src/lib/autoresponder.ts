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

type TinyEmailCustomer = {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  status?: string
  tags?: string[]
}

type TinyEmailAudience = {
  id?: string
  name?: string
}

type TinyEmailAudienceResponse = {
  contacts?: TinyEmailAudience[]
}

export const autoresponderAudiences = {
  customers: "PhotoView.io Customers",
  trial: "PhotoView.io Trial",
} as const

export const autoresponderTags = {
  billingConnected: "photoviewpro:billing-connected",
  checkoutPending: "photoviewpro:checkout-pending",
  canceled: "photoviewpro:canceled",
  customer: "photoviewpro:customer",
  paymentFailed: "photoviewpro:payment-failed",
  storage75: "photoviewpro:storage-75",
  storage90: "photoviewpro:storage-90",
  storageExceeded: "photoviewpro:storage-exceeded",
  trial: "photoviewpro:trial",
  trialRegistered: "photoviewpro:trial-registered",
  trialConverted: "photoviewpro:trial-converted",
} as const

function getTinyEmailConfig() {
  const apiKey = process.env.TINYEMAIL_API_KEY
  if (!apiKey) return null

  return {
    apiKey,
    baseUrl: (process.env.TINYEMAIL_API_BASE_URL ?? "https://api.tinyemail.com/v1").replace(/\/+$/, ""),
  }
}

function normalizeTags(tags: Array<string | undefined>) {
  return Array.from(new Set(tags.filter((tag): tag is string => Boolean(tag?.trim()))))
}

async function getTinyEmailCustomer(email: string, config: NonNullable<ReturnType<typeof getTinyEmailConfig>>) {
  const response = await fetch(`${config.baseUrl}/account/customer/${encodeURIComponent(email)}`, {
    headers: {
      "Accept": "application/json",
      "X-API-KEY": config.apiKey,
    },
  })

  if (!response.ok) return null

  const customer = await response.json() as TinyEmailCustomer
  return customer.email ? customer : null
}

async function notifyTinyEmail(payload: AutoresponderPayload) {
  const config = getTinyEmailConfig()
  const email = payload.email?.trim().toLowerCase()
  if (!config || !email) return "not_configured"

  const existingCustomer = await getTinyEmailCustomer(email, config)
  const existingTags = Array.isArray(existingCustomer?.tags) ? existingCustomer.tags : []
  const removeTags = new Set(payload.removeTags ?? [])
  const tags = normalizeTags([
    ...existingTags.filter((tag) => !removeTags.has(tag)),
    ...(payload.addTags ?? []),
  ])

  const response = await fetch(`${config.baseUrl}/account/customer`, {
    body: JSON.stringify({
      updateMembers: [
        {
          company: typeof payload.metadata?.studioName === "string" ? payload.metadata.studioName : undefined,
          email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          phone: typeof payload.metadata?.phone === "string" ? payload.metadata.phone : undefined,
          source: payload.source ?? "PhotoViewPro",
          status: "Subscribed",
          tags,
        },
      ],
    }),
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": config.apiKey,
    },
    method: "PUT",
  })

  if (!response.ok) return "failed"
  if (!payload.list) return "sent"

  const audiencesResponse = await fetch(`${config.baseUrl}/audiences`, {
    headers: {
      "Accept": "application/json",
      "X-API-KEY": config.apiKey,
    },
  })
  if (!audiencesResponse.ok) return "failed"

  const audiences = await audiencesResponse.json() as TinyEmailAudienceResponse
  const audience = audiences.contacts?.find((candidate) => candidate.name === payload.list)
  if (!audience?.id) return "failed"

  const assignmentResponse = await fetch(`${config.baseUrl}/audiences/${audience.id}`, {
    body: JSON.stringify({
      assignMembers: [
        {
          email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          source: payload.source ?? "PhotoView.io",
          tags,
        },
      ],
      unAssignMembers: [],
    }),
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": config.apiKey,
    },
    method: "PUT",
  })

  return assignmentResponse.ok ? "sent" : "failed"
}

export async function notifyAutoresponder(payload: AutoresponderPayload) {
  if (process.env.TINYEMAIL_API_KEY) {
    try {
      return await notifyTinyEmail(payload)
    } catch {
      return "failed"
    }
  }

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
