import { NextResponse } from "next/server"
import OpenAI from "openai"
import { z } from "zod"

import { auth } from "@/auth"
import { normalizeAiHelpStepAnswer } from "@/lib/ai-help-format"
import {
  findCanonicalAiHelpTopic,
  findRelevantAiHelpTopics,
  formatConciseAiHelpTopicAnswer,
  rankAiHelpTopics,
} from "@/lib/ai-help-knowledge"
import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"
import { checkRequestRateLimit } from "@/lib/request-rate-limit"

export const dynamic = "force-dynamic"

const helpRequestSchema = z.object({
  context: z.string().trim().max(160).optional(),
  question: z.string().trim().min(3).max(800),
})

function buildKnowledgeContext(question: string) {
  return findRelevantAiHelpTopics(question, 3)
    .map((topic) => [
      `Topic: ${topic.title}`,
      `Summary: ${topic.summary}`,
      ...topic.details.map((detail) => `- ${detail}`),
    ].join("\n"))
    .join("\n\n")
}

function fallbackAnswer(question: string) {
  const topics = findRelevantAiHelpTopics(question, 1)

  if (topics.length === 0) {
    return [
      "1. Name the PhotoView page you are using.",
      "2. Include the button, setting, or result you want help with.",
      "3. Ask the question again so I can give you the exact steps.",
    ].join("\n")
  }

  return topics
    .map((topic) => formatConciseAiHelpTopicAnswer(topic))
    .join("\n\n")
}

function clarificationAnswer(question: string, context = "") {
  const rankedTopics = rankAiHelpTopics(`${question} ${context}`)
    .filter(({ score }) => score > 0)
    .slice(0, 2)
  const [first, second] = rankedTopics

  if (!first || first.score < 8) {
    return [
      "1. Which PhotoView page are you on: Portfolio, Library, My Website, or Settings?",
      "2. What exact button, text, or result do you want to change?",
    ].join("\n")
  }

  if (second && second.score >= 8 && first.score - second.score <= 3) {
    return [
      `1. Do you mean “${first.topic.title}” or “${second.topic.title}”?`,
      "2. Reply with one choice and I’ll give only the exact steps for that screen.",
    ].join("\n")
  }

  return null
}

export async function POST(request: Request) {
  const session = await auth()

  const parsed = helpRequestSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Ask a PhotoView.io question in 3 to 800 characters." }, { status: 400 })
  }

  const canonicalTopic = findCanonicalAiHelpTopic(parsed.data.question)
  if (canonicalTopic) {
    return NextResponse.json({
      answer: formatConciseAiHelpTopicAnswer(canonicalTopic),
      mode: "verified",
      note: "This answer comes directly from PhotoView.io's verified feature guide.",
    })
  }

  const clarification = clarificationAnswer(parsed.data.question, parsed.data.context)
  if (clarification) {
    return NextResponse.json({
      answer: clarification,
      mode: "clarification",
      note: "I need one detail so I can point to the exact PhotoView control.",
    })
  }

  const apiKey = process.env.OPENAI_API_KEY
  const knowledge = buildKnowledgeContext(`${parsed.data.question} ${parsed.data.context ?? ""}`)

  if (!apiKey || !session?.user) {
    return NextResponse.json({
      answer: fallbackAnswer(parsed.data.question),
      mode: "local",
      note: !apiKey
        ? "AI is not configured yet, so this answer came from the built-in help database."
        : "This answer came from the built-in help database because you are not signed into a subscriber session.",
    })
  }

  const rateLimit = await checkRequestRateLimit(`ai-help:${session.user.workspaceId}`, 30, 10 * 60 * 1000)
  if (!rateLimit.allowed) {
    return NextResponse.json({
      answer: fallbackAnswer(parsed.data.question),
      mode: "local",
      note: "AI help is temporarily limited, so this answer came from the built-in help database.",
    })
  }

  try {
    const client = new OpenAI({ apiKey })
    const response = await client.responses.create({
      input: [
        {
          content: [
            {
              text: [
                "You are PhotoView.io's subscriber help assistant.",
                "Answer only using the PhotoView.io knowledge below.",
                "Answer the subscriber's exact question without adding adjacent features or background information.",
                "Always return 2 to 4 short numbered steps, even if the subscriber does not phrase the question as a how-to.",
                "Start with the exact menu, page, or control path. Put one action in each step and keep each step under 18 words.",
                "Do not add an introduction, recap, heading, background explanation, or closing sentence.",
                "Return plain text only. Do not use Markdown emphasis, headings, tables, or code formatting.",
                "Prefer uncluttered workflows: direct users to Library for organization/search/bulk edits, to individual portfolios for presentation controls, and to Settings for site-wide configuration.",
                "If a feature is not built yet or the knowledge is incomplete, say so plainly and suggest the nearest available workflow.",
                "If the question could refer to more than one screen or control, ask one short clarifying question instead of guessing.",
                "Do not invent settings, buttons, billing rules, or integrations.",
                "",
                "PhotoView.io knowledge:",
                knowledge,
                "",
                `Current PhotoView context: ${parsed.data.context ?? "Not supplied"}`,
                `Subscriber question: ${parsed.data.question}`,
              ].join("\n"),
              type: "input_text",
            },
          ],
          role: "user",
        },
      ],
      max_output_tokens: 220,
      model: process.env.OPENAI_AI_HELP_MODEL ?? "gpt-4.1-mini",
    })
    await resolveOperationalEventByFingerprint("ai:subscriber-help")

    return NextResponse.json({
      answer: normalizeAiHelpStepAnswer(response.output_text || fallbackAnswer(parsed.data.question)),
      mode: "ai",
    })
  } catch (error) {
    console.error("AI help request failed", error)
    await recordOperationalEvent({
      category: "AI",
      fingerprint: "ai:subscriber-help",
      message: error instanceof Error ? error.message : "AI help request failed",
      severity: "WARNING",
      source: "/api/ai/help",
      workspaceId: session.user.workspaceId,
    })

    return NextResponse.json({
      answer: fallbackAnswer(parsed.data.question),
      mode: "local",
      note: "The AI service was unavailable, so this answer came from the built-in help database.",
    })
  }
}
