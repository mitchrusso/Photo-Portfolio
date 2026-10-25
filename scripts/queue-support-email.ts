import { z } from "zod"

import { getPrismaClient } from "../src/lib/db"
import { queueSupportEmail, supportReportStatuses } from "../src/lib/support-email-outbox"

const inputSchema = z.object({
  body: z.string().trim().min(1).max(12_000),
  deliveryKey: z.string().trim().min(8).max(240),
  recipientName: z.string().trim().max(120).optional(),
  reportId: z.string().trim().max(80).optional(),
  resolutionNote: z.string().trim().max(2_000).optional(),
  source: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(240),
  targetReportStatus: z.enum(supportReportStatuses).optional(),
  toEmail: z.string().trim().email().max(320),
})

function option(name: string) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function decode(value: string | undefined, label: string) {
  if (!value) throw new Error(`Missing --${label}`)
  return Buffer.from(value, "base64").toString("utf8")
}

async function main() {
  const input = inputSchema.parse({
    body: decode(option("body-base64"), "body-base64"),
    deliveryKey: option("delivery-key"),
    recipientName: option("recipient-name"),
    reportId: option("report-id"),
    resolutionNote: option("resolution-note-base64") ? decode(option("resolution-note-base64"), "resolution-note-base64") : undefined,
    source: option("source"),
    subject: decode(option("subject-base64"), "subject-base64"),
    targetReportStatus: option("target-report-status"),
    toEmail: option("to"),
  })
  const result = await queueSupportEmail(input)
  console.log(JSON.stringify(result))
}

void main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => getPrismaClient().$disconnect())
