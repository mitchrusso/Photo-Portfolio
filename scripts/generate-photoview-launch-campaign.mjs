import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const root = process.cwd()
const outputDir = path.join(root, "marketing", "photoview-30-day-launch")
const creativeDir = path.join(outputDir, "creative")
const reviewDir = path.join(outputDir, "review")

const images = [
  "gallery-greenland.webp",
  "lofoten-aurora.webp",
  "gallery-moab-night-sky.webp",
  "gallery-brazil.webp",
  "gallery-sloss-furnaces.webp",
  "myanmar-temple.webp",
  "egypt-sphinx.webp",
  "sunset-panorama.webp",
  "portrait-scarf.webp",
  "mobile-ice-cave.webp",
]

const concepts = [
  ["A feed forgets your photographs.", "A portfolio gives them a place to live.", "feed-forgets"],
  ["Your best work deserves more than 24 hours.", "Build a portfolio people can return to.", "best-work"],
  ["Stop renting your visual identity.", "Publish a destination you control.", "identity"],
  ["Likes are a reaction. A portfolio is a body of work.", "Show the sequence, not just the scroll.", "body-of-work"],
  ["What happens after the post disappears?", "Keep the photographs. Keep the story.", "after-the-post"],
  ["Lightroom to live portfolio.", "Finish the edit. Skip the rebuild.", "lightroom-live"],
  ["Your export folder is not a portfolio.", "Turn finished files into a curated destination.", "export-folder"],
  ["Publish where you already edit.", "Send finished photographs from Lightroom Classic.", "publish-from-lightroom"],
  ["One less upload loop.", "Edit, select, publish, repeat.", "upload-loop"],
  ["Fresh work should not mean rebuilding galleries.", "Update the portfolio from your workflow.", "fresh-work"],
  ["One portfolio. Every destination.", "Share it, embed it, keep it current.", "every-destination"],
  ["Keep your website. Upgrade the gallery.", "Embed a live PhotoView.io portfolio.", "upgrade-gallery"],
  ["Curate once. Publish everywhere.", "One live source for every place your work appears.", "curate-once"],
  ["Your gallery should travel better than a JPEG folder.", "Send a responsive portfolio link instead.", "gallery-travels"],
  ["A clean link changes the conversation.", "Give clients the work without the feed.", "clean-link"],
  ["Still photographs can move.", "Mix photo and video in one visual story.", "photo-video"],
  ["Motion belongs beside the photograph.", "Build one portfolio for both.", "motion-beside"],
  ["No channel branding. Just your work.", "Present photo and video without the detour.", "no-branding"],
  ["Your portfolio is an edit, not an archive.", "Choose the sequence that earns attention.", "portfolio-edit"],
  ["More photographs do not make a stronger portfolio.", "Better choices do.", "better-choices"],
  ["Lead with the frame they remember.", "Choose the cover. Control the first impression.", "first-frame"],
  ["Hide the almost-great photographs.", "Publish only the work that supports the story.", "almost-great"],
  ["Desktop drama. Mobile clarity.", "A portfolio should hold up on both.", "responsive"],
  ["A beautiful website should not require a beautiful budget.", "Start at $3.99/month after the trial.", "affordable"],
  ["Thirty templates. One point of view: yours.", "Build around the photographs, not a theme demo.", "templates"],
  ["Your next client may arrive on a phone.", "Give them the full portfolio, not a compromise.", "mobile-client"],
  ["From camera roll to curated portfolio.", "Import the keepers from your phone.", "phone-import"],
  ["A destination makes sharing intentional.", "Send people somewhere built for the work.", "intentional-sharing"],
  ["The photograph is finished. Is the presentation?", "Give the final image a final home.", "presentation"],
  ["Put your finished work somewhere worth visiting.", "Start a real portfolio free for 14 days.", "worth-visiting"],
]

const campaignStart = new Date("2026-08-17T14:00:00.000Z")
const landingByIndex = (index) => index < 5
  ? "feed-forgets"
  : index < 10
    ? "lightroom-portfolio-website"
    : index < 15
      ? "embed-photography-portfolio"
      : index < 18
        ? "photography-portfolio-with-video"
        : "portfolio-home"

const hrefByLanding = {
  "embed-photography-portfolio": "/solutions/embed-photography-portfolio",
  "feed-forgets": "/",
  "lightroom-portfolio-website": "/solutions/lightroom-portfolio-website",
  "photography-portfolio-with-video": "/solutions/photography-portfolio-with-video",
  "portfolio-home": "/",
}

function xml(value) {
  return value.replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char])
}

function wrap(value, max = 26) {
  const words = value.split(" ")
  const lines = []
  let line = ""
  for (const word of words) {
    if (`${line} ${word}`.trim().length > max && line) {
      lines.push(line)
      line = word
    } else line = `${line} ${word}`.trim()
  }
  if (line) lines.push(line)
  return lines
}

function textLines(lines, x, y, size, lineHeight, anchor = "start") {
  return lines.map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" text-anchor="${anchor}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="700" fill="#fff">${xml(line)}</text>`).join("")
}

function layoutSvg(post, index) {
  const variant = index % 6
  const title = wrap(post.title, variant === 2 ? 22 : 27)
  const subtitle = wrap(post.subtitle, 39)
  const titleY = variant === 1 ? 205 : variant === 4 ? 780 : 850
  const titleX = variant === 2 ? 540 : 74
  const anchor = variant === 2 ? "middle" : "start"
  const panel = variant === 0
    ? '<rect x="40" y="715" width="1000" height="565" rx="26" fill="#102018" fill-opacity=".91"/>'
    : variant === 1
      ? '<rect x="0" y="0" width="1080" height="620" fill="#102018" fill-opacity=".88"/>'
      : variant === 2
        ? '<rect x="95" y="130" width="890" height="1090" rx="440" fill="#102018" fill-opacity=".72"/>'
        : variant === 3
          ? '<path d="M0 650 L1080 430 L1080 1350 L0 1350 Z" fill="#102018" fill-opacity=".9"/>'
          : variant === 4
            ? '<rect x="0" y="690" width="1080" height="660" fill="#102018" fill-opacity=".93"/>'
            : '<rect x="54" y="650" width="972" height="630" fill="#f4eee2" fill-opacity=".94"/><rect x="54" y="650" width="16" height="630" fill="#d8a84f"/>'
  const darkText = variant === 5
  const titleMarkup = darkText
    ? title.map((line, i) => `<text x="98" y="${800 + i * 82}" font-family="Arial, Helvetica, sans-serif" font-size="68" font-weight="700" fill="#17251d">${xml(line)}</text>`).join("")
    : textLines(title, titleX, titleY, 68, 82, anchor)
  const subY = darkText ? 800 + title.length * 82 + 46 : titleY + title.length * 82 + 42
  const subMarkup = subtitle.map((line, i) => `<text x="${darkText ? 98 : titleX}" y="${subY + i * 40}" text-anchor="${anchor}" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="400" fill="${darkText ? "#4c554f" : "#e9e4da"}">${xml(line)}</text>`).join("")
  return Buffer.from(`<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></linearGradient></defs>
    <rect width="1080" height="1350" fill="url(#shade)"/>
    ${panel}
    <text x="74" y="86" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="700" letter-spacing="4" fill="#fff">PHOTOVIEW.IO</text>
    <text x="1006" y="86" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#fff">14-DAY FREE TRIAL</text>
    ${titleMarkup}${subMarkup}
    <text x="${darkText ? 98 : titleX}" y="1240" text-anchor="${anchor}" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="700" letter-spacing="2" fill="${darkText ? "#9b6e20" : "#d8a84f"}">BUILD THE PORTFOLIO →</text>
  </svg>`)
}

function captionFor(title, subtitle, url, index) {
  const closers = [
    "Your photographs deserve a destination, not an expiration date.",
    "Curate the work. Control the presentation. Share it on purpose.",
    "The goal is not more content. It is a stronger place for the work to live.",
  ]
  return `${title}\n\n${subtitle}\n\n${closers[index % closers.length]}\n\nExplore PhotoView.io: ${url}\n\n#PhotographyPortfolio #PhotographerWebsite #PhotoViewIO #PhotographyBusiness`
}

await fs.mkdir(creativeDir, { recursive: true })
await fs.mkdir(reviewDir, { recursive: true })

const posts = []
for (const [index, [title, subtitle, contentId]] of concepts.entries()) {
  const date = new Date(campaignStart.getTime() + index * 24 * 60 * 60 * 1000)
  const landing = landingByIndex(index)
  const url = `https://photoview.io${hrefByLanding[landing]}?utm_source=organic_social&utm_medium=social&utm_campaign=photoview_30_day_launch&utm_content=${contentId}`
  const fileName = `${String(index + 1).padStart(2, "0")}-${contentId}.jpg`
  const imagePath = path.join(root, "public", "marketing-preview", images[index % images.length])
  await sharp(imagePath)
    .resize(1080, 1350, { fit: "cover" })
    .composite([{ input: layoutSvg({ subtitle, title }, index), top: 0, left: 0 }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(path.join(creativeDir, fileName))
  posts.push({
    id: `photoview-launch-${String(index + 1).padStart(2, "0")}`,
    approvalStatus: "DRAFT_FOR_APPROVAL",
    asset: `creative/${fileName}`,
    caption: captionFor(title, subtitle, url, index),
    contentId,
    destinationUrl: url,
    landingPage: hrefByLanding[landing],
    platforms: ["Instagram", "Facebook", "LinkedIn", "Pinterest"],
    scheduledAt: date.toISOString(),
    timezone: "America/New_York",
    title,
  })
}

await fs.writeFile(path.join(outputDir, "campaign-manifest.json"), `${JSON.stringify({
  approvalStatus: "DRAFT_FOR_APPROVAL",
  campaign: "PhotoView.io 30-Day Organic Validation",
  generatedAt: new Date().toISOString(),
  posts,
  publishingRule: "Do not publish until the campaign is approved.",
}, null, 2)}\n`)

const csv = [
  ["id", "scheduledAt", "platforms", "title", "asset", "destinationUrl", "approvalStatus"],
  ...posts.map((post) => [post.id, post.scheduledAt, post.platforms.join("|"), post.title, post.asset, post.destinationUrl, post.approvalStatus]),
].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")
await fs.writeFile(path.join(outputDir, "campaign-calendar.csv"), `${csv}\n`)

await fs.writeFile(path.join(outputDir, "asset-manifest.json"), `${JSON.stringify({
  assets: posts.map((post, index) => ({
    output: post.asset,
    source: `public/marketing-preview/${images[index % images.length]}`,
    sourceType: "existing PhotoView.io project asset",
    treatment: "Cropped to 1080x1350, darkened for legibility, and composited with deterministic campaign typography.",
  })),
  generator: "scripts/generate-photoview-launch-campaign.mjs",
  rightsNote: "This campaign reuses imagery already present in the PhotoView.io project. Confirm the project-level rights record before paid promotion.",
}, null, 2)}\n`)

const thumbs = await Promise.all(posts.map(async (post) => ({
  input: await sharp(path.join(outputDir, post.asset)).resize(216, 270).jpeg({ quality: 80 }).toBuffer(),
})))
await sharp({ create: { width: 1080, height: 2250, channels: 3, background: "#eee9df" } })
  .composite(thumbs.map((thumb, index) => ({ ...thumb, left: (index % 5) * 216, top: Math.floor(index / 5) * 375 })))
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(path.join(reviewDir, "campaign-contact-sheet.jpg"))

const cards = posts.map((post) => `<article><img src="../${post.asset}" alt="${xml(post.title)}"><div><strong>${xml(post.id)}</strong><time>${xml(post.scheduledAt)}</time><h2>${xml(post.title)}</h2><p>${xml(post.caption).replaceAll("\n", "<br>")}</p><a href="${xml(post.destinationUrl)}">Campaign destination</a></div></article>`).join("")
await fs.writeFile(path.join(reviewDir, "index.html"), `<!doctype html><html><head><meta charset="utf-8"><title>PhotoView.io 30-Day Campaign Review</title><style>body{font:16px Arial;background:#eee9df;color:#17251d;margin:0;padding:32px}header{max-width:1200px;margin:auto auto 32px}main{max-width:1200px;margin:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}article{background:white;border-radius:10px;overflow:hidden;box-shadow:0 5px 22px #0002}img{width:100%;display:block}article div{padding:20px}time{display:block;color:#766;margin:7px 0}h2{font-size:20px}p{font-size:14px;line-height:1.5}a{color:#8d6119}</style></head><body><header><p>PHOTOVIEW.IO</p><h1>30-Day Organic Campaign — Approval Review</h1><p>All 30 posts are drafts. Nothing in this package publishes until approved.</p></header><main>${cards}</main></body></html>`)

console.log(JSON.stringify({ contactSheet: path.join(reviewDir, "campaign-contact-sheet.jpg"), outputDir, posts: posts.length }, null, 2))
