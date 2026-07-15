#!/usr/bin/env node

import { readFile, readdir, stat, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const SUPPORTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".tif", ".tiff"])
const DEFAULT_INTERVAL_MS = 5000
const STATE_FILE = ".photoviewpro-uploaded.json"

const options = parseArgs(process.argv.slice(2))

if (!options.folder || !options.apiUrl) {
  printUsage()
  process.exit(1)
}

const folder = path.resolve(expandHomeDir(options.folder))
const apiBaseUrl = normalizeBaseUrl(options.apiUrl)
const endpoint = `${apiBaseUrl}/api/import/photos`
const intervalMs = Number.isFinite(options.intervalMs) ? Math.max(options.intervalMs, 1000) : DEFAULT_INTERVAL_MS

console.log("PhotoView.io desktop uploader")
console.log(`Folder: ${folder}`)
console.log(`Endpoint: ${endpoint}`)
console.log(`Gallery: ${options.galleryName}`)
console.log(options.once ? "Mode: one scan" : `Mode: watching every ${intervalMs / 1000}s`)

const uploadedState = await loadState(folder)

await scanAndUpload()

if (!options.once) {
  setInterval(() => {
    scanAndUpload().catch((error) => {
      console.error(`Scan failed: ${error instanceof Error ? error.message : String(error)}`)
    })
  }, intervalMs)
}

async function scanAndUpload() {
  const files = await listImageFiles(folder)

  for (const filePath of files) {
    const stats = await stat(filePath)
    const key = stateKey(filePath, stats.size, stats.mtimeMs)

    if (uploadedState.uploaded[key]) {
      continue
    }

    if (!(await isStable(filePath, stats.size))) {
      continue
    }

    try {
      const result = await uploadFile(filePath)
      uploadedState.uploaded[key] = {
        uploadedAt: new Date().toISOString(),
        url: result.photo?.url ?? "",
      }
      await saveState(folder, uploadedState)
      console.log(`Uploaded ${path.basename(filePath)} -> ${result.photo?.url ?? "PhotoView.io"}`)
    } catch (error) {
      console.error(`Could not upload ${path.basename(filePath)}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

async function uploadFile(filePath) {
  const fileName = path.basename(filePath)
  const fileBuffer = await readFile(filePath)
  const file = new Blob([fileBuffer], { type: contentTypeForFile(fileName) })
  const formData = new FormData()

  formData.append("galleryName", options.galleryName)
  formData.append("gallerySlug", slugify(options.galleryName))
  formData.append("clientName", options.clientName)
  formData.append("makePublic", String(options.makePublic))
  formData.append("originalFileName", fileName)
  formData.append("photoTitle", path.parse(fileName).name)
  formData.append("file", file, fileName)

  const response = await fetch(endpoint, {
    method: "POST",
    headers: options.apiKey ? { "x-photoviewpro-key": options.apiKey } : undefined,
    body: formData,
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(result.error ?? `HTTP ${response.status}`)
  }

  return result
}

async function listImageFiles(rootFolder) {
  const entries = await readdir(rootFolder, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.name === STATE_FILE || entry.name.startsWith(".")) {
      continue
    }

    const entryPath = path.join(rootFolder, entry.name)

    if (entry.isDirectory() && options.recursive) {
      files.push(...await listImageFiles(entryPath))
      continue
    }

    if (entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(entryPath)
    }
  }

  return files.sort()
}

async function isStable(filePath, firstSize) {
  await new Promise((resolve) => setTimeout(resolve, 750))
  const secondStats = await stat(filePath)
  return secondStats.size === firstSize
}

async function loadState(rootFolder) {
  try {
    const state = JSON.parse(await readFile(path.join(rootFolder, STATE_FILE), "utf8"))
    return { uploaded: state.uploaded ?? {} }
  } catch {
    return { uploaded: {} }
  }
}

async function saveState(rootFolder, state) {
  await writeFile(path.join(rootFolder, STATE_FILE), `${JSON.stringify(state, null, 2)}\n`)
}

function parseArgs(args) {
  const parsed = {
    apiKey: process.env.PHOTOVIEWPRO_IMPORT_API_KEY ?? "",
    apiUrl: process.env.PHOTOVIEWPRO_API_URL ?? "",
    clientName: process.env.PHOTOVIEWPRO_CLIENT_NAME ?? "",
    folder: process.env.PHOTOVIEWPRO_WATCH_FOLDER ?? "",
    galleryName: process.env.PHOTOVIEWPRO_GALLERY_NAME ?? "Desktop Uploads",
    intervalMs: DEFAULT_INTERVAL_MS,
    makePublic: process.env.PHOTOVIEWPRO_MAKE_PUBLIC === "true",
    once: false,
    recursive: false,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    switch (arg) {
      case "--api-key":
        parsed.apiKey = args[++index] ?? ""
        break
      case "--api-url":
        parsed.apiUrl = args[++index] ?? ""
        break
      case "--client":
        parsed.clientName = args[++index] ?? ""
        break
      case "--folder":
        parsed.folder = args[++index] ?? ""
        break
      case "--gallery":
        parsed.galleryName = args[++index] ?? "Desktop Uploads"
        break
      case "--interval":
        parsed.intervalMs = Number(args[++index]) * 1000
        break
      case "--once":
        parsed.once = true
        break
      case "--public":
        parsed.makePublic = true
        break
      case "--recursive":
        parsed.recursive = true
        break
      default:
        if (arg.startsWith("--")) {
          throw new Error(`Unknown option: ${arg}`)
        }
    }
  }

  return parsed
}

function printUsage() {
  console.log(`
Usage:
  npm run photoviewpro:watch -- --folder ~/Pictures/PhotoView-Exports --api-url https://your-site.com --api-key YOUR_KEY --gallery "Travel Portfolio"

Options:
  --folder       Folder to watch for exported images
  --api-url      PhotoView.io base URL, for example https://photoview.io
  --api-key      Optional import key matching PHOTOVIEWPRO_IMPORT_API_KEY
  --gallery      Gallery/portfolio name to create or append to
  --client       Optional client or project name
  --public       Mark imported gallery intent as public
  --recursive    Include image files in nested folders
  --once         Scan once and exit
  --interval     Watch interval in seconds; default 5
`)
}

function normalizeBaseUrl(value) {
  return value.trim().replace(/\/+$/, "")
}

function expandHomeDir(value) {
  if (value === "~") {
    return os.homedir()
  }

  if (value.startsWith("~/")) {
    return path.join(os.homedir(), value.slice(2))
  }

  return value
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "") || "desktop-uploads"
}

function stateKey(filePath, size, mtimeMs) {
  return `${path.resolve(filePath)}:${size}:${Math.round(mtimeMs)}`
}

function contentTypeForFile(fileName) {
  switch (path.extname(fileName).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg"
    case ".png":
      return "image/png"
    case ".webp":
      return "image/webp"
    case ".heic":
      return "image/heic"
    case ".heif":
      return "image/heif"
    case ".tif":
    case ".tiff":
      return "image/tiff"
    default:
      return "application/octet-stream"
  }
}
