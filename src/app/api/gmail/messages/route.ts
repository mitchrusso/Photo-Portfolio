import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedCrmSession } from "@/lib/partnership-crm/access"
import { getGoogleAccess } from "@/lib/partnership-crm/google"

function header(headers: Array<{ name: string; value: string }> | undefined, name: string) { return headers?.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value ?? "" }

export async function GET(request: NextRequest) {
  const session = await getAuthorizedCrmSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const google = await getGoogleAccess(session.user.id)
  if (!google) return NextResponse.json({ error: "Gmail is not connected." }, { status: 401 })
  const q = (request.nextUrl.searchParams.get("q") || "newer_than:90d").slice(0, 500)
  try {
    const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages")
    listUrl.searchParams.set("maxResults", "25"); listUrl.searchParams.set("q", q)
    const listResponse = await fetch(listUrl, { headers: { Authorization: `Bearer ${google.accessToken}` }, cache: "no-store" })
    if (!listResponse.ok) throw new Error("Gmail search failed.")
    const list = await listResponse.json() as { messages?: Array<{ id: string; threadId: string }> }
    const messages = await Promise.all((list.messages || []).map(async ({ id, threadId }) => {
      const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}`)
      url.searchParams.set("format", "metadata"); ["From", "To", "Subject", "Date"].forEach((name) => url.searchParams.append("metadataHeaders", name))
      const response = await fetch(url, { headers: { Authorization: `Bearer ${google.accessToken}` }, cache: "no-store" })
      if (!response.ok) return null
      const data = await response.json() as { payload?: { headers?: Array<{ name: string; value: string }> }; snippet?: string }
      return { date: header(data.payload?.headers, "Date"), from: header(data.payload?.headers, "From"), id, snippet: data.snippet || "", subject: header(data.payload?.headers, "Subject"), threadId, to: header(data.payload?.headers, "To") }
    }))
    return NextResponse.json({ email: google.email, messages: messages.filter(Boolean) })
  } catch { return NextResponse.json({ error: "Unable to load Gmail messages right now." }, { status: 502 }) }
}
