import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import PartnershipCrm from "@/components/admin/partnership-crm"
import { isAdminSession } from "@/lib/admin-access"
import { hasValidSuperAdminMfa } from "@/lib/admin-mfa"
import { getPartnershipCrmData } from "@/lib/partnership-crm/data"
import { crmGmailAddress } from "@/lib/partnership-crm/google"

export const dynamic = "force-dynamic"

export default async function PartnershipCrmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!isAdminSession(session)) redirect("/account")
  if (!(await hasValidSuperAdminMfa(session))) redirect("/admin/verify?next=%2Fadmin%2Fpartnerships")

  const data = await getPartnershipCrmData(session.user.id)
  const serialized = {
    meetings: data.meetings.map((row) => ({ ...row, createdAt: undefined, startsAt: row.startsAt.toISOString(), updatedAt: undefined })),
    outreach: data.outreach.map((row) => ({ ...row, createdAt: row.createdAt.toISOString(), sentAt: row.sentAt?.toISOString() ?? null, updatedAt: undefined })),
    partners: data.partners.map((row) => ({
      ...row,
      activities: row.activities.map((activity) => ({ ...activity, createdAt: undefined, occurredAt: activity.occurredAt?.toISOString() ?? null })),
      contacts: row.contacts.map((contact) => ({ ...contact, createdAt: undefined, updatedAt: undefined })),
      createdAt: undefined,
      integration: Array.isArray(row.integration) ? row.integration.filter((item): item is string => typeof item === "string") : [],
      notes: row.notes.map((note) => ({ ...note, createdAt: note.createdAt.toISOString(), updatedAt: undefined })),
      emailSequences: row.emailSequences.map((sequence) => ({
        ...sequence,
        approvedAt: sequence.approvedAt?.toISOString() ?? null,
        completedAt: sequence.completedAt?.toISOString() ?? null,
        contact: { ...sequence.contact, createdAt: undefined, updatedAt: undefined },
        createdAt: sequence.createdAt.toISOString(),
        pausedAt: sequence.pausedAt?.toISOString() ?? null,
        steps: sequence.steps.map((step) => ({
          ...step,
          createdAt: undefined,
          scheduledAt: step.scheduledAt.toISOString(),
          sentAt: step.sentAt?.toISOString() ?? null,
          updatedAt: undefined,
        })),
        updatedAt: undefined,
      })),
      painPoints: Array.isArray(row.painPoints) ? row.painPoints.filter((item): item is string => typeof item === "string") : [],
      updatedAt: undefined,
    })),
    tasks: data.tasks.map((row) => ({ ...row, completedAt: row.completedAt?.toISOString() ?? null, createdAt: undefined, dueAt: row.dueAt?.toISOString() ?? null, updatedAt: undefined })),
  }

  return <Suspense fallback={<main className="min-h-screen bg-[#f7f5f0] p-8">Loading partnership CRM…</main>}><PartnershipCrm crmMessagingEmail={crmGmailAddress()} initialData={serialized} /></Suspense>
}
