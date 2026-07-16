"use client"

import { Camera, Loader2, Plus, Save, Search, Trash2, Upload, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { normalizeGearSearchEntry, withRetailerAffiliateTracking } from "@/lib/gear-retailer"
import {
  addApprovedWebsiteGearItems,
  getSafeWebsiteGearImageUrl,
  getSafeWebsiteGearLink,
  removeWebsiteGearItem,
  type WebsiteGearCategory,
  type WebsiteGearReviewItem,
} from "@/lib/website-gear"

type GearRetailer = "" | "adorama" | "amazon" | "bestbuy" | "bh" | "ebay" | "keh" | "moment" | "mpb" | "other" | "walmart"
export type GearAffiliateSettings = {
  accountId: string
  affiliateStatus: "no" | "unanswered" | "yes"
  customRetailerUrl: string
  retailer: GearRetailer
}
type QuickGearItem = WebsiteGearReviewItem
const gearRetailerLabels: Record<Exclude<GearRetailer, "">, string> = {
  adorama: "Adorama",
  amazon: "Amazon",
  bestbuy: "Best Buy",
  bh: "B&H Photo",
  ebay: "eBay",
  keh: "KEH Camera",
  moment: "Moment",
  mpb: "MPB",
  other: "Another retailer",
  walmart: "Walmart",
}

function GearProductImage({ className, imageUrl, name }: { className: string; imageUrl: string; name: string }) {
  const safeImageUrl = getSafeWebsiteGearImageUrl(imageUrl)
  const [failedUrl, setFailedUrl] = useState("")

  return safeImageUrl && failedUrl !== safeImageUrl ? (
    // Retailer images stay on the retailer CDN; PhotoView.io does not copy or store them.
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={name} className={className} loading="lazy" onError={() => setFailedUrl(safeImageUrl)} referrerPolicy="no-referrer" src={safeImageUrl} />
  ) : (
    <div aria-label="Product image unavailable" className={`${className} grid place-items-center bg-[#f1eee7] text-[#9b9488]`} role="img">
      <Camera className="size-6" />
    </div>
  )
}

function QuickAddGear({
  affiliateSettings,
  categories,
  onAffiliateSettingsChange,
  onImportAndSave,
  onUploadProductImage,
}: {
  affiliateSettings: GearAffiliateSettings
  categories: WebsiteGearCategory[]
  onAffiliateSettingsChange: (settings: GearAffiliateSettings) => void
  onImportAndSave: (categories: WebsiteGearCategory[]) => void
  onUploadProductImage: (file: File) => Promise<string>
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const [dialogReady, setDialogReady] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [productLinks, setProductLinks] = useState("")
  const [reviewItems, setReviewItems] = useState<QuickGearItem[]>([])
  const [imageUploadErrorId, setImageUploadErrorId] = useState("")
  const [imageUploadItemId, setImageUploadItemId] = useState("")
  const [scanStatus, setScanStatus] = useState<"error" | "idle" | "scanning">("idle")
  const [scanMessage, setScanMessage] = useState("")

  useEffect(() => setDialogReady(true), [])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0)
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
        return
      }
      if (event.key !== "Tab") return

      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, a[href]',
      ) ?? []).filter((element) => element.tabIndex !== -1)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [isOpen])

  const updateAffiliateSettings = (updates: Partial<GearAffiliateSettings>) => {
    onAffiliateSettingsChange({ ...affiliateSettings, ...updates })
  }

  const findProducts = async () => {
    const entries = productLinks.split(/\r?\n/).map(normalizeGearSearchEntry).filter(Boolean)
    const urls = entries.filter((value) => /^https?:\/\//i.test(value))
    const queries = entries.filter((value) => !/^https?:\/\//i.test(value))
    if (!affiliateSettings.retailer) {
      setScanStatus("error")
      setScanMessage("Choose the retailer first.")
      return
    }
    if (affiliateSettings.retailer === "other" && !affiliateSettings.customRetailerUrl.trim()) {
      setScanStatus("error")
      setScanMessage("Add the other retailer's website address first.")
      return
    }
    if (entries.length === 0) {
      setScanStatus("error")
      setScanMessage("List at least one piece of gear.")
      return
    }

    setScanStatus("scanning")
    setScanMessage("")
    setReviewItems([])
    try {
      const response = await fetch("/api/gear/import", {
        body: JSON.stringify({
          affiliateTag: affiliateSettings.affiliateStatus === "yes" ? affiliateSettings.accountId : "",
          customRetailerUrl: affiliateSettings.customRetailerUrl,
          queries,
          retailer: affiliateSettings.retailer,
          urls,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const payload = await response.json() as {
        error?: string
        items?: Array<Omit<QuickGearItem, "id">>
      }
      if (!response.ok || !payload.items) throw new Error(payload.error ?? "The products could not be found")

      if (payload.items.length === 0) {
        setScanStatus("error")
        setScanMessage("No matching products were found. Try a more exact brand and model, choose another retailer, or paste the product page link.")
        return
      }

      setReviewItems(payload.items.map((item, index) => ({
        ...item,
        approved: false,
        id: `quick-gear-${Date.now()}-${index}`,
      })))
      setScanStatus("idle")
    } catch (error) {
      setScanStatus("error")
      setScanMessage(error instanceof Error ? error.message : "The products could not be found")
    }
  }

  const updateReviewItem = (itemId: string, updates: Partial<QuickGearItem>) => {
    setReviewItems((current) => current.map((item) => (item.id === itemId ? { ...item, ...updates } : item)))
  }

  const addAndSave = () => {
    const affiliateTag = affiliateSettings.affiliateStatus === "yes" ? affiliateSettings.accountId : ""
    const trackedItems = reviewItems.map((item) => ({
      ...item,
      url: withRetailerAffiliateTracking(item.url, affiliateSettings.retailer, affiliateTag),
    }))
    const { categories: nextCategories, importedCount } = addApprovedWebsiteGearItems(categories, trackedItems)

    onImportAndSave(nextCategories)
    setReviewItems([])
    setProductLinks("")
    setScanMessage(`${importedCount} ${importedCount === 1 ? "item" : "items"} added and saved.`)
    setIsOpen(false)
  }

  return (
    <div className="mb-3 rounded-md border border-[#d8a84f] bg-[#fff8e8] p-3 text-[#312719]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Quick add gear</p>
          <p className="mt-1 max-w-xl text-xs leading-5 text-[#735f3d]">
            List your gear in plain English. PhotoView.io finds likely products for you to review and approve.
          </p>
        </div>
        <button
          className="h-9 rounded-md bg-[#1f2a24] px-3 text-xs font-semibold text-white"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          {isOpen ? "Close" : "Quick add gear"}
        </button>
      </div>

      {scanMessage && !isOpen && <p className="mt-2 text-xs font-semibold text-[#466026]">{scanMessage}</p>}

      {dialogReady && isOpen && createPortal(
        <div
          aria-label="Quick add photography gear"
          aria-modal="true"
          className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false)
          }}
          role="dialog"
        >
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-md border border-[#d8a84f] bg-[#fffdf8] text-[#312719] shadow-2xl" ref={dialogRef}>
            <div className="flex items-start justify-between gap-4 border-b border-[#e1d2ad] bg-[#fff8e8] px-5 py-4">
              <div>
                <p className="text-lg font-semibold">Quick add gear</p>
                <p className="mt-1 text-sm leading-6 text-[#735f3d]">List products in plain English, compare likely retailer matches, and approve only the correct items.</p>
              </div>
              <button
                aria-label="Close quick add gear"
                className="grid size-10 shrink-0 place-items-center rounded-md border border-[#d8caa8] bg-white"
                onClick={() => setIsOpen(false)}
                ref={closeButtonRef}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-5 overflow-y-auto p-5">
          <details className="rounded-md border border-[#d8caa8] bg-white" open>
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">How Quick Add Gear works</summary>
            <ol className="grid gap-3 border-t border-[#e8dfca] px-4 py-4 text-xs leading-5 text-[#735f3d] md:grid-cols-2">
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e6b650] font-semibold text-[#2c2418]">1</span>
                <span><strong className="text-[#312719]">Choose your affiliate retailer.</strong> Select Amazon, B&amp;H, Adorama, Best Buy, Walmart, KEH, MPB, Moment, eBay, or add any other retailer.</span>
              </li>
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e6b650] font-semibold text-[#2c2418]">2</span>
                <span><strong className="text-[#312719]">List your equipment.</strong> Enter one exact brand and model per line. You can also paste an existing product or affiliate link.</span>
              </li>
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e6b650] font-semibold text-[#2c2418]">3</span>
                <span><strong className="text-[#312719]">Review the matches.</strong> Compare the photo, product name, description, retailer, and category. Check only the correct products.</span>
              </li>
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e6b650] font-semibold text-[#2c2418]">4</span>
                <span><strong className="text-[#312719]">Confirm the affiliate link.</strong> Amazon tracking IDs are added automatically. For other affiliate networks, paste the final deep link into the approved row.</span>
              </li>
              <li className="flex gap-3 md:col-span-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e6b650] font-semibold text-[#2c2418]">5</span>
                <span><strong className="text-[#312719]">Approve and save.</strong> Click Add approved items. To make changes later, return to What&apos;s in My Bag &gt; Equipment. Edit any field or use the trash icon to remove a product, then click Save changes.</span>
              </li>
            </ol>
            <p className="border-t border-[#e8dfca] px-4 py-3 text-[11px] leading-5 text-[#7e7567]">
              PhotoView.io never asks for an affiliate password or secret key. Product images remain hosted by the retailer and do not use your PhotoView.io storage.
            </p>
          </details>
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-[0.14em]">1. Do you have an affiliate account?</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["yes", "no"] as const).map((status) => (
                <button
                  aria-pressed={affiliateSettings.affiliateStatus === status}
                  className={`h-10 rounded-md border text-sm font-semibold ${affiliateSettings.affiliateStatus === status ? "border-[#b27a1f] bg-white" : "border-[#d8caa8] bg-[#fffdf8]"}`}
                  key={status}
                  onClick={() => updateAffiliateSettings({ affiliateStatus: status })}
                  type="button"
                >
                  {status === "yes" ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </fieldset>

          {affiliateSettings.affiliateStatus !== "unanswered" && (
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-[0.14em]">
                2. {affiliateSettings.affiliateStatus === "yes" ? "Where is your affiliate account?" : "Which retailer should we scan?"}
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(Object.entries(gearRetailerLabels) as Array<[Exclude<GearRetailer, "">, string]>).map(([retailer, label]) => (
                  <button
                    aria-pressed={affiliateSettings.retailer === retailer}
                    className={`min-h-10 rounded-md border px-2 text-sm font-semibold ${affiliateSettings.retailer === retailer ? "border-[#b27a1f] bg-white" : "border-[#d8caa8] bg-[#fffdf8]"}`}
                    key={retailer}
                    onClick={() => updateAffiliateSettings({ retailer })}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {affiliateSettings.retailer && (
            <div className="space-y-3">
              {affiliateSettings.retailer === "other" && (
                <label className="grid gap-1 text-xs font-semibold">
                  Retailer website
                  <input
                    className="h-10 rounded-md border border-[#d8caa8] bg-white px-3 text-sm font-normal outline-none"
                    onChange={(event) => updateAffiliateSettings({ customRetailerUrl: event.target.value })}
                    placeholder="https://retailer.com"
                    type="url"
                    value={affiliateSettings.customRetailerUrl}
                  />
                </label>
              )}
              {affiliateSettings.affiliateStatus === "yes" && affiliateSettings.retailer === "amazon" && (
                <label className="grid gap-1 text-xs font-semibold">
                  Amazon Associates tracking ID
                  <input
                    className="h-10 rounded-md border border-[#d8caa8] bg-white px-3 text-sm font-normal outline-none"
                    onChange={(event) => updateAffiliateSettings({ accountId: event.target.value })}
                    placeholder="Example: yourstore-20"
                    value={affiliateSettings.accountId}
                  />
                  <span className="font-normal leading-5 text-[#735f3d]">PhotoView.io adds this tracking ID to approved Amazon links. Never enter a password, secret key, or payment information here.</span>
                </label>
              )}
              {affiliateSettings.affiliateStatus === "yes" && affiliateSettings.retailer !== "amazon" && (
                <div className="rounded-md border border-[#d8caa8] bg-[#fff8e8] p-3 text-xs leading-5 text-[#735f3d]">
                  PhotoView.io finds the retailer product page. If your affiliate network provides a separate deep link, paste it into the approved product row before saving.
                </div>
              )}
              <label className="grid gap-1 text-xs font-semibold">
                Your gear, one item per line
                <textarea
                  className="min-h-28 resize-y rounded-md border border-[#d8caa8] bg-white p-3 text-sm font-normal leading-6 outline-none"
                  onChange={(event) => setProductLinks(event.target.value)}
                  placeholder={"Sony Alpha 7R V camera body\nSony FE 24-70mm F2.8 GM II lens\nPeak Design Travel Tripod"}
                  value={productLinks}
                />
              </label>
              <p className="text-xs leading-5 text-[#735f3d]">
                Be specific about brand and model. You may also paste an existing product or affiliate link on its own line.
              </p>
              <button
                className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-semibold text-white disabled:opacity-55"
                disabled={scanStatus === "scanning"}
                onClick={() => void findProducts()}
                type="button"
              >
                {scanStatus === "scanning" ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                {scanStatus === "scanning" ? "Finding likely products..." : "Find matching products"}
              </button>
              {scanStatus === "error" && <p className="text-xs font-semibold text-[#a43b2f]">{scanMessage}</p>}
            </div>
          )}

          {reviewItems.length > 0 && (
            <div className="space-y-3 border-t border-[#dccb9f] pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">3. Approve the correct products</p>
                <p className="mt-1 text-xs leading-5 text-[#735f3d]">Compare the likely matches, approve only the right item, and adjust its category or description if needed.</p>
              </div>
              <div className="overflow-x-auto rounded-md border border-[#d8caa8] bg-white">
                <div className="min-w-[760px]">
                  <div className="grid grid-cols-[72px_120px_minmax(260px,1fr)_160px_92px_44px] gap-3 border-b border-[#e5ddcc] bg-[#f8f4eb] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#735f3d]">
                    <span>Approve</span>
                    <span>Photo</span>
                    <span>Product found</span>
                    <span>Category</span>
                    <span>Source</span>
                    <span />
                  </div>
                  {reviewItems.map((item) => (
                    <div className={`grid grid-cols-[72px_120px_minmax(260px,1fr)_160px_92px_44px] items-start gap-3 border-b border-[#eee7d8] px-3 py-3 last:border-b-0 ${item.approved ? "bg-[#f4faef]" : "bg-white"}`} key={item.id}>
                      <label className="flex cursor-pointer flex-col items-center gap-1 pt-2 text-[11px] font-semibold text-[#476232]">
                        <input
                          checked={item.approved}
                          className="size-5 accent-[#b9842d]"
                          onChange={(event) => updateReviewItem(item.id, { approved: event.target.checked })}
                          type="checkbox"
                        />
                        {item.approved ? "Approved" : "Choose"}
                      </label>
                      <div className="space-y-2">
                        <GearProductImage className="size-20 rounded-md border border-[#e3ddd2] object-contain p-1" imageUrl={item.imageUrl} name={item.name} />
                        <label className="flex min-h-8 w-full cursor-pointer items-center justify-center gap-1 rounded-md border border-[#b9842d] bg-[#fff8e8] px-2 text-center text-[10px] font-semibold leading-4 text-[#735223]">
                          {imageUploadItemId === item.id ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                          {imageUploadItemId === item.id ? "Uploading..." : item.imageUrl ? "Replace image" : "Upload image"}
                          <input
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            className="sr-only"
                            disabled={imageUploadItemId === item.id}
                            onChange={(event) => {
                              const file = event.target.files?.[0]
                              event.target.value = ""
                              if (!file) return
                              setImageUploadErrorId("")
                              setImageUploadItemId(item.id)
                              void onUploadProductImage(file)
                                .then((imageUrl) => updateReviewItem(item.id, { imageUrl }))
                                .catch(() => setImageUploadErrorId(item.id))
                                .finally(() => setImageUploadItemId(""))
                            }}
                            type="file"
                          />
                        </label>
                        {imageUploadErrorId === item.id && (
                          <p className="text-[10px] font-semibold leading-4 text-[#b42318]">Upload failed. Try a JPG, PNG, WebP, or AVIF.</p>
                        )}
                      </div>
                      <div className="min-w-0 space-y-2">
                        {item.query && <p className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9a7a42]">Match for: {item.query}</p>}
                        <input
                          aria-label={`${item.name} product name`}
                          className="h-9 w-full min-w-0 rounded-md border border-[#d7d0c4] px-2 text-sm font-semibold outline-none focus:border-[#b08336]"
                          onChange={(event) => updateReviewItem(item.id, { name: event.target.value })}
                          value={item.name}
                        />
                        <textarea
                          aria-label={`${item.name} description`}
                          className="min-h-16 w-full resize-y rounded-md border border-[#d7d0c4] p-2 text-xs leading-5 outline-none focus:border-[#b08336]"
                          onChange={(event) => updateReviewItem(item.id, { description: event.target.value })}
                          placeholder="Useful product details or why you use it"
                          value={item.description}
                        />
                        <input
                          aria-label={`${item.name} product or affiliate link`}
                          className="h-9 w-full min-w-0 rounded-md border border-[#d7d0c4] px-2 text-xs outline-none focus:border-[#b08336]"
                          onChange={(event) => updateReviewItem(item.id, { url: event.target.value })}
                          placeholder="Product or affiliate link"
                          type="url"
                          value={item.url}
                        />
                      </div>
                      <select
                        aria-label={`${item.name} category`}
                        className="mt-2 h-10 rounded-md border border-[#d7d0c4] bg-white px-2 text-xs outline-none"
                        onChange={(event) => updateReviewItem(item.id, { categoryId: event.target.value })}
                        value={item.categoryId}
                      >
                        {categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}
                      </select>
                      <div className="pt-2 text-xs">
                        <p className="font-semibold">{item.retailer}</p>
                        {getSafeWebsiteGearLink(item.url) ? (
                          <a className="mt-2 inline-block font-semibold text-[#9b6d22] underline" href={getSafeWebsiteGearLink(item.url)} rel="noreferrer sponsored" target="_blank">Open</a>
                        ) : (
                          <span className="mt-2 inline-block text-[#8f887b]">Add link</span>
                        )}
                      </div>
                      <button
                        aria-label={`Remove ${item.name} from results`}
                        className="mt-2 grid size-9 place-items-center rounded-md border border-[#e3ddd2] text-[#8d3e32] hover:bg-[#fff0ed]"
                        onClick={() => setReviewItems((current) => current.filter((candidate) => candidate.id !== item.id))}
                        title="Remove result"
                        type="button"
                      >
                        <Trash2 className="size-4" />
                      </button>
                      {item.error && <p className="col-span-6 text-xs text-[#8a5b19]">{item.error}</p>}
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!reviewItems.some((item) => item.approved)}
                onClick={addAndSave}
                type="button"
              >
                <Save className="size-4" />
                Add and save {reviewItems.filter((item) => item.approved).length} approved {reviewItems.filter((item) => item.approved).length === 1 ? "item" : "items"}
              </button>
            </div>
          )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

export function WebsiteGearEditor({
  affiliateSettings,
  categories,
  onAffiliateSettingsChange,
  onChange,
  onImportAndSave,
  onUploadProductImage,
  onUploadImage,
  variant,
}: {
  affiliateSettings: GearAffiliateSettings
  categories: WebsiteGearCategory[]
  onAffiliateSettingsChange: (settings: GearAffiliateSettings) => void
  onChange: (categories: WebsiteGearCategory[]) => void
  onImportAndSave: (categories: WebsiteGearCategory[]) => void
  onUploadProductImage: (file: File) => Promise<string>
  onUploadImage: (categoryId: string, itemId: string, file: File) => Promise<void>
  variant: "canvas" | "panel"
}) {
  const [imageUploadErrorId, setImageUploadErrorId] = useState("")
  const [imageUploadItemId, setImageUploadItemId] = useState("")
  const updateCategoryTitle = (categoryId: string, title: string) => {
    onChange(categories.map((category) => (category.id === categoryId ? { ...category, title } : category)))
  }
  const updateItem = (categoryId: string, itemId: string, field: "description" | "imageUrl" | "name" | "retailer" | "url", value: string) => {
    onChange(categories.map((category) => (
      category.id === categoryId
        ? { ...category, items: category.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)) }
        : category
    )))
  }
  const addItem = (categoryId: string) => {
    onChange(categories.map((category) => (
      category.id === categoryId
        ? {
            ...category,
            items: [
              ...category.items,
              { description: "", id: `${categoryId}-${Date.now()}`, imageUrl: "", name: "", retailer: "", url: "" },
            ],
          }
        : category
    )))
  }
  const removeItem = (categoryId: string, itemId: string) => {
    onChange(removeWebsiteGearItem(categories, categoryId, itemId))
  }

  return (
    <div
      className={variant === "canvas" ? "mt-6 grid gap-3 md:grid-cols-3" : "space-y-3"}
      data-website-edit-control={variant === "canvas" ? "content" : undefined}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {variant === "panel" && (
        <QuickAddGear
          affiliateSettings={affiliateSettings}
          categories={categories}
          onAffiliateSettingsChange={onAffiliateSettingsChange}
          onImportAndSave={onImportAndSave}
          onUploadProductImage={onUploadProductImage}
        />
      )}
      {categories.map((category) => (
        <section className="min-w-0 rounded-md border border-[#ded8cc] bg-white p-3 text-[#171814] shadow-sm" key={category.id}>
          <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#756e63]">
            Category
            <input
              aria-label={`${category.title} category name`}
              className="h-9 min-w-0 rounded-md border border-[#d7d0c4] bg-[#fbfaf7] px-2 text-sm font-semibold normal-case tracking-normal outline-none focus:border-[#b08336]"
              onChange={(event) => updateCategoryTitle(category.id, event.target.value)}
              value={category.title}
            />
          </label>
          <div className="mt-3 space-y-3">
            {category.items.map((item, itemIndex) => (
              <div className="rounded-md border border-[#e3ddd2] bg-[#fbfaf7] p-2" key={item.id}>
                <div className="flex items-start gap-2">
                  <GearProductImage className="size-16 shrink-0 rounded-md border border-[#e3ddd2] object-contain p-1" imageUrl={item.imageUrl} name={item.name || "Product"} />
                  <input
                    aria-label={`${category.title} product ${itemIndex + 1} name`}
                    className="h-9 min-w-0 flex-1 rounded-md border border-[#d7d0c4] bg-white px-2 text-sm font-semibold outline-none focus:border-[#b08336]"
                    onChange={(event) => updateItem(category.id, item.id, "name", event.target.value)}
                    placeholder="Product name"
                    value={item.name}
                  />
                  <button
                    aria-label={`Remove ${item.name || `product ${itemIndex + 1}`}`}
                    className="grid size-9 shrink-0 place-items-center rounded-md border border-[#e3ddd2] text-[#8d3e32] hover:bg-[#fff0ed]"
                    onClick={() => removeItem(category.id, item.id)}
                    title="Remove product"
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input
                    aria-label={`${item.name || category.title} image link`}
                    className="h-9 min-w-0 rounded-md border border-[#d7d0c4] bg-white px-2 text-sm outline-none focus:border-[#b08336]"
                    onChange={(event) => updateItem(category.id, item.id, "imageUrl", event.target.value)}
                    placeholder="Product image URL"
                    type="url"
                    value={item.imageUrl}
                  />
                  <input
                    aria-label={`${item.name || category.title} retailer`}
                    className="h-9 min-w-0 rounded-md border border-[#d7d0c4] bg-white px-2 text-sm outline-none focus:border-[#b08336]"
                    onChange={(event) => updateItem(category.id, item.id, "retailer", event.target.value)}
                    placeholder="Retailer"
                    value={item.retailer}
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-[#b9842d] bg-[#fff8e8] px-3 text-xs font-semibold text-[#735223]">
                    <Upload className="size-4" />
                    {imageUploadItemId === item.id ? "Uploading..." : item.imageUrl ? "Replace product photo" : "Upload product photo"}
                    <input
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="sr-only"
                      disabled={imageUploadItemId === item.id}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        event.target.value = ""
                        if (!file) return
                        setImageUploadErrorId("")
                        setImageUploadItemId(item.id)
                        void onUploadImage(category.id, item.id, file)
                          .catch(() => setImageUploadErrorId(item.id))
                          .finally(() => setImageUploadItemId(""))
                      }}
                      type="file"
                    />
                  </label>
                  {imageUploadErrorId === item.id && (
                    <span className="text-xs font-semibold text-[#b42318]">Upload failed. Try another JPG, PNG, WebP, or AVIF image.</span>
                  )}
                  {imageUploadItemId !== item.id && item.imageUrl && imageUploadErrorId !== item.id && (
                    <span className="text-xs text-[#5f7250]">Image attached. Click Save changes to keep it.</span>
                  )}
                </div>
                <textarea
                  aria-label={`${item.name || category.title} description`}
                  className="mt-2 min-h-16 w-full resize-y rounded-md border border-[#d7d0c4] bg-white p-2 text-sm leading-5 outline-none focus:border-[#b08336]"
                  onChange={(event) => updateItem(category.id, item.id, "description", event.target.value)}
                  placeholder="Why you use it or what makes it useful"
                  value={item.description}
                />
                <input
                  aria-label={`${item.name || category.title} product link`}
                  className="mt-2 h-9 w-full min-w-0 rounded-md border border-[#d7d0c4] bg-white px-2 text-sm outline-none focus:border-[#b08336]"
                  onChange={(event) => updateItem(category.id, item.id, "url", event.target.value)}
                  placeholder="Optional product or affiliate link"
                  type="url"
                  value={item.url}
                />
              </div>
            ))}
          </div>
          <button
            className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-md border border-[#cdbf9f] bg-[#fff8e8] px-3 text-xs font-semibold text-[#735223]"
            onClick={() => addItem(category.id)}
            type="button"
          >
            <Plus className="size-4" />
            Add product
          </button>
        </section>
      ))}
    </div>
  )
}
