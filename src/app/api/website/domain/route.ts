import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { getCustomDomainLookupCandidates, normalizeCustomDomain } from "@/lib/custom-domain"
import { getPrismaClient } from "@/lib/db"
import { ensureWorkspaceForSession } from "@/lib/dev-workspace"
import { getDnsSetupGuidance } from "@/lib/domain-connect"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"
import {
  addCustomDomainToVercel,
  getCustomDomainProviderStatus,
  isVercelDomainAutomationConfigured,
  removeCustomDomainFromVercel,
  VercelDomainError,
  verifyCustomDomainWithVercel,
} from "@/lib/vercel-domains"

const customDomainSchema = z.object({
  domain: z.string().trim().min(1).max(253),
})

function providerErrorResponse(error: unknown) {
  if (error instanceof VercelDomainError) {
    const message = error.code === "provider_not_configured"
      ? error.message
      : error.status === 409
        ? "That domain is already connected to another website. Remove it there first, then try again."
        : error.status === 403
          ? "Vercel could not verify ownership of this domain. Add the requested TXT record, then check again."
          : error.message
    return NextResponse.json({ error: message }, { status: error.status })
  }
  return NextResponse.json({ error: "The domain provider could not complete this request." }, { status: 502 })
}

async function getWorkspace() {
  const session = await auth()
  if (!session?.user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const workspace = await ensureWorkspaceForSession(session.user.workspaceId)
  if (!workspace) return { response: NextResponse.json({ error: "Workspace not found" }, { status: 404 }) }

  return { session, workspace }
}

async function readStoredDomain(workspaceId: string) {
  return getPrismaClient().workspace.findUnique({
    select: {
      customDomain: true,
      customDomainLastCheckedAt: true,
      customDomainVerifiedAt: true,
    },
    where: { id: workspaceId },
  })
}

async function saveProviderStatus(
  workspaceId: string,
  status: { active: boolean },
) {
  const checkedAt = new Date()
  await getPrismaClient().workspace.update({
    data: {
      customDomainLastCheckedAt: checkedAt,
      customDomainVerifiedAt: status.active ? checkedAt : null,
    },
    where: { id: workspaceId },
  })
  return checkedAt
}

async function withDnsGuidance<T extends { apexName: string }>(status: T, domain: string) {
  const dnsSetup = await getDnsSetupGuidance(status.apexName, domain)
  return { ...status, dnsSetup }
}

export async function GET() {
  const access = await getWorkspace()
  if ("response" in access) return access.response

  const stored = await readStoredDomain(access.workspace.id)
  if (!stored?.customDomain) {
    return NextResponse.json({
      active: false,
      configured: false,
      domain: null,
      dnsRecords: [],
      setupAvailable: isVercelDomainAutomationConfigured(),
      verified: false,
    })
  }

  try {
    const status = await getCustomDomainProviderStatus(stored.customDomain)
    const checkedAt = await saveProviderStatus(access.workspace.id, status)
    return NextResponse.json({
      ...await withDnsGuidance(status, stored.customDomain),
      checkedAt: checkedAt.toISOString(),
      domain: stored.customDomain,
      setupAvailable: true,
    })
  } catch (error) {
    return NextResponse.json({
      active: Boolean(stored.customDomainVerifiedAt),
      checkedAt: stored.customDomainLastCheckedAt?.toISOString() ?? null,
      configured: false,
      domain: stored.customDomain,
      dnsRecords: [],
      dnsSetup: null,
      providerError: error instanceof Error ? error.message : "The domain status could not be refreshed.",
      setupAvailable: isVercelDomainAutomationConfigured(),
      verified: Boolean(stored.customDomainVerifiedAt),
    })
  }
}

export async function POST(request: Request) {
  const access = await getWorkspace()
  if ("response" in access) return access.response

  const writeBlock = await getSubscriptionWriteBlock(access.session.user.workspaceId)
  if (writeBlock) return writeBlock

  const parsed = customDomainSchema.safeParse(await request.json())
  const domain = parsed.success ? normalizeCustomDomain(parsed.data.domain) : ""
  if (!domain) {
    return NextResponse.json({
      error: "Enter only the purchased domain, such as example.com or www.example.com. Do not include a page path.",
    }, { status: 400 })
  }

  const prisma = getPrismaClient()
  const [stored, conflict] = await Promise.all([
    readStoredDomain(access.workspace.id),
    prisma.workspace.findFirst({
      select: { id: true },
      where: {
        customDomain: { in: getCustomDomainLookupCandidates(domain) },
        id: { not: access.workspace.id },
      },
    }),
  ])
  if (conflict) {
    return NextResponse.json({ error: "That domain is already connected to another PhotoView account." }, { status: 409 })
  }

  try {
    const status = await addCustomDomainToVercel(domain)
    const checkedAt = new Date()
    try {
      await prisma.workspace.update({
        data: {
          customDomain: domain,
          customDomainLastCheckedAt: checkedAt,
          customDomainVerifiedAt: status.active ? checkedAt : null,
        },
        where: { id: access.workspace.id },
      })
    } catch (error) {
      if (stored?.customDomain !== domain) await removeCustomDomainFromVercel(domain).catch(() => undefined)
      throw error
    }

    if (stored?.customDomain && stored.customDomain !== domain) {
      await removeCustomDomainFromVercel(stored.customDomain).catch(() => undefined)
    }

    return NextResponse.json({
      ...await withDnsGuidance(status, domain),
      checkedAt: checkedAt.toISOString(),
      domain,
      setupAvailable: true,
    })
  } catch (error) {
    return providerErrorResponse(error)
  }
}

export async function PATCH() {
  const access = await getWorkspace()
  if ("response" in access) return access.response

  const writeBlock = await getSubscriptionWriteBlock(access.session.user.workspaceId)
  if (writeBlock) return writeBlock

  const stored = await readStoredDomain(access.workspace.id)
  if (!stored?.customDomain) {
    return NextResponse.json({ error: "Connect a domain before checking it." }, { status: 404 })
  }

  try {
    const status = await verifyCustomDomainWithVercel(stored.customDomain)
    const checkedAt = await saveProviderStatus(access.workspace.id, status)
    return NextResponse.json({
      ...await withDnsGuidance(status, stored.customDomain),
      checkedAt: checkedAt.toISOString(),
      domain: stored.customDomain,
      setupAvailable: true,
    })
  } catch (error) {
    return providerErrorResponse(error)
  }
}

export async function DELETE() {
  const access = await getWorkspace()
  if ("response" in access) return access.response

  const writeBlock = await getSubscriptionWriteBlock(access.session.user.workspaceId)
  if (writeBlock) return writeBlock

  const stored = await readStoredDomain(access.workspace.id)
  if (!stored?.customDomain) {
    return NextResponse.json({ removed: true })
  }

  try {
    await removeCustomDomainFromVercel(stored.customDomain)
    await getPrismaClient().workspace.update({
      data: {
        customDomain: null,
        customDomainLastCheckedAt: null,
        customDomainVerifiedAt: null,
      },
      where: { id: access.workspace.id },
    })
    return NextResponse.json({ removed: true })
  } catch (error) {
    return providerErrorResponse(error)
  }
}
