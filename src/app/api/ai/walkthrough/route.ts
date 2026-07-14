import { NextResponse } from "next/server"
import OpenAI from "openai"
import { z } from "zod"

import { auth } from "@/auth"
import {
  classifyWebsiteWalkthroughGoal,
  getWebsiteWalkthrough,
  websiteWalkthroughGoalOptions,
  type WebsiteWalkthroughGoal,
} from "@/lib/website-walkthroughs"
import { recordOperationalEvent } from "@/lib/operational-monitoring"
import { checkRequestRateLimit } from "@/lib/request-rate-limit"

export const dynamic = "force-dynamic"

const requestSchema = z.object({
  request: z.string().trim().min(3).max(400),
})

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Tell Merlin what you want to accomplish in 3 to 400 characters." }, { status: 400 })
  }

  const fallbackGoal = classifyWebsiteWalkthroughGoal(parsed.data.request)
  let goal: WebsiteWalkthroughGoal = fallbackGoal
  let mode: "ai" | "local" = "local"
  const session = await auth()

  const rateLimit = session?.user?.workspaceId
    ? await checkRequestRateLimit(`ai-walkthrough:${session.user.workspaceId}`, 30, 10 * 60 * 1000)
    : null

  if (process.env.OPENAI_API_KEY && session?.user && rateLimit?.allowed) {
    try {
      const allowedGoals = websiteWalkthroughGoalOptions.map((option) => option.goal)
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const response = await client.responses.create({
        input: [
          {
            content: [
              {
                text: [
                  "Classify this PhotoViewPro website-builder goal.",
                  `Return exactly one ID from: ${allowedGoals.join(", ")}.`,
                  "Do not add punctuation, explanation, or any other words.",
                  `Subscriber goal: ${parsed.data.request}`,
                ].join("\n"),
                type: "input_text",
              },
            ],
            role: "user",
          },
        ],
        max_output_tokens: 20,
        model: process.env.OPENAI_AI_HELP_MODEL ?? "gpt-4.1-nano",
      })
      const candidate = response.output_text?.trim() as WebsiteWalkthroughGoal | undefined
      if (candidate && allowedGoals.includes(candidate)) {
        goal = candidate
        mode = "ai"
      }
    } catch (error) {
      console.error("Merlin walkthrough classification failed", error)
      await recordOperationalEvent({
        category: "AI",
        fingerprint: "ai:merlin-walkthrough",
        message: error instanceof Error ? error.message : "Merlin walkthrough classification failed",
        severity: "WARNING",
        source: "/api/ai/walkthrough",
        workspaceId: session.user.workspaceId,
      })
    }
  }

  return NextResponse.json({ ...getWebsiteWalkthrough(goal), mode })
}
