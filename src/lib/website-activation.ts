import { getPrismaClient } from "@/lib/db"
import { setAdditionalWebsiteQuantity } from "@/lib/additional-website-billing"
import { normalizePublicSiteSubdomain } from "@/lib/site-domain"

export class WebsiteActivationError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.name = "WebsiteActivationError"
    this.code = code
    this.status = status
  }
}

export async function activateAdditionalWebsite({
  requestedSubdomain,
  websiteId,
  workspaceId,
}: {
  requestedSubdomain: string
  websiteId: string
  workspaceId: string
}) {
  const prisma = getPrismaClient()
  const subdomain = normalizePublicSiteSubdomain(requestedSubdomain)
  if (!subdomain) {
    throw new WebsiteActivationError(
      "invalid_subdomain",
      "Use 1–63 lowercase letters, numbers, or hyphens. The address cannot begin or end with a hyphen or use a reserved PhotoView.io name.",
    )
  }

  const website = await prisma.website.findFirst({
    where: { deletedAt: null, id: websiteId, workspaceId },
  })
  if (!website) throw new WebsiteActivationError("website_not_found", "Website not found.", 404)
  if (website.billingType !== "ADD_ON") {
    throw new WebsiteActivationError("included_website", "The included website does not require an add-on activation.")
  }
  if (website.status === "ACTIVE") return website
  if (website.status !== "DRAFT" && website.status !== "BILLING_FAILED") {
    throw new WebsiteActivationError("website_not_activatable", "This website cannot be activated in its current state.", 409)
  }
  if (!website.draftBody) {
    throw new WebsiteActivationError("website_not_built", "Build and save this website before activating its paid PhotoView.io address.", 409)
  }

  const [legacyConflict, websiteConflict, activeAddOnCount] = await Promise.all([
    prisma.workspace.findFirst({
      select: { id: true },
      where: {
        id: { not: workspaceId },
        OR: [{ slug: subdomain }, { websiteSubdomain: subdomain }],
      },
    }),
    prisma.website.findFirst({
      select: { id: true },
      where: { id: { not: websiteId }, subdomain },
    }),
    prisma.website.count({ where: { billingType: "ADD_ON", deletedAt: null, status: "ACTIVE", workspaceId } }),
  ])
  if (legacyConflict || websiteConflict) {
    throw new WebsiteActivationError("subdomain_in_use", "That PhotoView.io address is already in use. Try another.", 409)
  }

  const quantity = activeAddOnCount + 1
  await setAdditionalWebsiteQuantity({
    idempotencyKey: `website-activate-${websiteId}-${quantity}`,
    quantity,
    workspaceId,
  })

  const activatedAt = new Date()
  return prisma.website.update({
    data: {
      activatedAt,
      billingCommittedAt: activatedAt,
      disabledAt: null,
      requestedSubdomain: subdomain,
      status: "ACTIVE",
      subdomain,
    },
    where: { id: websiteId },
  })
}

export async function disableWebsiteImmediately({ websiteId, workspaceId }: { websiteId: string; workspaceId: string }) {
  const prisma = getPrismaClient()
  const website = await prisma.website.findFirst({
    select: { billingType: true, customDomain: true, id: true, isPrimary: true, status: true },
    where: { deletedAt: null, id: websiteId, workspaceId },
  })
  if (!website) throw new WebsiteActivationError("website_not_found", "Website not found.", 404)
  if (website.isPrimary) {
    throw new WebsiteActivationError("primary_website", "The included primary website cannot be deleted. Disable its publication instead.", 409)
  }

  const disabledAt = new Date()
  await prisma.website.update({
    data: {
      customDomain: null,
      customDomainLastCheckedAt: null,
      customDomainVerifiedAt: null,
      deletedAt: disabledAt,
      disabledAt,
      status: "DELETED",
      subdomain: null,
    },
    where: { id: websiteId },
  })

  if (website.billingType === "ADD_ON" && website.status === "ACTIVE") {
    const quantity = await prisma.website.count({
      where: { billingType: "ADD_ON", deletedAt: null, status: "ACTIVE", workspaceId },
    })
    await setAdditionalWebsiteQuantity({
      idempotencyKey: `website-delete-${websiteId}-${quantity}`,
      quantity,
      workspaceId,
    })
  }

  return { customDomain: website.customDomain, deletedAt: disabledAt }
}
