import { addBusinessDays } from "@/lib/partnership-crm/email-sequences"
import { getPrismaClient } from "@/lib/db"
import { crmGmailAddress, getGoogleAccess } from "@/lib/partnership-crm/google"
import { emailDomain, extractMailboxes, isPartnershipMessage, normalizedHost, prospectIdentity, slugifyProspect, syncQuery, type ParsedMailbox } from "@/lib/partnership-crm/gmail-sync-rules"

type GmailHeader = { name: string; value: string }
type GmailApiMessage = { historyId?: string; id: string; internalDate?: string; labelIds?: string[]; payload?: { headers?: GmailHeader[] }; snippet?: string; threadId: string }
type SyncedMessage = { date: Date; direction: "RECEIVED" | "SENT"; from: ParsedMailbox; id: string; labels: string[]; snippet: string; subject: string; threadId: string; to: ParsedMailbox[] }
type PartnerRow = { company: string; contacts: Array<{ email: string | null; id: string; isPrimary: boolean; name: string }>; id: string; slug: string; stage: string; website: string }
export type GmailSyncSummary = { createdPartners: number; imported: number; matched: number; replies: number; scanned: number; sent: number; skipped: number }

const metadataHeaders = ["From", "To", "Cc", "Subject", "Date"]

function header(headers: GmailHeader[] | undefined, name: string) {
  return headers?.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value || ""
}

function parseMessage(message: GmailApiMessage, mailbox: string): SyncedMessage | null {
  const headers = message.payload?.headers
  const from = extractMailboxes(header(headers, "From"))[0]
  if (!from) return null
  const to = extractMailboxes(`${header(headers, "To")},${header(headers, "Cc")}`)
  const milliseconds = Number(message.internalDate)
  const fallback = Date.parse(header(headers, "Date"))
  const date = new Date(Number.isFinite(milliseconds) && milliseconds > 0 ? milliseconds : fallback)
  if (Number.isNaN(date.getTime())) return null
  return {
    date,
    direction: from.email === mailbox ? "SENT" : "RECEIVED",
    from,
    id: message.id,
    labels: message.labelIds || [],
    snippet: (message.snippet || "").slice(0, 1_000),
    subject: header(headers, "Subject").slice(0, 500),
    threadId: message.threadId,
    to,
  }
}

async function gmailJson<T>(url: URL | string, accessToken: string) {
  const response = await fetch(url, { cache: "no-store", headers: { Authorization: `Bearer ${accessToken}` } })
  if (!response.ok) throw new Error(`Gmail synchronization failed (${response.status}). Reconnect Gmail and try again.`)
  return response.json() as Promise<T>
}

async function listMessageIds(accessToken: string, query: string, maximum = 500) {
  const ids: Array<{ id: string; threadId: string }> = []
  let pageToken = ""
  do {
    const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages")
    url.searchParams.set("maxResults", String(Math.min(100, maximum - ids.length)))
    url.searchParams.set("q", query)
    if (pageToken) url.searchParams.set("pageToken", pageToken)
    const page = await gmailJson<{ messages?: Array<{ id: string; threadId: string }>; nextPageToken?: string }>(url, accessToken)
    ids.push(...(page.messages || []))
    pageToken = page.nextPageToken || ""
  } while (pageToken && ids.length < maximum)
  return ids.slice(0, maximum)
}

async function getMessage(accessToken: string, id: string) {
  const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}`)
  url.searchParams.set("format", "metadata")
  metadataHeaders.forEach((name) => url.searchParams.append("metadataHeaders", name))
  return gmailJson<GmailApiMessage>(url, accessToken)
}

async function getThread(accessToken: string, threadId: string) {
  const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${encodeURIComponent(threadId)}`)
  url.searchParams.set("format", "metadata")
  metadataHeaders.forEach((name) => url.searchParams.append("metadataHeaders", name))
  return (await gmailJson<{ messages?: GmailApiMessage[] }>(url, accessToken)).messages || []
}

function externalMailbox(message: SyncedMessage, mailbox: string) {
  return message.direction === "SENT" ? message.to.find((item) => item.email !== mailbox) || null : message.from.email !== mailbox ? message.from : null
}

function matchPartner(message: SyncedMessage, mailbox: ParsedMailbox | null, partners: PartnerRow[], threadPartners: Map<string, string>) {
  const threadPartnerId = threadPartners.get(message.threadId)
  if (threadPartnerId) return partners.find((partner) => partner.id === threadPartnerId) || null
  if (!mailbox) return null
  const exact = partners.find((partner) => partner.contacts.some((contact) => contact.email?.toLowerCase() === mailbox.email))
  if (exact) return exact
  const domain = emailDomain(mailbox.email)
  if (domain && !["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"].includes(domain)) {
    const domainMatch = partners.find((partner) => normalizedHost(partner.website) === domain || partner.contacts.some((contact) => contact.email && emailDomain(contact.email) === domain))
    if (domainMatch) return domainMatch
  }
  const identity = prospectIdentity(mailbox, message.subject)
  const company = identity.company.toLowerCase()
  return partners.find((partner) => partner.company.toLowerCase() === company || message.subject.toLowerCase().includes(partner.company.toLowerCase())) || null
}

function isUniqueConstraintError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002")
}

async function uniqueProspectSlug(company: string) {
  const prisma = getPrismaClient()
  const base = slugifyProspect(company)
  let slug = base
  let suffix = 2
  while (await prisma.crmPartner.findUnique({ select: { id: true }, where: { slug } })) slug = `${base}-${suffix++}`
  return slug
}

async function createProspect(message: SyncedMessage, mailbox: ParsedMailbox) {
  const prisma = getPrismaClient()
  const identity = prospectIdentity(mailbox, message.subject)
  const company = identity.company
  return prisma.crmPartner.create({
    data: {
      category: identity.category,
      company,
      contacts: { create: { email: mailbox.email, isPrimary: true, name: mailbox.name || company, role: "Partnership contact" } },
      integration: [],
      nextStep: "Review the conversation and schedule the next follow-up",
      opportunity: `Explore a PhotoView.io partnership with ${company}.`,
      painPoints: [],
      score: 70,
      slug: await uniqueProspectSlug(company),
      stage: "Contacted",
      summary: `${company} was added automatically from verified PhotoView partnership outreach in Gmail.`,
      valueCents: 0,
      website: identity.website || "",
    },
    include: { contacts: true },
  })
}

async function ensureContact(partner: PartnerRow, mailbox: ParsedMailbox) {
  const prisma = getPrismaClient()
  const existing = partner.contacts.find((contact) => contact.email?.toLowerCase() === mailbox.email)
  if (existing) return existing
  const unassignedPrimary = partner.contacts.find((contact) => contact.isPrimary && !contact.email)
  if (unassignedPrimary) {
    const updated = await prisma.crmContact.update({ data: { email: mailbox.email, name: mailbox.name || unassignedPrimary.name }, where: { id: unassignedPrimary.id } })
    unassignedPrimary.email = updated.email
    unassignedPrimary.name = updated.name
    return updated
  }
  const created = await prisma.crmContact.create({ data: { email: mailbox.email, isPrimary: partner.contacts.length === 0, name: mailbox.name || mailbox.email.split("@")[0], partnerId: partner.id, role: "Partnership contact" } })
  partner.contacts.push(created)
  return created
}

async function importMessage(userId: string, message: SyncedMessage, partner: PartnerRow, contact: { id: string; email: string | null }, summary: GmailSyncSummary) {
  const prisma = getPrismaClient()
  const sequenceStep = await prisma.crmEmailStep.findFirst({ select: { id: true }, where: { gmailMessageId: message.id } })
  await prisma.$transaction([
    prisma.crmGmailMessage.create({ data: { contactId: contact.id, direction: message.direction, fromEmail: message.from.email, gmailDate: message.date, gmailMessageId: message.id, labels: message.labels, partnerId: partner.id, snippet: message.snippet, subject: message.subject || "(No subject)", threadId: message.threadId, toEmails: message.to.map((item) => item.email), userId } }),
    ...(sequenceStep ? [] : [prisma.crmActivity.create({ data: {
      detail: message.direction === "SENT" ? `Sent “${message.subject || "(No subject)"}” to ${contact.email || "the partnership contact"} from ${crmGmailAddress()}.` : `Received “${message.subject || "(No subject)"}” from ${message.from.email}.`,
      occurredAt: message.date,
      partnerId: partner.id,
      title: message.direction === "SENT" ? "Gmail outreach synchronized" : "Gmail reply synchronized",
      type: "email",
    } })]),
  ])
  if (message.direction === "SENT") {
    summary.sent++
    if (partner.stage === "Research") {
      await prisma.crmPartner.update({ data: { stage: "Contacted" }, where: { id: partner.id } })
      partner.stage = "Contacted"
    }
    const draft = await prisma.crmOutreach.findFirst({ where: { partnerId: partner.id, status: "DRAFT", subject: message.subject } })
    if (draft) await prisma.crmOutreach.update({ data: { gmailMessageId: message.id, sentAt: message.date, status: "SENT" }, where: { id: draft.id } })
    const taskTitle = `Follow up with ${partner.company}`
    const taskExists = await prisma.crmTask.findFirst({ where: { completedAt: null, partnerId: partner.id, title: taskTitle } })
    if (!taskExists) {
      const proposed = addBusinessDays(message.date, 3)
      const dueAt = proposed.getTime() > Date.now() ? proposed : new Date(Date.now() + 60 * 60 * 1000)
      await prisma.crmTask.create({ data: { createdById: userId, dueAt, partnerId: partner.id, priority: "HIGH", title: taskTitle } })
    }
  } else {
    summary.replies++
    if (partner.stage !== "Proposal") {
      await prisma.crmPartner.update({ data: { stage: "Conversation" }, where: { id: partner.id } })
      partner.stage = "Conversation"
    }
    await prisma.crmTask.updateMany({ data: { completedAt: message.date }, where: { completedAt: null, partnerId: partner.id, title: { startsWith: "Follow up with" } } })
    const sequences = await prisma.crmEmailSequence.findMany({ select: { id: true }, where: { partnerId: partner.id, status: { in: ["ACTIVE", "PAUSED"] } } })
    if (sequences.length) {
      const ids = sequences.map((sequence) => sequence.id)
      await prisma.$transaction([
        prisma.crmEmailSequence.updateMany({ data: { completedAt: message.date, status: "COMPLETED" }, where: { id: { in: ids } } }),
        prisma.crmEmailStep.updateMany({ data: { status: "SKIPPED" }, where: { sequenceId: { in: ids }, status: { in: ["DRAFT", "SCHEDULED", "SENDING"] } } }),
      ])
    }
  }
}

export async function syncCrmGmail(userId: string, options: { full?: boolean } = {}): Promise<GmailSyncSummary> {
  const prisma = getPrismaClient()
  const connection = await prisma.crmGoogleConnection.findUnique({ where: { userId } })
  const google = await getGoogleAccess(userId)
  if (!connection || !google) throw new Error("Gmail is not connected. Reconnect the PhotoView CRM mailbox and try again.")
  const summary: GmailSyncSummary = { createdPartners: 0, imported: 0, matched: 0, replies: 0, scanned: 0, sent: 0, skipped: 0 }
  const initialFullSync = Boolean(options.full || !connection.lastSyncAt)
  try {
    if (initialFullSync) await prisma.crmActivity.deleteMany({ where: { occurredAt: null, type: "email" } })
    const mailbox = google.email.trim().toLowerCase()
    const query = syncQuery(connection.lastSyncAt, initialFullSync)
    const listed = await listMessageIds(google.accessToken, query)
    const candidates = new Map<string, SyncedMessage>()
    for (const item of listed) {
      const parsed = parseMessage(await getMessage(google.accessToken, item.id), mailbox)
      if (parsed) candidates.set(parsed.id, parsed)
    }
    if (initialFullSync) {
      const relevantThreads = new Set([...candidates.values()].filter((message) => message.direction === "SENT" && isPartnershipMessage(message.subject, message.snippet)).map((message) => message.threadId))
      for (const threadId of relevantThreads) {
        for (const raw of await getThread(google.accessToken, threadId)) {
          const parsed = parseMessage(raw, mailbox)
          if (parsed) candidates.set(parsed.id, parsed)
        }
      }
    }
    summary.scanned = candidates.size
    const knownIds = new Set((await prisma.crmGmailMessage.findMany({ select: { gmailMessageId: true }, where: { gmailMessageId: { in: [...candidates.keys()] } } })).map((row) => row.gmailMessageId))
    const knownThreadRows = await prisma.crmGmailMessage.findMany({ distinct: ["threadId"], select: { partnerId: true, threadId: true }, where: { partnerId: { not: null }, threadId: { in: [...new Set([...candidates.values()].map((message) => message.threadId))] } } })
    const threadPartners = new Map(knownThreadRows.flatMap((row) => row.partnerId ? [[row.threadId, row.partnerId] as const] : []))
    const partners = await prisma.crmPartner.findMany({ include: { contacts: true } }) as PartnerRow[]
    for (const message of [...candidates.values()].sort((a, b) => a.date.getTime() - b.date.getTime())) {
      if (knownIds.has(message.id)) { summary.skipped++; continue }
      const external = externalMailbox(message, mailbox)
      let partner = matchPartner(message, external, partners, threadPartners)
      const relevant = Boolean(partner || threadPartners.has(message.threadId) || (message.direction === "SENT" && isPartnershipMessage(message.subject, message.snippet)))
      if (!relevant || !external) { summary.skipped++; continue }
      if (!partner && message.direction === "SENT") {
        partner = await createProspect(message, external) as PartnerRow
        partners.push(partner)
        summary.createdPartners++
      }
      if (!partner) { summary.skipped++; continue }
      const contact = await ensureContact(partner, external)
      try {
        await importMessage(userId, message, partner, contact, summary)
      } catch (error) {
        if (isUniqueConstraintError(error)) { summary.skipped++; continue }
        throw error
      }
      knownIds.add(message.id)
      threadPartners.set(message.threadId, partner.id)
      summary.imported++
      summary.matched++
    }
    await prisma.crmGoogleConnection.update({ data: { lastSyncAt: new Date(), lastSyncError: null, lastSyncMessageCount: summary.imported }, where: { userId } })
    return summary
  } catch (error) {
    await prisma.crmGoogleConnection.update({ data: { lastSyncError: error instanceof Error ? error.message.slice(0, 1_000) : "Gmail synchronization failed." }, where: { userId } }).catch(() => undefined)
    throw error
  }
}

export async function syncAllConnectedCrmMailboxes() {
  const prisma = getPrismaClient()
  const connections = await prisma.crmGoogleConnection.findMany({ select: { userId: true }, where: { email: crmGmailAddress() } })
  const results = []
  for (const connection of connections) results.push({ userId: connection.userId, summary: await syncCrmGmail(connection.userId) })
  return results
}
