"use client"

import { Camera, ExternalLink } from "lucide-react"
import { useState } from "react"

import {
  getCompletedWebsiteGearCategories,
  getSafeWebsiteGearImageUrl,
  getSafeWebsiteGearLink,
  type WebsiteGearCategory,
} from "@/lib/website-gear"

function ProductImage({ imageUrl, name }: { imageUrl: string; name: string }) {
  const safeImageUrl = getSafeWebsiteGearImageUrl(imageUrl)
  const [failedUrl, setFailedUrl] = useState("")

  return safeImageUrl && failedUrl !== safeImageUrl ? (
    // Product imagery remains on the retailer CDN and is never copied into subscriber storage.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={name}
      className="h-full w-full object-contain p-4"
      loading="lazy"
      onError={() => setFailedUrl(safeImageUrl)}
      referrerPolicy="no-referrer"
      src={safeImageUrl}
    />
  ) : (
    <div className="grid h-full w-full place-items-center bg-current/5 opacity-35">
      <Camera className="size-10" />
    </div>
  )
}

export function WebsiteGearGrid({
  categories,
  interactive = true,
  mutedClass = "opacity-65",
}: {
  categories: WebsiteGearCategory[]
  interactive?: boolean
  mutedClass?: string
}) {
  const completedCategories = getCompletedWebsiteGearCategories(categories)

  if (completedCategories.length === 0) return null

  return (
    <div className="mt-8 space-y-10">
      <p className={`text-xs leading-5 ${mutedClass}`}>
        Some product links may be affiliate links. The photographer may earn a commission from qualifying purchases at no additional cost to you.
      </p>
      {completedCategories.map((category) => (
        <section key={category.id}>
          <div className="flex items-center gap-3 border-b border-current/15 pb-3">
            <h3 className="text-xl font-semibold">{category.title}</h3>
            <span className={`text-xs ${mutedClass}`}>{category.items.length} {category.items.length === 1 ? "item" : "items"}</span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {category.items.map((item) => (
              <article className="flex min-h-full flex-col overflow-hidden rounded-md border border-current/15 bg-white/55 text-[#1d211e] shadow-sm" key={item.id}>
                <div className="aspect-[4/3] border-b border-black/10 bg-white">
                  <ProductImage imageUrl={item.imageUrl} name={item.name} />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {item.retailer && <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#9b6d22]">{item.retailer}</p>}
                  <h4 className="mt-2 text-lg font-semibold leading-6">{item.name}</h4>
                  {item.description && <p className="mt-3 line-clamp-4 text-sm leading-6 text-[#5f625c]">{item.description}</p>}
                  {getSafeWebsiteGearLink(item.url) && (
                    interactive ? (
                      <a className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[#7b5418] underline underline-offset-4" href={getSafeWebsiteGearLink(item.url)} rel="noreferrer sponsored" target="_blank">
                        For more info: Click this link
                        <ExternalLink className="size-4" />
                      </a>
                    ) : (
                      <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[#7b5418] underline underline-offset-4">
                        For more info: Click this link
                        <ExternalLink className="size-4" />
                      </span>
                    )
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
