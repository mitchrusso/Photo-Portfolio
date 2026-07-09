import { NextResponse } from "next/server"
import OpenAI from "openai"
import { z } from "zod"

import { auth } from "@/auth"

export const dynamic = "force-dynamic"

const portfolioPhotoSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional().default(""),
  fileName: z.string().optional().default(""),
  caption: z.string().optional().default(""),
  category: z.string().optional().default(""),
  location: z.string().optional().default(""),
  trip: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  hidden: z.boolean().optional().default(false),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
})

const portfolioAiRequestSchema = z.object({
  action: z.enum(["curate", "social"]),
  gallery: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    client: z.string().optional().default(""),
    description: z.string().optional().default(""),
    infoLocation: z.string().optional().default(""),
    privacy: z.string().optional().default("Private link"),
    publicUrl: z.string().optional().default(""),
  }),
  photos: z.array(portfolioPhotoSchema).max(150),
})

type PortfolioAiRequest = z.infer<typeof portfolioAiRequestSchema>
type PortfolioAiSuggestion = {
  captionUpdates: Array<{
    caption: string
    photoId: string
    tags: string[]
  }>
  coverPhotoId: string
  coverReason: string
  duplicateGroups: Array<{
    photoIds: string[]
    reason: string
  }>
  intro: string
  orderReason: string
  orderedPhotoIds: string[]
  socialPosts: {
    email: string
    facebook: string
    instagram: string
    linkedin: string
    pinterest: string
    x: string
  }
  titleIdeas: string[]
}

function cleanTitle(value: string) {
  return value
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function baseTags(payload: PortfolioAiRequest) {
  return Array.from(
    new Set(
      [
        payload.gallery.name,
        payload.gallery.infoLocation,
        ...payload.photos.flatMap((photo) => [photo.category, photo.location, photo.trip]),
      ]
        .map((tag) => cleanTitle(tag ?? "").toLowerCase())
        .filter(Boolean)
        .slice(0, 8),
    ),
  )
}

function findDuplicateGroups(photos: PortfolioAiRequest["photos"]) {
  const groups = new Map<string, string[]>()

  photos.forEach((photo) => {
    const titleKey = cleanTitle(photo.title || photo.fileName).toLowerCase()
    const dimensionKey = photo.width && photo.height ? `${photo.width}x${photo.height}` : "unknown-size"
    const key = `${titleKey}:${dimensionKey}`
    groups.set(key, [...(groups.get(key) ?? []), photo.id])
  })

  return Array.from(groups.values())
    .filter((photoIds) => photoIds.length > 1)
    .map((photoIds) => ({
      photoIds,
      reason: "These photos have matching names and dimensions, so review them as likely duplicates before publishing.",
    }))
}

function buildFallbackSuggestion(payload: PortfolioAiRequest): PortfolioAiSuggestion {
  const visiblePhotos = payload.photos.filter((photo) => !photo.hidden)
  const visibleLandscapePhotos = visiblePhotos.filter((photo) => (photo.width ?? 0) >= (photo.height ?? 0))
  const coverPhoto = visibleLandscapePhotos[0] ?? visiblePhotos[0] ?? payload.photos[0]
  const tags = baseTags(payload)
  const galleryName = payload.gallery.name
  const client = payload.gallery.client || "the photographer"
  const visibleCount = visiblePhotos.length
  const intro = [
    `${galleryName} is a curated portfolio of ${visibleCount || payload.photos.length} images selected for presentation, flow, and impact.`,
    payload.gallery.infoLocation ? `The work is anchored in ${payload.gallery.infoLocation}.` : "",
    "Use the sequence to move visitors from a strong opening image into the quieter details and finishing frames.",
  ].filter(Boolean).join(" ")

  return {
    captionUpdates: visiblePhotos.slice(0, 24).map((photo) => ({
      photoId: photo.id,
      caption: photo.caption || cleanTitle(photo.title || photo.fileName) || galleryName,
      tags: Array.from(new Set([...(photo.tags ?? []), ...tags])).slice(0, 8),
    })),
    coverPhotoId: coverPhoto?.id ?? "",
    coverReason: coverPhoto
      ? "This visible image is a strong starting cover based on orientation and existing order. Review it visually before applying."
      : "Add visible photos before choosing a cover.",
    duplicateGroups: findDuplicateGroups(payload.photos),
    intro,
    orderReason: "This keeps the subscriber's current visible-photo order and excludes hidden photos. Use it as a safe first pass.",
    orderedPhotoIds: visiblePhotos.map((photo) => photo.id),
    socialPosts: {
      email: `I just published ${galleryName}, a new PhotoViewPro portfolio. You can view it here: ${payload.gallery.publicUrl}`,
      facebook: `New portfolio: ${galleryName}. A curated set of images from ${client}, built for clean viewing on desktop and mobile. ${payload.gallery.publicUrl}`,
      instagram: `New portfolio: ${galleryName}. Curated, clean, and ready to view. Link in profile.`,
      linkedin: `I just published ${galleryName} in PhotoViewPro, focused on a clean portfolio presentation across desktop and mobile. ${payload.gallery.publicUrl}`,
      pinterest: `${galleryName} photo portfolio by ${client}`,
      x: `${galleryName} is live: ${payload.gallery.publicUrl}`,
    },
    titleIdeas: [
      galleryName,
      `${galleryName}: Selected Work`,
      `${galleryName}: A Curated Portfolio`,
    ],
  }
}

function sanitizeSuggestion(value: unknown, fallback: PortfolioAiSuggestion): PortfolioAiSuggestion {
  const schema = z.object({
    captionUpdates: z.array(z.object({
      caption: z.string().max(220),
      photoId: z.string(),
      tags: z.array(z.string()).max(10),
    })).max(40),
    coverPhotoId: z.string(),
    coverReason: z.string().max(400),
    duplicateGroups: z.array(z.object({
      photoIds: z.array(z.string()).min(2).max(8),
      reason: z.string().max(300),
    })).max(12),
    intro: z.string().max(700),
    orderReason: z.string().max(400),
    orderedPhotoIds: z.array(z.string()).max(150),
    socialPosts: z.object({
      email: z.string().max(900),
      facebook: z.string().max(500),
      instagram: z.string().max(500),
      linkedin: z.string().max(600),
      pinterest: z.string().max(300),
      x: z.string().max(280),
    }),
    titleIdeas: z.array(z.string()).max(6),
  })

  const parsed = schema.safeParse(value)
  return parsed.success ? parsed.data : fallback
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = portfolioAiRequestSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid portfolio assistant payload", issues: parsed.error.flatten() }, { status: 400 })
  }

  const payload = parsed.data
  const fallback = buildFallbackSuggestion(payload)
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json({
      mode: "local",
      note: "AI is not configured in this local environment, so these are rule-based suggestions.",
      suggestion: fallback,
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
                "You are PhotoViewPro's portfolio assistant for serious photographers.",
                "Return JSON only. Do not include markdown.",
                "The assistant suggests edits; it never claims changes were applied.",
                "Respect guardrails: hidden photos must not be included in public order, sharing copy, or cover suggestions.",
                "Use only the supplied metadata. Do not pretend to visually inspect images unless width/height/name/caption supports the suggestion.",
                "Keep captions tasteful and concise. Avoid sales hype and avoid invented camera/location facts.",
                "Social copy should help the photographer share a portfolio without sounding spammy.",
                "",
                "JSON shape:",
                JSON.stringify(fallback),
                "",
                `Requested action: ${payload.action}`,
                "Portfolio payload:",
                JSON.stringify(payload),
              ].join("\n"),
              type: "input_text",
            },
          ],
          role: "user",
        },
      ],
      max_output_tokens: 1800,
      model: process.env.OPENAI_PORTFOLIO_ASSISTANT_MODEL ?? process.env.OPENAI_AI_HELP_MODEL ?? "gpt-4.1-nano",
    })

    const text = response.output_text?.trim() ?? ""
    const json = JSON.parse(text) as unknown

    return NextResponse.json({
      mode: "ai",
      suggestion: sanitizeSuggestion(json, fallback),
    })
  } catch (error) {
    console.error("AI portfolio assistant failed", error)

    return NextResponse.json({
      mode: "local",
      note: "The AI service was unavailable, so these are rule-based suggestions.",
      suggestion: fallback,
    })
  }
}
