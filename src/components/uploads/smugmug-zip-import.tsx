"use client"

import { BlobReader, BlobWriter, type Entry, ZipReader } from "@zip.js/zip.js"
import { Archive, Check, Loader2, Upload, X } from "lucide-react"
import { useRef, useState } from "react"
import type { PortfolioGallery } from "@/lib/gallery-utils"
import { uploadPhotoFromClient } from "@/lib/client-photo-upload"
import {
  portfolioNameFromSmugMugZip,
  smugMugZipEntryKind,
  smugMugZipPhotoContentType,
  validateSmugMugZipEntries,
} from "@/lib/smugmug-zip-import"

type ImportState = "idle" | "review" | "importing" | "done" | "error"

type SmugMugZipImportProps = {
  existingPortfolioIds: string[]
  fallbackCover: string
  onImported: () => Promise<void>
}

type ReviewedArchive = {
  entries: Entry[]
  file: File
  photoCount: number
  reader: ZipReader<Blob>
  skippedFiles: number
  skippedVideos: number
}

function slugifyPortfolioName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

function basename(pathname: string) {
  return pathname.replace(/\\/g, "/").split("/").at(-1) || "photo"
}

export function SmugMugZipImport({ existingPortfolioIds, fallbackCover, onImported }: SmugMugZipImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [archive, setArchive] = useState<ReviewedArchive | null>(null)
  const [portfolioName, setPortfolioName] = useState("")
  const [state, setState] = useState<ImportState>("idle")
  const [message, setMessage] = useState("Choose one gallery ZIP downloaded from SmugMug.")
  const [progress, setProgress] = useState({ completed: 0, failed: 0, total: 0 })

  async function clearArchive() {
    await archive?.reader.close().catch(() => undefined)
    setArchive(null)
    setPortfolioName("")
    setProgress({ completed: 0, failed: 0, total: 0 })
    setState("idle")
    setMessage("Choose one gallery ZIP downloaded from SmugMug.")
    if (inputRef.current) inputRef.current.value = ""
  }

  async function reviewArchive(file?: File) {
    if (!file || state === "importing") return
    await archive?.reader.close().catch(() => undefined)
    setArchive(null)
    setState("idle")
    setMessage("Checking the ZIP safely before import…")

    if (!file.name.toLowerCase().endsWith(".zip")) {
      setState("error")
      setMessage("Choose a .zip gallery downloaded from SmugMug.")
      return
    }

    const reader = new ZipReader(new BlobReader(file), {
      checkLocalDirectory: true,
      checkLocalFilename: true,
      checkOverlappingEntry: true,
      strictness: "strict",
    })

    try {
      const entries = await reader.getEntries()
      const summary = validateSmugMugZipEntries(entries)
      setArchive({ entries, file, reader, ...summary })
      setPortfolioName(portfolioNameFromSmugMugZip(file.name))
      setProgress({ completed: 0, failed: 0, total: summary.photoCount })
      setState("review")
      setMessage(`${summary.photoCount.toLocaleString()} supported ${summary.photoCount === 1 ? "photo" : "photos"} ready to import.`)
    } catch (error) {
      await reader.close().catch(() => undefined)
      setState("error")
      setMessage(error instanceof Error ? error.message : "This ZIP could not be read safely.")
    }
  }

  async function importArchive() {
    const name = portfolioName.trim()
    if (!archive || !name || state === "importing") return

    const baseId = slugifyPortfolioName(name) || `smugmug-${Date.now()}`
    const galleryId = existingPortfolioIds.includes(baseId) ? `${baseId}-${Date.now()}` : baseId
    const gallery: PortfolioGallery = {
      allowDownloads: true,
      client: "Personal",
      cover: fallbackCover,
      description: "Imported from a SmugMug gallery ZIP. Review the cover, order, captions, and visibility before publishing.",
      embedEnabled: true,
      favorites: 0,
      id: galleryId,
      images: 0,
      infoPaneEnabled: false,
      name,
      photoLabelMode: "caption",
      photos: [],
      privacy: "Private link",
      revenue: "$0",
      showFileNames: false,
      status: "Draft",
      watermarkEnabled: false,
      watermarkMode: "text",
      watermarkOpacity: 55,
      watermarkPosition: "bottom-right",
      watermarkSize: 140,
      watermarkText: "PhotoView.io",
    }

    setState("importing")
    setProgress({ completed: 0, failed: 0, total: archive.photoCount })
    setMessage("Creating a private PhotoView portfolio…")

    try {
      const create = await fetch("/api/portfolio/galleries", {
        body: JSON.stringify({ galleries: [gallery] }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const createPayload = await create.json().catch(() => null) as { error?: string } | null
      if (!create.ok) throw new Error(createPayload?.error || "The PhotoView portfolio could not be created.")

      let completed = 0
      let failed = 0
      const photoEntries = archive.entries.filter((entry) => !entry.directory && smugMugZipEntryKind(entry.filename) === "photo")

      for (const [index, entry] of photoEntries.entries()) {
        const fileName = basename(entry.filename)
        setMessage(`Importing ${index + 1} of ${photoEntries.length}: ${fileName}`)
        try {
          if (!("getData" in entry)) throw new Error("The ZIP entry cannot be read.")
          const contentType = smugMugZipPhotoContentType(fileName)
          const blob = await entry.getData(new BlobWriter(contentType), {
            checkCrc32: true,
            checkLocalDirectory: true,
            checkLocalFilename: true,
            checkOverlappingEntry: true,
            strictness: "strict",
          })
          const photo = new File([blob], fileName, { lastModified: entry.lastModDate.getTime(), type: contentType })
          const extension = fileName.split(".").pop()?.toLowerCase() || "jpg"
          const safeName = slugifyPortfolioName(fileName.replace(/\.[^/.]+$/, "")) || `smugmug-photo-${index + 1}`
          await uploadPhotoFromClient(
            `smugmug-zip/${galleryId}/${String(index + 1).padStart(4, "0")}-${safeName}.${extension}`,
            photo,
            { galleryId, title: fileName.replace(/\.[^/.]+$/, "") },
          )
          completed += 1
        } catch {
          failed += 1
        }
        setProgress({ completed, failed, total: photoEntries.length })
      }

      await onImported()
      await archive.reader.close().catch(() => undefined)
      setArchive(null)
      setState(failed === photoEntries.length ? "error" : "done")
      setMessage(
        failed === 0
          ? `${completed.toLocaleString()} ${completed === 1 ? "photo" : "photos"} imported into the private “${name}” portfolio.`
          : `${completed.toLocaleString()} imported; ${failed.toLocaleString()} could not be imported. Successful photos were kept.`,
      )
      if (inputRef.current) inputRef.current.value = ""
    } catch (error) {
      await onImported().catch(() => undefined)
      setState("error")
      setMessage(error instanceof Error ? error.message : "The SmugMug ZIP could not be imported.")
    }
  }

  return (
    <div className="mt-4 rounded-md border border-[#d8a84f]/45 bg-[#fffdf8] p-5 text-[#2f2b25]">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#1f2a24] text-white">
          <Archive className="size-5" />
        </span>
        <div>
          <h3 className="text-base font-semibold">Import a SmugMug gallery ZIP</h3>
          <p className="mt-1 text-sm leading-6 text-[#6f685d]">
            Download a gallery from SmugMug, then choose its ZIP here. PhotoView creates a private portfolio and imports its photos. Videos are skipped, and nothing stays synchronized with SmugMug.
          </p>
        </div>
      </div>

      <ol className="mt-4 grid gap-2 text-sm leading-6 text-[#625d54] sm:grid-cols-3">
        <li><strong className="text-[#2f2b25]">1.</strong> In SmugMug, open the gallery and choose Download.</li>
        <li><strong className="text-[#2f2b25]">2.</strong> Save the ZIP when SmugMug emails the download link.</li>
        <li><strong className="text-[#2f2b25]">3.</strong> Choose that ZIP below and start the import.</li>
      </ol>

      {!archive && state !== "done" ? (
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[#cfc6b8] bg-white px-4 py-7 text-center">
          <span className="flex size-10 items-center justify-center rounded-md bg-[#1f2a24] text-white">
            <Upload className="size-5" />
          </span>
          <span className="mt-3 text-sm font-semibold">Choose a SmugMug ZIP</span>
          <span className="mt-1 text-xs text-[#777064]">JPEG, PNG, WebP, HEIC, HEIF, and TIFF photos are supported.</span>
          <input
            ref={inputRef}
            accept=".zip,application/zip,application/x-zip-compressed"
            className="sr-only"
            onChange={(event) => void reviewArchive(event.target.files?.[0])}
            type="file"
          />
        </label>
      ) : null}

      {archive && (
        <div className="mt-4 rounded-md border border-[#e5ded2] bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" title={archive.file.name}>{archive.file.name}</p>
              <p className="mt-1 text-xs leading-5 text-[#777064]">
                {archive.photoCount.toLocaleString()} photos · {archive.skippedVideos.toLocaleString()} videos skipped · {archive.skippedFiles.toLocaleString()} other files skipped
              </p>
            </div>
            <button
              aria-label="Choose a different ZIP"
              className="rounded-md border border-[#d7d0c4] p-2 disabled:opacity-50"
              disabled={state === "importing"}
              onClick={() => void clearArchive()}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>

          <label className="mt-4 grid gap-2 text-sm font-medium">
            New PhotoView portfolio name
            <input
              className="h-10 rounded-md border border-[#d7d0c4] px-3 font-normal outline-none focus:border-[#b08336]"
              disabled={state === "importing"}
              maxLength={120}
              onChange={(event) => setPortfolioName(event.target.value)}
              value={portfolioName}
            />
          </label>

          <button
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
            disabled={!portfolioName.trim() || state === "importing"}
            onClick={() => void importArchive()}
            type="button"
          >
            {state === "importing" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {state === "importing" ? "Importing photos…" : `Import ${archive.photoCount.toLocaleString()} ${archive.photoCount === 1 ? "photo" : "photos"}`}
          </button>
        </div>
      )}

      {state === "importing" ? (
        <div className="mt-4" role="status">
          <div className="h-2 overflow-hidden rounded-full bg-[#e8e1d5]">
            <div
              className="h-full rounded-full bg-[#b08336] transition-[width]"
              style={{ width: `${progress.total ? ((progress.completed + progress.failed) / progress.total) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-[#6f685d]">{progress.completed} imported · {progress.failed} failed · {progress.total} total</p>
        </div>
      ) : null}

      <p
        className={`mt-4 flex items-start gap-2 rounded-md border p-3 text-sm leading-6 ${
          state === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : state === "done"
              ? "border-[#d6e8b8] bg-[#f1f7e8] text-[#466026]"
              : "border-[#e5ded2] bg-[#fbfaf7] text-[#625d54]"
        }`}
        role="status"
      >
        {state === "done" ? <Check className="mt-1 size-4 shrink-0" /> : null}
        <span>{message}</span>
      </p>
      {state === "done" ? (
        <button
          className="mt-3 h-10 rounded-md border border-[#d7d0c4] bg-white px-4 text-sm font-medium"
          onClick={() => void clearArchive()}
          type="button"
        >
          Import another ZIP
        </button>
      ) : null}
    </div>
  )
}
