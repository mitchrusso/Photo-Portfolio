import { NextResponse } from "next/server"
import OpenAI from "openai"
import { z } from "zod"

import { auth } from "@/auth"
import { findRelevantAiHelpTopics } from "@/lib/ai-help-knowledge"
import { recordOperationalEvent } from "@/lib/operational-monitoring"

export const dynamic = "force-dynamic"

const helpRequestSchema = z.object({
  question: z.string().trim().min(3).max(800),
})

function buildKnowledgeContext(question: string) {
  return findRelevantAiHelpTopics(question)
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
    return "I do not have enough PhotoViewPro help content for that yet. Try asking about My Website, Library organization, tags, search, uploads, covers, hiding photos, captions, sharing, embeds, mobile viewing, billing, storage, AI portfolio tools, or watermarks."
  }

  return topics
    .map((topic) => [
      `${topic.title}: ${topic.summary}`,
      "",
      ...topic.details.map((detail) => `- ${detail}`),
    ].join("\n"))
    .join("\n\n")
}

export async function POST(request: Request) {
  const session = await auth()

  const parsed = helpRequestSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Ask a PhotoViewPro question in 3 to 800 characters." }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  const knowledge = buildKnowledgeContext(parsed.data.question)

  if (!apiKey || !session?.user) {
    return NextResponse.json({
      answer: fallbackAnswer(parsed.data.question),
      mode: "local",
      note: !apiKey
        ? "AI is not configured yet, so this answer came from the built-in help database."
        : "This answer came from the built-in help database because you are not signed into a subscriber session.",
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
                "You are PhotoViewPro's subscriber help assistant.",
                "Answer only using the PhotoViewPro knowledge below.",
                "Be concise, practical, and friendly.",
                "Prefer uncluttered workflows: direct users to Library for organization/search/bulk edits, to individual portfolios for presentation controls, and to Settings for site-wide configuration.",
                "If a feature is not built yet or the knowledge is incomplete, say so plainly and suggest the nearest available workflow.",
                "Do not invent settings, buttons, billing rules, or integrations.",
                "",
                "PhotoViewPro knowledge:",
                knowledge,
                "",
                `Subscriber question: ${parsed.data.question}`,
              ].join("\n"),
              type: "input_text",
            },
          ],
          role: "user",
        },
      ],
      max_output_tokens: 650,
      model: process.env.OPENAI_AI_HELP_MODEL ?? "gpt-4.1-nano",
    })

    return NextResponse.json({
      answer: response.output_text?.trim() || fallbackAnswer(parsed.data.question),
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
