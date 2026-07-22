import PartnershipCrm from "@/components/admin/partnership-crm"
import { notFound } from "next/navigation"

export default function CrmDesignPreview() {
  if (process.env.NODE_ENV !== "development") notFound()
  const partner = {
    activities: [{ detail: "AI sequence prepared for review.", displayDate: null, id: "activity-1", title: "Outreach draft created", type: "email" }],
    category: "Digital asset management", company: "ACDSee", contacts: [{ email: "partnerships@acdsee.example", id: "contact-1", isPrimary: true, linkedin: null, name: "Product partnerships", role: "Business development" }],
    emailSequences: [{ approvedAt: null, completedAt: null, contact: { email: "partnerships@acdsee.example", id: "contact-1", isPrimary: true, linkedin: null, name: "Product partnerships", role: "Business development" }, createdAt: "2026-07-22T15:00:00.000Z", goal: "Schedule a discovery call", id: "sequence-1", pausedAt: null, status: "DRAFT", stopOnReply: true, tone: "Professional and warm", steps: [1, 2, 3].map((position) => ({ body: position === 1 ? "Hi there,\n\nACDSee users already organize large image libraries. PhotoView can give selected finished work a direct path into polished galleries, portfolios, and campaigns.\n\nWould you be open to a brief conversation?\n\nBest,\nMitch Russo" : "A concise, helpful follow-up that adds value without repeating the introduction.", id: `step-${position}`, lastError: null, position, scheduledAt: `2026-0${position === 1 ? "7-23" : position === 2 ? "7-28" : "8-04"}T15:00:00.000Z`, sentAt: null, status: "DRAFT", subject: position === 1 ? "A PhotoView.io publishing idea for ACDSee" : `Follow-up ${position - 1}: A simpler publishing workflow` })) }],
    id: "partner-1", integration: ["Publish selected assets", "Sync metadata", "Create named PhotoView collections"], nextStep: "Approve outreach sequence", notes: [], opportunity: "Turn an ACDSee collection into a published PhotoView gallery without leaving the workflow.", painPoints: ["Publishing selections is manual", "Portfolio tools duplicate organization work"], score: 89, slug: "acdsee", stage: "Contacted", summary: "ACDSee users already organize and manage large image libraries.", valueCents: 8000000, website: "https://www.acdsee.com",
  }
  return <PartnershipCrm crmMessagingEmail="mitch@photoview.io" initialData={{ meetings: [], outreach: [], partners: [partner], tasks: [] }} signedInEmail="mitchrusso@gmail.com" />
}
