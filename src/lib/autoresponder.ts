type AutoresponderPayload = {
  addTags?: string[]
  email?: string
  event: string
  firstName?: string
  lastName?: string
  list?: string
  metadata?: Record<string, unknown>
  removeLists?: string[]
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
  abandonedCheckout: "PhotoView.io Abandoned Checkout Prospects",
  customers: "PhotoView.io Customers",
  trial: "PhotoView.io Trial",
} as const

export const autoresponderTags = {
  abandonedCheckout: "photoviewpro:abandoned-checkout",
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
          lastPurchaseOrder: typeof payload.metadata?.resumeUrl === "string" ? payload.metadata.resumeUrl : undefined,
          phone: typeof payload.metadata?.phone === "string" ? payload.metadata.phone : undefined,
          source: payload.source ?? "PhotoView.io",
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
  const requestedLists = normalizeTags([payload.list, ...(payload.removeLists ?? [])])
  if (requestedLists.length === 0) return "sent"

  const audiencesResponse = await fetch(`${config.baseUrl}/audiences`, {
    headers: {
      "Accept": "application/json",
      "X-API-KEY": config.apiKey,
    },
  })
  if (!audiencesResponse.ok) return "failed"

  const audiences = await audiencesResponse.json() as TinyEmailAudienceResponse
  const audienceByName = new Map((audiences.contacts ?? []).flatMap((audience) => (
    audience.id && audience.name ? [[audience.name, audience.id] as const] : []
  )))

  for (const listName of requestedLists) {
    const shouldAssign = payload.list === listName
    let audienceId = audienceByName.get(listName)
    let createdWithMember = false
    if (!audienceId && shouldAssign) {
      const createResponse = await fetch(`${config.baseUrl}/audiences`, {
        body: JSON.stringify({
          members: [{
            company: typeof payload.metadata?.studioName === "string" ? payload.metadata.studioName : undefined,
            email,
            firstName: payload.firstName,
            lastName: payload.lastName,
            lastPurchaseOrder: typeof payload.metadata?.resumeUrl === "string" ? payload.metadata.resumeUrl : undefined,
            phone: typeof payload.metadata?.phone === "string" ? payload.metadata.phone : undefined,
            source: payload.source ?? "PhotoView.io",
            status: "Subscribed",
            tags,
          }],
          name: listName,
        }),
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": config.apiKey,
        },
        method: "POST",
      })
      if (!createResponse.ok) return "failed"
      const created = await createResponse.json() as TinyEmailAudience
      audienceId = created.id
      if (audienceId) {
        audienceByName.set(listName, audienceId)
        createdWithMember = true
      }
    }
    if (!audienceId) {
      if (!shouldAssign) continue
      return "failed"
    }

    if (createdWithMember) continue

    const assignmentResponse = await fetch(`${config.baseUrl}/audiences/${audienceId}`, {
      body: JSON.stringify({
        assignMembers: shouldAssign
          ? [{
              email,
              firstName: payload.firstName,
              lastName: payload.lastName,
              source: payload.source ?? "PhotoView.io",
              tags,
            }]
          : [],
        unAssignMembers: shouldAssign ? [] : [{ email }],
      }),
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": config.apiKey,
      },
      method: "PUT",
    })

    if (!assignmentResponse.ok) return "failed"
  }

  return "sent"
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
        source: "PhotoView.io",
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
