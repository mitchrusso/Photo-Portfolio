import { getPrismaClient } from "../src/lib/db"
import { isEmailSuppressed } from "../src/lib/email-suppression"
import { queueSupportEmail } from "../src/lib/support-email-outbox"

const CAMPAIGN_KEY = "comeback-trial-2026-11"
const VIDEO_URL = "https://youtu.be/4snxazGsOy0"
const LOGIN_URL = "https://photoview.io/login"

function isInternalOrTestAccount(email: string, name: string) {
  return /mitchrusso|photoview.*test|test.*photoview|example\.com/i.test(`${email} ${name}`)
}

function retainedWorkParagraph(photoCount: number, galleryCount: number) {
  if (photoCount > 0) {
    return `We checked your PhotoView account before writing: your existing gallery structure and ${photoCount.toLocaleString("en-US")} uploaded ${photoCount === 1 ? "photo is" : "photos are"} still there, so you can pick up where you left off.`
  }
  if (galleryCount > 0) {
    return "We checked your PhotoView account before writing: your existing gallery structure is still there. We did not find retained uploaded photo files, so we do not want to promise files that are no longer present."
  }
  return "Your PhotoView login can be reactivated, but we did not find retained galleries or uploaded photo files in the account, so you would be starting with a clean workspace."
}

function campaignBody(firstName: string, photoCount: number, galleryCount: number) {
  return `Hi ${firstName || "there"},

You were one of PhotoView.io's very first subscribers, and I want to thank you for giving the platform a try so early.

The honest truth is that the early version had bugs, and we had not yet created the training people needed. Since then, we have repaired the core issues, made the site much more stable, and started rolling out clear, step-by-step training videos.

${retainedWorkParagraph(photoCount, galleryCount)}

I would like to invite you back with a fresh, one-time 14-day free trial. There is no charge today. Stripe will show the plan, renewal date, and future price before you confirm, and you can cancel before the trial ends.

PhotoView now includes multiple photography websites from one central photo library, Lightroom Classic and Adobe Bridge import tools, more than 30 customizable templates, mobile presentation tools, improved portfolio controls, and guided help throughout the application.

This short welcome video shows the new workflow and explains how Galleries, Portfolios, and Photos work together:
${VIDEO_URL}

To restart, sign in with this email address, open My Account, and choose "Restart my free 14-day trial":
${LOGIN_URL}

I hope you will come back and see how much PhotoView has improved. If you have any questions, reply directly to this email and we will help.

Warmly,
Mitch Russo
Founder, PhotoView.io`
}

async function main() {
  const shouldQueue = process.argv.includes("--queue")
  const prisma = getPrismaClient()
  const subscriptions = await prisma.subscription.findMany({
    include: {
      workspace: {
        include: {
          members: {
            include: { user: true },
            orderBy: { createdAt: "asc" },
            where: { role: "OWNER" },
          },
          trialSignups: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    where: { status: "CANCELED" },
  })

  const results: Array<Record<string, unknown>> = []
  for (const subscription of subscriptions) {
    const owner = subscription.workspace.members[0]?.user
    if (!owner?.email) continue
    const displayName = owner.name || [owner.firstName, owner.lastName].filter(Boolean).join(" ")
    const marketingConsent = subscription.workspace.trialSignups[0]?.marketingConsent === true
    const suppressed = await isEmailSuppressed(owner.email)
    const internal = isInternalOrTestAccount(owner.email, displayName)
    const [photoCount, galleryCount] = await Promise.all([
      prisma.photo.count({ where: { workspaceId: subscription.workspaceId } }),
      prisma.gallery.count({ where: { workspaceId: subscription.workspaceId } }),
    ])
    const eligible = marketingConsent && !suppressed && !internal && !subscription.comebackTrialRedeemedAt
    let state = eligible ? "ready" : suppressed ? "suppressed" : internal ? "internal_or_test" : !marketingConsent ? "no_marketing_consent" : "already_redeemed"

    if (eligible && shouldQueue) {
      const queued = await queueSupportEmail({
        body: campaignBody(owner.firstName || displayName.split(/\s+/)[0] || "", photoCount, galleryCount),
        deliveryKey: `${CAMPAIGN_KEY}:${subscription.id}`,
        recipientName: displayName || null,
        source: "comeback_trial_offer",
        subject: "A fresh 14-day PhotoView trial—come see what changed",
        toEmail: owner.email,
      })
      state = queued.state
    }

    results.push({
      email: owner.email,
      galleries: galleryCount,
      name: displayName,
      photos: photoCount,
      state,
      subscriptionId: subscription.id,
      workspaceId: subscription.workspaceId,
    })
  }

  const summary = results.reduce<Record<string, number>>((counts, result) => {
    const state = String(result.state)
    counts[state] = (counts[state] ?? 0) + 1
    return counts
  }, {})
  console.log(JSON.stringify({ campaign: CAMPAIGN_KEY, queued: shouldQueue, summary, subscribers: results }, null, 2))
}

void main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => getPrismaClient().$disconnect())
