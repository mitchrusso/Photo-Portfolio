import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { assertPhotoStorageConfigured, uploadPhotoObject } from "./photo-storage.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, "..")
const oauthStatePath = path.join(rootDir, ".smugmug-oauth.json")
const defaultManifestPath = path.join(rootDir, "exports", "smugmug", "travel-manifest.json")
const defaultBlobManifestPath = path.join(rootDir, "exports", "smugmug", "travel-blob-manifest.json")

loadEnvFile(path.join(rootDir, ".env"))
loadEnvFile(path.join(rootDir, ".env.local"))

const SMUGMUG_API_BASE = "https://api.smugmug.com"
const REQUEST_TOKEN_URL = `${SMUGMUG_API_BASE}/services/oauth/1.0a/getRequestToken`
const AUTHORIZE_URL = `${SMUGMUG_API_BASE}/services/oauth/1.0a/authorize`
const ACCESS_TOKEN_URL = `${SMUGMUG_API_BASE}/services/oauth/1.0a/getAccessToken`

const sizeRank = [
  "ImageSizeTiny",
  "ImageSizeThumb",
  "ImageSizeSmall",
  "ImageSizeMedium",
  "ImageSizeLarge",
  "ImageSizeXLarge",
  "ImageSizeX2Large",
  "ImageSizeX3Large",
  "ImageSizeX4Large",
  "ImageSizeX5Large",
  "ImageSize4K",
  "ImageSize5K",
  "ImageSizeOriginal",
]

const command = process.argv[2] ?? "help"

try {
  if (command === "public-scan") {
    const nickname = process.argv[3] ?? "lenstraveler18"
    const folderPath = process.argv[4] ?? "/Travel"
    await publicScan(nickname, folderPath)
  } else if (command === "authorize") {
    await authorize()
  } else if (command === "access-token") {
    await accessToken(process.argv[3])
  } else if (command === "private-scan") {
    const nickname = process.argv[3] ?? "lenstraveler18"
    const folderPath = process.argv[4] ?? "/Travel"
    await privateScan(nickname, folderPath)
  } else if (command === "manifest") {
    const nickname = process.argv[3] ?? "lenstraveler18"
    const folderPath = process.argv[4] ?? "/Travel"
    const outputPath = process.argv[5] ? path.resolve(process.argv[5]) : defaultManifestPath
    await writeManifest(nickname, folderPath, outputPath)
  } else if (command === "upload-to-blob") {
    const manifestPath = process.argv[3] ? path.resolve(process.argv[3]) : defaultManifestPath
    const outputPath = process.argv[4] ? path.resolve(process.argv[4]) : defaultBlobManifestPath
    await uploadManifestToBlob(manifestPath, outputPath)
  } else {
    printHelp()
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

function printHelp() {
  console.log(`SmugMug migration utility

Usage:
  npm run smugmug:public-scan -- [nickname] [folderPath]
  npm run smugmug:authorize
  npm run smugmug:access-token -- <six_digit_verifier>
  npm run smugmug:private-scan -- [nickname] [folderPath]
  npm run smugmug:manifest -- [nickname] [folderPath] [outputPath]
  npm run smugmug:upload-to-blob -- [manifestPath] [outputPath]

Examples:
  npm run smugmug:public-scan -- lenstraveler18 /Travel
  npm run smugmug:authorize
  npm run smugmug:access-token -- 123456
  npm run smugmug:private-scan -- lenstraveler18 /Travel
  npm run smugmug:manifest -- lenstraveler18 /Travel
  npm run smugmug:upload-to-blob
`)
}

async function publicScan(nickname, folderPath) {
  const apiKey = requireEnv("SMUGMUG_API_KEY")
  const albums = await getAlbumsFromFolder(nickname, folderPath, { apiKey })
  const summary = await summarizeAlbums(albums, { apiKey })
  printSummary("Public API scan", summary)
}

async function privateScan(nickname, folderPath) {
  const oauth = getSmugMugOAuth()
  const albums = await getAlbumsFromFolder(nickname, folderPath, { oauth })
  const summary = await summarizeAlbums(albums, { oauth })
  printSummary("Authorized API scan", summary)
}

function getSmugMugOAuth() {
  const consumerKey = requireEnv("SMUGMUG_API_KEY")
  const consumerSecret = requireEnv("SMUGMUG_API_SECRET")
  const token = requireEnv("SMUGMUG_ACCESS_TOKEN")
  const tokenSecret = requireEnv("SMUGMUG_ACCESS_TOKEN_SECRET")
  return { consumerKey, consumerSecret, token, tokenSecret }
}

async function writeManifest(nickname, folderPath, outputPath) {
  const oauth = getSmugMugOAuth()
  const albums = await getAlbumsFromFolder(nickname, folderPath, { oauth })
  const manifest = {
    source: {
      nickname,
      folderPath,
      generatedAt: new Date().toISOString(),
    },
    albums: [],
  }

  for (const album of albums) {
    const albumPayload = await apiGet(album.albumUri, { oauth })
    const albumData = albumPayload.Response?.Album
    const imageUri = albumData?.Uris?.AlbumImages?.Uri
    const images = imageUri ? await collectPages(imageUri, { oauth, query: { count: "100" } }) : []
    const manifestAlbum = {
      name: albumData?.Name ?? album.name,
      albumKey: albumData?.AlbumKey ?? null,
      nodeId: album.nodeId,
      webUri: album.webUri,
      imageCount: albumData?.ImageCount ?? images.length,
      images: [],
    }

    for (const image of images) {
      const details = image.Uris?.ImageSizeDetails?.Uri
        ? (await apiGet(image.Uris.ImageSizeDetails.Uri, { oauth })).Response?.ImageSizeDetails
        : null
      const bestSize = pickBestSize(details)

      manifestAlbum.images.push({
        fileName: image.FileName,
        title: image.Title || image.Caption || image.FileName,
        caption: image.Caption || "",
        imageKey: image.ImageKey,
        webUri: image.WebUri,
        width: image.OriginalWidth ?? bestSize?.width ?? null,
        height: image.OriginalHeight ?? bestSize?.height ?? null,
        bestAvailableSize: bestSize?.name ?? null,
        bestAvailableUrl: bestSize?.url ?? null,
        thumbnailUrl: image.ThumbnailUrl ?? null,
        md5: image.MD5 ?? null,
      })
    }

    manifest.albums.push(manifestAlbum)
    console.log(`Mapped ${manifestAlbum.images.length} images from ${manifestAlbum.name}`)
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`)

  const totalImages = manifest.albums.reduce((sum, album) => sum + album.images.length, 0)
  const originals = manifest.albums.reduce(
    (sum, album) => sum + album.images.filter((image) => image.bestAvailableSize === "ImageSizeOriginal").length,
    0,
  )

  console.log("")
  console.log(`Wrote ${manifest.albums.length} albums and ${totalImages} images to ${outputPath}`)
  console.log(`${originals} images expose ImageSizeOriginal through authorized SmugMug access.`)
}

async function uploadManifestToBlob(manifestPath, outputPath) {
  assertPhotoStorageConfigured()

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing manifest file: ${manifestPath}`)
  }

  const sourceManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  const existingOutput = fs.existsSync(outputPath)
    ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
    : null
  const uploadedByKey = new Map()

  for (const album of existingOutput?.albums ?? []) {
    for (const image of album.images ?? []) {
      if (image.blobUrl && image.imageKey) {
        uploadedByKey.set(image.imageKey, image)
      }
    }
  }

  const outputManifest = {
    source: sourceManifest.source,
    generatedAt: new Date().toISOString(),
    albums: [],
  }

  let uploaded = 0
  let skipped = 0
  let failed = 0
  let bytesUploaded = 0

  for (const album of sourceManifest.albums ?? []) {
    const outputAlbum = {
      name: album.name,
      albumKey: album.albumKey,
      nodeId: album.nodeId,
      webUri: album.webUri,
      imageCount: album.imageCount,
      images: [],
    }

    for (const image of album.images ?? []) {
      const existingImage = uploadedByKey.get(image.imageKey)

      if (existingImage) {
        outputAlbum.images.push(existingImage)
        skipped += 1
        continue
      }

      if (!image.bestAvailableUrl) {
        outputAlbum.images.push({ ...image, migrationStatus: "missing-source-url" })
        failed += 1
        continue
      }

      try {
        const response = await fetch(image.bestAvailableUrl)

        if (!response.ok) {
          throw new Error(`download failed ${response.status}`)
        }

        const contentType = response.headers.get("content-type") ?? guessContentType(image.fileName)
        const bytes = new Uint8Array(await response.arrayBuffer())
        const blobPath = getBlobPath(album, image)
        const blob = await uploadPhotoObject(blobPath, bytes, {
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType,
        })
        const migratedImage = {
          ...image,
          blobPath,
          blobUrl: blob.url,
          blobDownloadUrl: blob.downloadUrl,
          uploadedBytes: bytes.byteLength,
          migrationStatus: "uploaded",
        }

        outputAlbum.images.push(migratedImage)
        uploaded += 1
        bytesUploaded += bytes.byteLength
        console.log(`Uploaded ${uploaded}: ${album.name} / ${image.fileName} (${formatBytes(bytes.byteLength)})`)
      } catch (error) {
        failed += 1
        outputAlbum.images.push({
          ...image,
          migrationStatus: "failed",
          migrationError: error instanceof Error ? error.message : String(error),
        })
        console.log(`Failed: ${album.name} / ${image.fileName}`)
      }

      writeBlobManifest(outputPath, outputManifest, outputAlbum)
    }

    outputManifest.albums.push(outputAlbum)
    writeBlobManifest(outputPath, outputManifest)
  }

  const totalImages = outputManifest.albums.reduce((sum, album) => sum + album.images.length, 0)
  const totalBlobImages = outputManifest.albums.reduce(
    (sum, album) => sum + album.images.filter((image) => image.blobUrl).length,
    0,
  )

  console.log("")
  console.log(`Wrote Blob manifest to ${outputPath}`)
  console.log(`Images: ${totalImages}. Blob-backed: ${totalBlobImages}. Uploaded: ${uploaded}. Skipped: ${skipped}. Failed: ${failed}.`)
  console.log(`Uploaded this run: ${formatBytes(bytesUploaded)}`)
}

function writeBlobManifest(outputPath, outputManifest, activeAlbum) {
  const manifest = activeAlbum
    ? {
        ...outputManifest,
        albums: [
          ...outputManifest.albums,
          activeAlbum,
        ],
      }
    : outputManifest

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

async function authorize() {
  const consumerKey = requireEnv("SMUGMUG_API_KEY")
  const consumerSecret = requireEnv("SMUGMUG_API_SECRET")
  const response = await signedFetch(REQUEST_TOKEN_URL, {
    oauth: { consumerKey, consumerSecret },
    oauthParams: { oauth_callback: "oob" },
  })
  const body = await response.text()

  if (!response.ok) {
    throw new Error(`Request token failed (${response.status}): ${body}`)
  }

  const params = new URLSearchParams(body)
  const token = params.get("oauth_token")
  const tokenSecret = params.get("oauth_token_secret")

  if (!token || !tokenSecret) {
    throw new Error(`SmugMug did not return a request token: ${body}`)
  }

  fs.writeFileSync(
    oauthStatePath,
    JSON.stringify({ token, tokenSecret, createdAt: new Date().toISOString() }, null, 2),
  )

  const authUrl = new URL(AUTHORIZE_URL)
  authUrl.searchParams.set("oauth_token", token)
  authUrl.searchParams.set("Access", "Full")
  authUrl.searchParams.set("Permissions", "Read")

  console.log("Open this URL, approve access, then copy the six-digit verifier:")
  console.log(authUrl.toString())
  console.log("")
  console.log("Then run:")
  console.log("npm run smugmug:access-token -- <six_digit_verifier>")
}

async function accessToken(verifier) {
  if (!verifier) {
    throw new Error("Missing six-digit verifier. Run: npm run smugmug:access-token -- <code>")
  }

  const state = JSON.parse(fs.readFileSync(oauthStatePath, "utf8"))
  const consumerKey = requireEnv("SMUGMUG_API_KEY")
  const consumerSecret = requireEnv("SMUGMUG_API_SECRET")
  const response = await signedFetch(ACCESS_TOKEN_URL, {
    oauth: {
      consumerKey,
      consumerSecret,
      token: state.token,
      tokenSecret: state.tokenSecret,
    },
    oauthParams: { oauth_verifier: verifier },
  })
  const body = await response.text()

  if (!response.ok) {
    throw new Error(`Access token failed (${response.status}): ${body}`)
  }

  const params = new URLSearchParams(body)
  const token = params.get("oauth_token")
  const tokenSecret = params.get("oauth_token_secret")

  if (!token || !tokenSecret) {
    throw new Error(`SmugMug did not return an access token: ${body}`)
  }

  upsertEnvFile(path.join(rootDir, ".env.local"), {
    SMUGMUG_ACCESS_TOKEN: token,
    SMUGMUG_ACCESS_TOKEN_SECRET: tokenSecret,
  })
  fs.rmSync(oauthStatePath, { force: true })

  console.log("Saved SmugMug access token values to .env.local.")
  console.log("You can now run: npm run smugmug:private-scan -- lenstraveler18 /Travel")
}

async function getAlbumsFromFolder(nickname, folderPath, auth) {
  const folder = await apiGet(`/api/v2/folder/user/${nickname}${folderPath}`, auth)
  const nodeUri = folder.Response?.Folder?.Uris?.Node?.Uri

  if (!nodeUri) {
    throw new Error(`Could not find a SmugMug node for ${nickname}${folderPath}`)
  }

  const nodes = await collectPages(`${nodeUri}!children`, {
    ...auth,
    query: {
      Type: "Album",
      SortMethod: "Organizer",
      SortDirection: "Ascending",
      count: "100",
    },
  })

  return nodes.map((node) => ({
    name: node.Name,
    nodeId: node.NodeID,
    webUri: node.WebUri,
    albumUri: node.Uris?.Album?.Uri,
  })).filter((album) => album.albumUri)
}

async function summarizeAlbums(albums, auth) {
  const summary = []

  for (const album of albums) {
    const albumPayload = await apiGet(album.albumUri, auth)
    const albumData = albumPayload.Response?.Album
    const imageUri = albumData?.Uris?.AlbumImages?.Uri
    const images = imageUri ? await collectPages(imageUri, { ...auth, query: { count: "100" } }) : []
    const firstImage = images[0]
    const firstSizeDetails = firstImage?.Uris?.ImageSizeDetails?.Uri
      ? await apiGet(firstImage.Uris.ImageSizeDetails.Uri, auth)
      : null
    const details = firstSizeDetails?.Response?.ImageSizeDetails
    const bestSize = pickBestSize(details)

    summary.push({
      name: albumData?.Name ?? album.name,
      webUri: album.webUri,
      imageCount: albumData?.ImageCount ?? images.length,
      discoveredImages: images.length,
      firstFile: firstImage?.FileName ?? null,
      bestAvailableSize: bestSize?.name ?? null,
      bestAvailableUrl: bestSize?.url ?? null,
      bestAvailableDimensions: bestSize ? `${bestSize.width}x${bestSize.height}` : null,
    })
  }

  return summary
}

function printSummary(label, summary) {
  const totalImages = summary.reduce((sum, album) => sum + Number(album.imageCount ?? 0), 0)
  console.log(`${label}: ${summary.length} albums, ${totalImages} images`)
  console.table(summary.map((album) => ({
    album: album.name,
    images: album.imageCount,
    discovered: album.discoveredImages,
    firstFile: album.firstFile,
    bestSize: album.bestAvailableSize,
    dimensions: album.bestAvailableDimensions,
  })))
}

async function collectPages(uri, auth) {
  const items = []
  let nextUri = uri
  let guard = 0

  while (nextUri && guard < 50) {
    const payload = await apiGet(nextUri, auth)
    const response = payload.Response ?? {}
    const key = Object.keys(response).find((name) => Array.isArray(response[name]))
    const pageItems = key ? response[key] : []
    items.push(...pageItems)
    nextUri = response.Pages?.NextPage ?? null
    guard += 1
  }

  return items
}

async function apiGet(uri, auth) {
  const url = new URL(uri.startsWith("http") ? uri : `${SMUGMUG_API_BASE}${uri}`)
  for (const [key, value] of Object.entries(auth.query ?? {})) {
    url.searchParams.set(key, value)
  }

  if (auth.apiKey) {
    url.searchParams.set("APIKey", auth.apiKey)
    const response = await fetch(url, { headers: { Accept: "application/json" } })
    return parseJsonResponse(response, url)
  }

  const response = await signedFetch(url.toString(), { oauth: auth.oauth })
  return parseJsonResponse(response, url)
}

async function parseJsonResponse(response, url) {
  const text = await response.text()

  if (!response.ok) {
    throw new Error(`SmugMug API failed (${response.status}) for ${redactUrl(url)}: ${text}`)
  }

  return JSON.parse(text)
}

async function signedFetch(url, { oauth, oauthParams = {} }) {
  const requestUrl = new URL(url)
  const method = "GET"
  const oauthHeaderParams = {
    oauth_consumer_key: oauth.consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
    ...oauthParams,
  }

  if (oauth.token) {
    oauthHeaderParams.oauth_token = oauth.token
  }

  oauthHeaderParams.oauth_signature = signOAuthRequest({
    method,
    url: requestUrl,
    oauthParams: oauthHeaderParams,
    consumerSecret: oauth.consumerSecret,
    tokenSecret: oauth.tokenSecret,
  })

  return fetch(requestUrl, {
    headers: {
      Accept: "application/json",
      Authorization: `OAuth ${Object.entries(oauthHeaderParams)
        .map(([key, value]) => `${rfc3986(key)}="${rfc3986(value)}"`)
        .join(", ")}`,
    },
  })
}

function signOAuthRequest({ method, url, oauthParams, consumerSecret, tokenSecret = "" }) {
  const params = []

  for (const [key, value] of url.searchParams.entries()) {
    params.push([key, value])
  }

  for (const [key, value] of Object.entries(oauthParams)) {
    if (key !== "oauth_signature") {
      params.push([key, value])
    }
  }

  params.sort(([aKey, aValue], [bKey, bValue]) => {
    const encodedAKey = rfc3986(aKey)
    const encodedBKey = rfc3986(bKey)
    const encodedAValue = rfc3986(aValue)
    const encodedBValue = rfc3986(bValue)

    if (encodedAKey === encodedBKey) {
      return encodedAValue < encodedBValue ? -1 : encodedAValue > encodedBValue ? 1 : 0
    }

    return encodedAKey < encodedBKey ? -1 : 1
  })

  const normalizedParams = params
    .map(([key, value]) => `${rfc3986(key)}=${rfc3986(value)}`)
    .join("&")
  const baseUrl = `${url.protocol}//${url.host}${url.pathname}`
  const baseString = [
    method.toUpperCase(),
    rfc3986(baseUrl),
    rfc3986(normalizedParams),
  ].join("&")
  const signingKey = `${rfc3986(consumerSecret)}&${rfc3986(tokenSecret)}`

  return crypto.createHmac("sha1", signingKey).update(baseString).digest("base64")
}

function pickBestSize(details) {
  if (!details) return null

  const usableSizes = details.UsableSizes ?? []
  const bestName = usableSizes
    .slice()
    .sort((a, b) => sizeRank.indexOf(b) - sizeRank.indexOf(a))[0]
  const best = bestName ? details[bestName] : null

  if (!best?.Url) return null

  return {
    name: bestName,
    url: best.Url,
    width: best.Width,
    height: best.Height,
  }
}

function getBlobPath(album, image) {
  const albumSlug = slugifyPath(album.name || album.nodeId || "album")
  const imageKey = slugifyPath(image.imageKey || path.parse(image.fileName || "image").name)
  const fileName = slugifyFileName(image.fileName || `${imageKey}.jpg`)

  return `smugmug/${albumSlug}/${imageKey}-${fileName}`
}

function slugifyPath(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item"
}

function slugifyFileName(value) {
  const parsed = path.parse(String(value))
  const name = slugifyPath(parsed.name)
  const ext = parsed.ext.toLowerCase().replace(/[^a-z0-9.]/g, "") || ".jpg"

  return `${name}${ext}`
}

function guessContentType(fileName) {
  const extension = path.extname(fileName || "").toLowerCase()

  if (extension === ".png") return "image/png"
  if (extension === ".webp") return "image/webp"
  if (extension === ".gif") return "image/gif"
  if (extension === ".tif" || extension === ".tiff") return "image/tiff"
  if (extension === ".dng") return "image/x-adobe-dng"

  return "image/jpeg"
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"

  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue
    const index = trimmed.indexOf("=")
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "")
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

function upsertEnvFile(filePath, values) {
  const lines = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8").split(/\r?\n/) : []
  const nextLines = lines.filter((line) => {
    const key = line.split("=")[0]?.trim()
    return !Object.prototype.hasOwnProperty.call(values, key)
  })

  for (const [key, value] of Object.entries(values)) {
    nextLines.push(`${key}=${value}`)
  }

  fs.writeFileSync(filePath, `${nextLines.filter(Boolean).join("\n")}\n`)
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local.`)
  }

  return value
}

function rfc3986(value) {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
}

function redactUrl(url) {
  const copy = new URL(url)
  if (copy.searchParams.has("APIKey")) {
    copy.searchParams.set("APIKey", "<redacted>")
  }
  return copy.toString()
}
