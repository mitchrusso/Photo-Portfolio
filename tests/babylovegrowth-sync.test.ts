import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import {
  contentFingerprint,
  prepareBabyLoveGrowthArticle,
  sanitizeBabyLoveGrowthHtml,
} from "../src/lib/babylovegrowth-content.ts"

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8")

test("BabyLoveGrowth HTML is stripped of scripts, unsafe URLs, and provider structured data", () => {
  const sanitized = sanitizeBabyLoveGrowthHtml(`
    <script type="application/ld+json">{"author":"BabyLoveGrowth"}</script>
    <h1>Safe title</h1>
    <p onclick="alert(1)">Useful copy</p>
    <a href="javascript:alert(1)">bad link</a>
    <a href="https://example.com/story">safe link</a>
    <img src="data:image/svg+xml,bad" onerror="alert(1)">
  `)

  assert.doesNotMatch(sanitized, /script|BabyLoveGrowth|onclick|javascript:|data:image|onerror/i)
  assert.match(sanitized, /<h2>Safe title<\/h2>/)
  assert.match(sanitized, /href="https:\/\/example\.com\/story"/)
  assert.match(sanitized, /rel="nofollow noopener noreferrer"/)
})

test("BabyLoveGrowth mapping keeps PhotoView in control of authorship and canonical URLs", () => {
  const article = prepareBabyLoveGrowthArticle({
    id: 42,
    title: "  A Better Portfolio  ",
    slug: "A Better Portfolio",
    content_html: "<p>Show the work beautifully.</p>",
    hero_image_url: "https://images.example.com/hero.jpg",
    jsonLd: { author: { name: "BabyLoveGrowth" } },
    orgWebsite: "https://provider.example.com",
    publicUrl: "https://provider.example.com/a-better-portfolio",
    faqJsonLd: {
      "@type": "FAQPage",
      author: "BabyLoveGrowth",
      mainEntity: [{
        "@type": "Question",
        name: "What matters?",
        acceptedAnswer: { "@type": "Answer", text: "<b>The photographs.</b>" },
      }],
    },
    created_at: "2026-08-10T12:00:00.000Z",
    keywords: ["portfolio", "portfolio"],
  })

  assert.equal(article.slug, "a-better-portfolio")
  assert.deepEqual(article.keywords, ["portfolio"])
  assert.equal(article.heroImageUrl, "https://images.example.com/hero.jpg")
  assert.equal("jsonLd" in article, false)
  assert.equal("orgWebsite" in article, false)
  assert.equal("publicUrl" in article, false)
  assert.doesNotMatch(JSON.stringify(article.faqJsonLd), /BabyLoveGrowth/)
})

test("normalized content fingerprints detect the same article despite harmless formatting differences", () => {
  assert.equal(
    contentFingerprint("The Story", "<p>One   photograph.</p>"),
    contentFingerprint(" the story ", "One photograph."),
  )
})

test("BabyLoveGrowth routes require private bearer secrets and never publish provider authorship", () => {
  const webhook = readSource("src/app/api/integrations/babylovegrowth/webhook/route.ts")
  const syncRoute = readSource("src/app/api/integrations/babylovegrowth/sync/route.ts")
  const articlePage = readSource("src/app/articles/[slug]/page.tsx")
  const sync = readSource("src/lib/babylovegrowth-sync.ts")

  assert.match(webhook, /BABYLOVEGROWTH_WEBHOOK_SECRET/)
  assert.match(webhook, /hasAuthorizedBearerSecret/)
  assert.match(syncRoute, /process\.env\.CRON_SECRET/)
  assert.match(sync, /source_sourceArticleId/)
  assert.match(sync, /contentHash/)
  assert.match(sync, /staticArticleSlugs/)
  assert.match(sync, /staticArticleTitles/)
  assert.match(articlePage, /PHOTOVIEW_ARTICLE_AUTHOR/)
  assert.doesNotMatch(articlePage, /author[^]*BabyLoveGrowth/)
})
