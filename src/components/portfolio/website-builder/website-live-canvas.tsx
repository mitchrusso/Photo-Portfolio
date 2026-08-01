"use client"

import { Eye, Play } from "lucide-react"
import Image from "next/image"
import type {
  CSSProperties,
  Dispatch,
  KeyboardEvent,
  MouseEvent,
  RefObject,
  SetStateAction,
} from "react"
import {
  type WebsiteBuilderNavItem,
  type WebsiteBuilderSectionKey,
  type WebsiteBuilderSettings,
  type WebsiteBuilderTool,
  type WebsiteWorkPhotoItem,
} from "@/components/portfolio/website-builder/website-builder-model"
import type { WebsitePreviewDevice } from "@/components/portfolio/website-builder/website-builder-toolbar"
import { WebsiteGearEditor } from "@/components/portfolio/website-gear-editor"
import {
  StoryPortfolioExperience,
  type StoryPortfolioItem,
  type StoryPortfolioTemplate,
} from "@/components/site/story-portfolio-experience"
import { WebsiteGearGrid } from "@/components/website/website-gear-grid"
import type { PortfolioGallery } from "@/lib/gallery-utils"
import {
  SUBSCRIBER_WEBSITE_CONTENT_NOTICE,
  type WebsiteBuilderPageKey,
  type WebsiteCustomPage,
  type WebsiteHomeBlockOrderKey,
  type WebsiteSectionOrderKey,
} from "@/lib/website-builder-rules"
import { getCompletedWebsiteGearCategories } from "@/lib/website-gear"
import {
  getWebsiteHeroHeadlineStyle,
  getWebsiteHeroScrollDuration,
} from "@/lib/website-hero-typography"
import { getWebsiteTemplatePreviewBackground } from "@/components/portfolio/website-template-mini-preview"

type Gallery = PortfolioGallery

type WebsiteLiveCanvasProps = {
  activeCustomPage?: WebsiteCustomPage
  activeWebsiteSectionKey: WebsiteSectionOrderKey
  activeWebsiteTemplate: { label: string }
  galleries: Gallery[]
  getWebsiteGalleryPhotoItems: (gallery?: Gallery) => WebsiteWorkPhotoItem[]
  getWebsiteSectionLabel: (sectionKey: WebsiteSectionOrderKey) => string
  handleWebsiteCanvasInteraction: (event: MouseEvent<HTMLDivElement>) => void
  handleWebsitePreviewSectionKeyDown: (
    event: KeyboardEvent<HTMLElement>,
    pageKey: WebsiteBuilderPageKey,
    sectionKey: WebsiteBuilderSectionKey,
  ) => void
  isCenteredWebsite: boolean
  isDark: boolean
  isEditorialMagazineWebsite: boolean
  isGalleryWallWebsite: boolean
  isOverlayHero: boolean
  isPosterWebsite: boolean
  isStackedHero: boolean
  isStoryPortfolioWebsite: boolean
  isTravelAtlasWebsite: boolean
  isWebsiteHeroVideo: boolean
  isWebsiteSectionVisible: (sectionKey: WebsiteSectionOrderKey) => boolean
  mutedTextClass: string
  orderedWebsiteNavItems: WebsiteBuilderNavItem[]
  saveWebsiteDraft: (settingsToSave?: WebsiteBuilderSettings) => Promise<void>
  selectWebsiteBuilderPage: (pageKey: WebsiteBuilderPageKey) => void
  selectWebsiteCustomPage: (customPageId: string) => void
  setWebsiteBuilderPage: Dispatch<SetStateAction<WebsiteBuilderPageKey>>
  setWebsiteBuilderSection: Dispatch<SetStateAction<WebsiteBuilderSectionKey>>
  setWebsiteBuilderTool: Dispatch<SetStateAction<WebsiteBuilderTool>>
  setWebsiteCanvasHint: (value: null) => void
  setWebsiteInspectorOpen: Dispatch<SetStateAction<boolean>>
  setWebsiteSettings: Dispatch<SetStateAction<WebsiteBuilderSettings>>
  uploadWebsiteGearImage: (categoryId: string, itemId: string, file: File) => Promise<void>
  websiteBackgroundStyle: CSSProperties
  websiteBuilderPage: WebsiteBuilderPageKey
  websiteBuilderSection: WebsiteBuilderSectionKey
  websiteContentWidthClass: string
  websiteEditHintsEnabled: boolean
  websiteFilmStripPhotos: WebsiteWorkPhotoItem[]
  websiteFontClass: string
  websiteFrameClass: string
  websiteFrameStyle: CSSProperties
  websiteHeadingClass: string
  websiteHeroHorizontalItemsClass: string
  websiteHeroImageSource: string
  websiteHeroObjectPosition: string
  websiteHeroVerticalItemsClass: string
  websiteHomeBlockOrderIndex: (blockKey: WebsiteHomeBlockOrderKey) => number
  websiteInspectorOpen: boolean
  websiteOverlayHeroCopyPositionClass: string
  websitePageLabels: Record<WebsiteBuilderPageKey, string>
  websitePortfolioGridGalleries: Gallery[]
  websitePortfolioGridPrimary?: Gallery
  websitePreviewDevice: WebsitePreviewDevice
  websitePreviewScrollRef: RefObject<HTMLDivElement | null>
  websitePrimaryWorkImage: WebsiteWorkPhotoItem
  websiteSectionOrderIndex: (sectionKey: WebsiteSectionOrderKey) => number
  websiteSelectedGallery?: Gallery
  websiteSelectedPortfolioPhotos: WebsiteWorkPhotoItem[]
  websiteSettings: WebsiteBuilderSettings
  websiteShapeClass: string
  websiteStoryPortfolioItems: StoryPortfolioItem[]
  websiteWorkGalleries: Gallery[]
}

function getSubscriberTripMeta(meta: string) {
  const trimmedMeta = meta.trim()
  return trimmedMeta === "Location or date" ? "" : trimmedMeta
}

export function WebsiteLiveCanvas({
  activeCustomPage,
  activeWebsiteSectionKey,
  activeWebsiteTemplate,
  galleries,
  getWebsiteGalleryPhotoItems,
  getWebsiteSectionLabel,
  handleWebsiteCanvasInteraction,
  handleWebsitePreviewSectionKeyDown,
  isCenteredWebsite,
  isDark,
  isEditorialMagazineWebsite,
  isGalleryWallWebsite,
  isOverlayHero,
  isPosterWebsite,
  isStackedHero,
  isStoryPortfolioWebsite,
  isTravelAtlasWebsite,
  isWebsiteHeroVideo,
  isWebsiteSectionVisible,
  mutedTextClass,
  orderedWebsiteNavItems,
  saveWebsiteDraft,
  selectWebsiteBuilderPage,
  selectWebsiteCustomPage,
  setWebsiteBuilderPage,
  setWebsiteBuilderSection,
  setWebsiteBuilderTool,
  setWebsiteCanvasHint,
  setWebsiteInspectorOpen,
  setWebsiteSettings,
  uploadWebsiteGearImage,
  websiteBackgroundStyle,
  websiteBuilderPage,
  websiteBuilderSection,
  websiteContentWidthClass,
  websiteEditHintsEnabled,
  websiteFilmStripPhotos,
  websiteFontClass,
  websiteFrameClass,
  websiteFrameStyle,
  websiteHeadingClass,
  websiteHeroHorizontalItemsClass,
  websiteHeroImageSource,
  websiteHeroObjectPosition,
  websiteHeroVerticalItemsClass,
  websiteHomeBlockOrderIndex,
  websiteInspectorOpen,
  websiteOverlayHeroCopyPositionClass,
  websitePageLabels,
  websitePortfolioGridGalleries,
  websitePortfolioGridPrimary,
  websitePreviewDevice,
  websitePreviewScrollRef,
  websitePrimaryWorkImage,
  websiteSectionOrderIndex,
  websiteSelectedGallery,
  websiteSelectedPortfolioPhotos,
  websiteSettings,
  websiteShapeClass,
  websiteStoryPortfolioItems,
  websiteWorkGalleries,
}: WebsiteLiveCanvasProps) {
  return (
                  <div className={`min-w-0 p-2 sm:p-3 lg:sticky lg:top-2 lg:col-start-2 lg:row-start-1 lg:self-start ${isDark ? "bg-black/20" : "bg-[#efede8]"}`}>
                    <div
                      className={`mx-auto overflow-hidden rounded-lg border shadow-sm ${isDark ? "border-white/10" : "border-[#d9d1c4]"}`}
                      style={{
                        ...websiteBackgroundStyle,
                        maxWidth: websitePreviewDevice === "mobile"
                          ? 410
                          : websiteSettings.contentWidthMode === "full"
                            ? 1440
                            : 1120,
                      }}
                    >
                      <div className={`sticky top-0 z-30 flex items-center justify-between border-b px-3 py-2.5 sm:px-4 sm:py-3 ${isDark ? "border-white/10 bg-[#1e211d]" : "border-[#ded6ca] bg-white"}`} data-testid="website-live-canvas-header">
                        <div>
                          <p className={`text-xs uppercase tracking-[0.18em] ${mutedTextClass}`}>Live canvas</p>
                          <h3 className="text-base font-semibold">
                            {websiteBuilderPage === "custom" ? activeCustomPage?.title || "Custom page" : websitePageLabels[websiteBuilderPage]}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`rounded-full border px-3 py-1 ${isDark ? "border-white/10" : "border-[#ded8cc]"} ${mutedTextClass}`}>{activeWebsiteTemplate.label}</span>
                          <button
                            className="flex h-8 items-center gap-1.5 rounded-md bg-[#1f2a24] px-3 text-xs font-semibold text-white"
                            data-testid="website-live-preview-button"
                            onClick={() => {
                              void saveWebsiteDraft().finally(() => window.location.assign("/website-preview"))
                            }}
                            type="button"
                          >
                            <Eye className="size-3.5" />
                            Preview
                          </button>
                        </div>
                      </div>

                      {websiteInspectorOpen && websiteEditHintsEnabled && (
                        <div className={`border-b px-4 py-2 text-xs ${isDark ? "border-white/10 bg-[#2a2418] text-[#f4d693]" : "border-[#e0bd69] bg-[#fff8e8] text-[#735223]"}`} role="status">
                          {isWebsiteSectionVisible(activeWebsiteSectionKey) ? (
                            <>Editing <strong>{getWebsiteSectionLabel(activeWebsiteSectionKey)}</strong>. Its controls are open in the <strong>Build your site</strong> panel on the left.</>
                          ) : (
                            <><strong>{getWebsiteSectionLabel(activeWebsiteSectionKey)} is hidden.</strong> It is not displayed in the canvas or visitor preview. Any portfolio images still visible belong to another enabled block, such as <strong>All portfolios</strong>.</>
                          )}
                        </div>
                      )}

                      <div
                        data-testid="website-live-canvas"
                        className={`mx-auto max-h-[calc(100vh-13rem)] w-full overflow-y-auto ${websiteFontClass} ${getWebsiteTemplatePreviewBackground(websiteSettings.template) ?? "bg-white text-[#171814]"}`}
                        onClickCapture={(event) => {
                          handleWebsiteCanvasInteraction(event)
                          setWebsiteBuilderTool("pages")
                          setWebsiteInspectorOpen(true)
                        }}
                        onMouseOver={handleWebsiteCanvasInteraction}
                        onScroll={() => setWebsiteCanvasHint(null)}
                        ref={websitePreviewScrollRef}
                        style={{
                          ...websiteBackgroundStyle,
                          color: websiteSettings.siteTextColor,
                        }}
                      >
                        {isStoryPortfolioWebsite && websiteBuilderPage === "home" ? (
                          <StoryPortfolioExperience
                            accentColor={websiteSettings.siteAccentColor}
                            backgroundColor={websiteSettings.siteBackgroundColor}
                            compact={websitePreviewDevice === "mobile"}
                            editing
                            heroButtonHref={websiteSettings.heroButtonUrl || "#portfolios"}
                            heroButtonLabel={websiteSettings.heroButtonLabel}
                            heroContentVerticalAlignment={websiteSettings.heroContentVerticalAlignment}
                            heroEyebrow={websiteSettings.heroEyebrow}
                            heroHeadline={websiteSettings.heroHeadline}
                            heroHeadlineScrollSlowdown={websiteSettings.heroHeadlineScrollSlowdown}
                            heroHeadlineScrollDuration={getWebsiteHeroScrollDuration(websiteSettings.heroHeadlineScrollSpeed)}
                            heroHeadlineStyle={getWebsiteHeroHeadlineStyle(websiteSettings.heroHeadlineSize)}
                            heroImageFit={websiteSettings.heroImageFit}
                            heroImagePosition={websiteSettings.heroImagePosition}
                            heroLayout={websiteSettings.heroLayout}
                            heroMediaSource={websiteSettings.heroImageMode === "featured" ? "" : websiteHeroImageSource}
                            heroOverlayStrength={websiteSettings.heroOverlayStrength}
                            heroSubhead={websiteSettings.heroSubhead}
                            heroVideoUrl={isWebsiteHeroVideo ? websiteSettings.heroVideoUrl : ""}
                            introBody={websiteSettings.pageCopy.introBody}
                            introHeadline={websiteSettings.pageCopy.introHeadline}
                            filmStripPhotos={websiteFilmStripPhotos.slice(0, websiteSettings.filmStripImageCount)}
                            navItems={orderedWebsiteNavItems
                              .filter((item) => item.placement === "top")
                              .map((item) => ({
                                href: item.customPageId ? `#custom-${item.customPageId}` : `#${item.pageKey}`,
                                key: item.id,
                                label: item.label,
                              }))}
                            onNavigate={(key) => {
                              const item = orderedWebsiteNavItems.find((candidate) => candidate.id === key)
                              if (!item) return
                              if (item.customPageId) selectWebsiteCustomPage(item.customPageId)
                              else selectWebsiteBuilderPage(item.pageKey)
                            }}
                            showHero={websiteSettings.enabledBlocks.hero}
                            showHeroBody={websiteSettings.showSectionBodies["home:hero"] ?? true}
                            showHeroButton={websiteSettings.enabledBlocks.callToAction}
                            showHeroEyebrow={websiteSettings.showHeroEyebrow}
                            showHeroHeadline={websiteSettings.showSectionHeadings["home:hero"] ?? true}
                            showFilmStrip={websiteSettings.enabledBlocks.filmStrip}
                            siteName={websiteSettings.siteName.trim() || "Photography Portfolio"}
                            stories={websiteStoryPortfolioItems}
                            template={websiteSettings.template as StoryPortfolioTemplate}
                            textColor={websiteSettings.siteTextColor}
                            textAlign={websiteSettings.headlineAlignment["home:hero"]}
                          />
                        ) : null}

                        {!(isStoryPortfolioWebsite && websiteBuilderPage === "home") ? (
                        <header className={`${websiteContentWidthClass} flex items-center justify-between gap-5 border-b border-current/10 px-6 py-4`}>
                          {websiteSettings.showSiteIdentity && (websiteSettings.siteLogoUrl || websiteSettings.siteName.trim()) ? (
                            <div className="flex min-w-0 items-center gap-3" data-testid="website-live-identity">
                              {websiteSettings.siteLogoUrl && (
                                <div className="relative size-10 shrink-0 overflow-hidden rounded-md">
                                  <Image alt={websiteSettings.siteName.trim() ? "" : "Website logo"} className="object-contain" fill sizes="40px" src={websiteSettings.siteLogoUrl} unoptimized />
                                </div>
                              )}
                              {websiteSettings.siteName.trim() && <span className="truncate text-sm font-semibold">{websiteSettings.siteName.trim()}</span>}
                            </div>
                          ) : <span />}
                          <nav className={`${websitePreviewDevice === "mobile" ? "hidden" : "hidden gap-4 text-xs font-semibold opacity-70 md:flex"}`}>
                            {orderedWebsiteNavItems.filter((item) => item.placement === "top").map((item) => (
                              <button
                                className="hover:opacity-100"
                                key={item.id}
                                onClick={() => item.customPageId
                                  ? selectWebsiteCustomPage(item.customPageId)
                                  : selectWebsiteBuilderPage(item.pageKey)}
                                type="button"
                              >
                                {item.label}
                              </button>
                            ))}
                          </nav>
                        </header>
                        ) : null}

                        <div className={`${websiteContentWidthClass} flex flex-col`}>
                        {websiteBuilderPage === "home" && !isStoryPortfolioWebsite && websiteSettings.enabledBlocks.hero && (
                            <section
                              className={`group relative border-b border-current/10 ${
                                isOverlayHero
                                  ? websitePreviewDevice === "mobile"
                                    ? "flex min-h-0 flex-col overflow-hidden"
                                    : "min-h-[560px] overflow-hidden"
                                  : `grid gap-6 ${websitePreviewDevice === "mobile" ? "grid-cols-1 p-4" : "p-6"} ${
                                      isStackedHero
                                        ? "grid-cols-1"
                                        : websitePreviewDevice === "mobile"
                                          ? ""
                                          : `grid-cols-[0.9fr_1.1fr] ${websiteHeroVerticalItemsClass}`
                                    }`
                              } ${websiteBuilderSection === "hero" ? "ring-2 ring-[#d8a84f]" : ""}`}
                              data-website-section="home:hero"
                              onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "home", "hero")}
                              onClick={() => {
                                setWebsiteBuilderPage("home")
                                setWebsiteBuilderSection("hero")
                              }}
                              style={{ containerType: "inline-size", order: websiteHomeBlockOrderIndex("hero") }}
                              tabIndex={0}
                              role="button"
                            >
                              <div className={`${websiteHeroHorizontalItemsClass} flex flex-col ${
                                isOverlayHero
                                  ? websitePreviewDevice === "mobile"
                                    ? "relative order-2 z-20 bg-black p-5 text-white"
                                    : `absolute inset-x-0 z-20 max-w-2xl p-8 text-white ${websiteOverlayHeroCopyPositionClass}`
                                  : isCenteredWebsite
                                    ? "mx-auto max-w-3xl text-center"
                                    : isPosterWebsite
                                      ? "mx-auto max-w-4xl text-center"
                                      : ""
                              } ${!websiteSettings.enabledBlocks.hero ? "opacity-35" : ""}`} style={{ textAlign: websiteSettings.headlineAlignment["home:hero"] }}>
                                {websiteSettings.showSectionHeadings["home:hero"] && (
                                  <h1 data-website-edit-control="headline" className={`font-semibold leading-tight ${websiteHeadingClass} ${
                                    isTravelAtlasWebsite
                                      ? "font-mono uppercase tracking-[-0.01em]"
                                      : isEditorialMagazineWebsite
                                        ? "font-serif leading-[0.98]"
                                        : ""
                                  }`} style={getWebsiteHeroHeadlineStyle(websiteSettings.heroHeadlineSize)}>{websiteSettings.heroHeadline}</h1>
                                )}
                                {(websiteSettings.showSectionBodies["home:hero"] ?? true) && websiteSettings.heroSubhead && (
                                  <p className="mt-3 text-base leading-7 opacity-75" data-website-edit-control="body">{websiteSettings.heroSubhead}</p>
                                )}
                                {websiteSettings.enabledBlocks.callToAction && (
                                  <div className="mt-4 inline-flex rounded-md bg-[#1f2a24] px-4 py-2 text-sm font-semibold text-white">
                                    {websiteSettings.heroButtonLabel || "View portfolios"}
                                  </div>
                                )}
                              </div>
                              <div data-website-edit-control="media" className={`${isOverlayHero && websitePreviewDevice !== "mobile" ? "absolute" : "relative"} overflow-hidden bg-transparent ${websiteShapeClass} ${websiteFrameClass} ${
                                isOverlayHero
                                  ? websitePreviewDevice === "mobile"
                                    ? "order-1 aspect-[16/10] min-h-0"
                                    : "inset-0 min-h-0"
                                  : isStackedHero
                                    ? websitePreviewDevice === "mobile" ? "aspect-[16/10] min-h-0" : "min-h-[420px]"
                                    : websitePreviewDevice === "mobile" ? "aspect-[16/10] min-h-0" : "min-h-[390px]"
                              } ${!websiteSettings.enabledBlocks.hero ? "opacity-35" : ""}`} style={websiteFrameStyle}>
                                {websiteSettings.heroImageMode === "video" && websiteSettings.heroVideoUrl ? (
                                  <div aria-label="Website Hero video paused while editing" className="absolute inset-0 bg-transparent">
                                    <Image
                                      alt="Hero video placeholder"
                                      className="object-contain opacity-65"
                                      fill
                                      sizes="50vw"
                                      src={websiteHeroImageSource}
                                      style={{ objectPosition: websiteHeroObjectPosition }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/35 p-4 text-center text-white">
                                      <span className="rounded-md border border-white/25 bg-black/65 px-4 py-3 text-xs font-semibold shadow-lg">
                                        Hero video paused while editing<br />Use Preview to play it
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <Image alt="Website hero cover" className="object-contain" fill priority sizes="50vw" src={websiteHeroImageSource} style={{ objectPosition: websiteHeroObjectPosition }} />
                                )}
                                {websiteSettings.heroOverlayStrength > 0 && (
                                  <div className={`absolute inset-0 bg-black ${websitePreviewDevice === "mobile" ? "hidden" : ""}`} style={{ opacity: Math.max(0, Math.min(80, websiteSettings.heroOverlayStrength)) / 100 }} />
                                )}
                                {!isOverlayHero && isTravelAtlasWebsite && (
                                  <div className="absolute inset-x-4 bottom-4 rounded-md bg-black/55 p-3 text-white backdrop-blur">
                                    <p className="mt-1 text-sm font-semibold">Locations, dates, and portfolios arranged like field notes.</p>
                                  </div>
                                )}
                                {!isOverlayHero && isEditorialMagazineWebsite && (
                                  <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#171814] shadow">Cover story</div>
                                )}
                              </div>
                              {!isOverlayHero && isTravelAtlasWebsite && (
                                <div className="grid gap-3 rounded-md border border-current/10 bg-black/5 p-3 font-mono text-xs uppercase tracking-[0.12em] 2xl:col-span-2 md:grid-cols-3">
                                  <span>01 Featured route</span>
                                  <span>02 Portfolio stops</span>
                                  <span>03 Field notes</span>
                                </div>
                              )}
                              {!isOverlayHero && isEditorialMagazineWebsite && (
                                <div className="grid gap-3 border-t border-current/10 pt-4 2xl:col-span-2 md:grid-cols-3">
                                  {["Cover story", "Recent essay", "Selected gallery"].map((item) => (
                                    <div className="rounded-md border border-current/10 bg-white/10 p-3" key={item}>
                                      <p className="font-serif text-lg font-semibold">{item}</p>
                                      <p className="mt-1 text-xs opacity-60">Magazine-style entry point</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </section>

                        )}

                        {websiteBuilderPage === "home" && !isStoryPortfolioWebsite && websiteSettings.enabledBlocks.filmStrip && (
                          <section
                            className={`group relative border-b border-current/10 p-4 ${websiteBuilderSection === "filmStrip" ? "ring-2 ring-[#d8a84f]" : ""}`}
                            data-website-section="home:filmStrip"
                            onClick={() => {
                              setWebsiteBuilderPage("home")
                              setWebsiteBuilderSection("filmStrip")
                            }}
                            onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "home", "filmStrip")}
                            role="button"
                            style={{ order: websiteHomeBlockOrderIndex("filmStrip") }}
                            tabIndex={0}
                          >
                            <div className="flex gap-2 overflow-x-auto pb-1" data-website-edit-control="content">
                              {websiteFilmStripPhotos.slice(0, websiteSettings.filmStripImageCount).map((photo) => (
                                <div className="flex h-24 min-w-28 shrink-0 items-center justify-center bg-black/8 p-1" key={photo.id}>
                                  <Image
                                    alt={photo.title}
                                    className="h-full w-auto max-w-44 object-contain"
                                    height={photo.height || 900}
                                    sizes="176px"
                                    src={photo.source}
                                    width={photo.width || 1200}
                                  />
                                </div>
                              ))}
                            </div>
                          </section>
                        )}

                        {websiteBuilderPage === "home" && !isStoryPortfolioWebsite && websiteSettings.enabledBlocks.textBlock && (
                            <section
                              className={`group relative border-b border-current/10 p-6 ${websiteBuilderSection === "textBlock" ? "ring-2 ring-[#d8a84f]" : ""} ${!websiteSettings.enabledBlocks.textBlock ? "opacity-35" : ""}`}
                              data-website-section="home:textBlock"
                              onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "home", "textBlock")}
                              onClick={() => {
                                setWebsiteBuilderPage("home")
                                setWebsiteBuilderSection("textBlock")
                              }}
                              style={{ order: websiteHomeBlockOrderIndex("textBlock") }}
                              tabIndex={0}
                              role="button"
                            >
                              {websiteSettings.showSectionHeadings["home:textBlock"] && (
                                <h4 className={`text-2xl font-semibold ${websiteHeadingClass}`} data-website-edit-control="headline" style={{ textAlign: websiteSettings.headlineAlignment["home:textBlock"] }}>{websiteSettings.pageCopy.introHeadline}</h4>
                              )}
                              {(websiteSettings.showSectionBodies["home:textBlock"] ?? true) && websiteSettings.pageCopy.introBody && (
                                <p className="mt-3 text-base leading-7 opacity-75" data-website-edit-control="body">{websiteSettings.pageCopy.introBody}</p>
                              )}
                            </section>
                        )}

                        {websiteBuilderPage === "home" && !isStoryPortfolioWebsite && websiteSettings.enabledBlocks.featuredPortfolio && (
                            <section
                              className={`group relative border-b border-current/10 p-6 ${websiteBuilderSection === "featuredPortfolio" ? "ring-2 ring-[#d8a84f]" : ""} ${!websiteSettings.enabledBlocks.featuredPortfolio ? "opacity-35" : ""}`}
                              data-website-section="home:featuredPortfolio"
                              onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "home", "featuredPortfolio")}
                              onClick={() => {
                                setWebsiteBuilderPage("home")
                                setWebsiteBuilderSection("featuredPortfolio")
                              }}
                              style={{ order: websiteHomeBlockOrderIndex("featuredPortfolio") }}
                              tabIndex={0}
                              role="button"
                            >
                                <div className="mb-4 flex items-center justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    {websiteSettings.showSectionHeadings["home:featuredPortfolio"] && websiteSettings.pageCopy.featuredWorkHeadline && (
                                      <h4 className={`text-2xl font-semibold ${websiteHeadingClass}`} data-website-edit-control="headline" style={{ textAlign: websiteSettings.headlineAlignment["home:featuredPortfolio"] }}>{websiteSettings.pageCopy.featuredWorkHeadline}</h4>
                                    )}
                                  </div>
                              </div>
                              {websiteSettings.workDisplayMode === "slideshow" && (
                                <div className={`overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} data-website-edit-control="content" style={websiteFrameStyle}>
                                  <div className="relative aspect-[16/9]">
                                    <Image alt={websitePrimaryWorkImage.title} className="object-cover" fill sizes="700px" src={websitePrimaryWorkImage.source} />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
                                      <p className="text-xs uppercase tracking-[0.18em] opacity-75">Featured work</p>
                                      <p className="mt-1 text-2xl font-semibold">
                                        {websiteSettings.workSourceMode === "single" ? websiteSelectedGallery?.name ?? "Selected portfolio" : websitePrimaryWorkImage.title}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {websiteSettings.workDisplayMode === "thumbnail-grid" && (
                                <div className={`grid gap-3 ${websitePreviewDevice === "mobile" ? "grid-cols-2" : "md:grid-cols-4"}`} data-website-edit-control="content">
                                  {websiteSettings.workSourceMode === "single"
                                    ? websiteSelectedPortfolioPhotos.slice(0, 12).map((photo) => (
                                        <div className={`overflow-hidden bg-black/5 ${websiteShapeClass} ${websiteFrameClass}`} key={photo.id} style={websiteFrameStyle}>
                                          <div className="relative aspect-[4/3] bg-black">
                                            <Image alt={photo.title} className="object-cover" fill sizes="220px" src={photo.source} />
                                          </div>
                                          <p className="truncate px-3 py-2 text-sm font-semibold">{photo.title}</p>
                                        </div>
                                      ))
                                    : websiteWorkGalleries.slice(0, 8).map((gallery) => (
                                        <div className={`overflow-hidden bg-black/5 ${websiteShapeClass} ${websiteFrameClass}`} key={gallery.id} style={websiteFrameStyle}>
                                          <div className="relative aspect-[4/3] bg-black">
                                            <Image alt={gallery.name} className="object-cover" fill sizes="220px" src={gallery.cover} />
                                          </div>
                                          <p className="truncate px-3 py-2 text-sm font-semibold">{gallery.name}</p>
                                        </div>
                                      ))}
                                </div>
                              )}
                              {websiteSettings.workDisplayMode === "full-frame-grid" && (
                                <div className={`${websitePreviewDevice === "mobile" ? "columns-2" : "columns-3"} gap-2`} data-website-edit-control="content">
                                  {(websiteSettings.workSourceMode === "single"
                                    ? websiteSelectedPortfolioPhotos.slice(0, 16)
                                    : websiteWorkGalleries.flatMap((gallery) => getWebsiteGalleryPhotoItems(gallery).slice(0, 3)).slice(0, 18)
                                  ).map((photo) => (
                                    <div className="mb-2 break-inside-avoid overflow-hidden bg-black/5" key={photo.id}>
                                      <Image
                                        alt={photo.title}
                                        className="h-auto w-full object-contain"
                                        height={photo.height || 900}
                                        sizes={websitePreviewDevice === "mobile" ? "50vw" : "33vw"}
                                        src={photo.source}
                                        width={photo.width || 1200}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                              {websiteSettings.workDisplayMode === "film-strip" && (
                                <div className="space-y-3" data-website-edit-control="content">
                                  <div className={`relative aspect-[16/8] overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} style={websiteFrameStyle}>
                                    <Image alt={websitePrimaryWorkImage.title} className="object-cover" fill sizes="720px" src={websitePrimaryWorkImage.source} />
                                  </div>
                                  <div className="flex gap-2 overflow-x-auto pb-1">
                                    {websiteSettings.workSourceMode === "single"
                                      ? websiteSelectedPortfolioPhotos.slice(0, 12).map((photo) => (
                                          <div className={`relative h-16 w-24 shrink-0 overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} key={photo.id} style={websiteFrameStyle}>
                                            <Image alt={photo.title} className="object-cover" fill sizes="96px" src={photo.source} />
                                          </div>
                                        ))
                                      : websiteWorkGalleries.slice(0, 8).map((gallery) => (
                                          <div className={`relative h-16 w-24 shrink-0 overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} key={gallery.id} style={websiteFrameStyle}>
                                            <Image alt={gallery.name} className="object-cover" fill sizes="96px" src={gallery.cover} />
                                          </div>
                                        ))}
                                  </div>
                                </div>
                              )}
                              {websiteSettings.workDisplayMode === "cover-cards" && (
                                <div className={`grid gap-4 ${websitePreviewDevice === "mobile" ? "grid-cols-1" : "md:grid-cols-3"}`} data-website-edit-control="content">
                                  {websiteSettings.workSourceMode === "single"
                                    ? websiteSelectedPortfolioPhotos.slice(0, 6).map((photo) => (
                                        <div className={`relative aspect-[4/5] overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} key={photo.id} style={websiteFrameStyle}>
                                          <Image alt={photo.title} className="object-cover" fill sizes="280px" src={photo.source} />
                                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                                            <p className="text-lg font-semibold">{photo.title}</p>
                                          </div>
                                        </div>
                                      ))
                                    : websiteWorkGalleries.slice(0, 6).map((gallery) => (
                                        <div className={`relative aspect-[4/5] overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} key={gallery.id} style={websiteFrameStyle}>
                                          <Image alt={gallery.name} className="object-cover" fill sizes="280px" src={gallery.cover} />
                                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                                            <p className="text-lg font-semibold">{gallery.name}</p>
                                            <p className="text-xs opacity-75">{gallery.photos?.filter((photo) => !photo.hidden).length ?? 0} photos</p>
                                          </div>
                                        </div>
                                      ))}
                                </div>
                              )}
                            </section>
                        )}

                        {websiteBuilderPage === "home" && !isStoryPortfolioWebsite && websiteSettings.enabledBlocks.portfolioGrid && (
                            <section
                              className={`group relative p-6 ${websiteBuilderSection === "portfolioGrid" ? "ring-2 ring-[#d8a84f]" : ""} ${!websiteSettings.enabledBlocks.portfolioGrid ? "opacity-35" : ""}`}
                              data-website-section="home:portfolioGrid"
                              onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "home", "portfolioGrid")}
                              onClick={() => {
                                setWebsiteBuilderPage("home")
                                setWebsiteBuilderSection("portfolioGrid")
                              }}
                              style={{ order: websiteHomeBlockOrderIndex("portfolioGrid") }}
                              tabIndex={0}
                              role="button"
                            >
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                  {websiteSettings.showSectionHeadings["home:portfolioGrid"] && websiteSettings.pageCopy.portfolioGridHeadline && (
                                    <h4 className={`text-2xl font-semibold ${websiteHeadingClass}`} data-website-edit-control="headline" style={{ textAlign: websiteSettings.headlineAlignment["home:portfolioGrid"] }}>{websiteSettings.pageCopy.portfolioGridHeadline}</h4>
                                  )}
                                </div>
                              </div>
                              {websiteSettings.portfolioGridDisplayMode === "slideshow" && websitePortfolioGridPrimary && (
                                <div className={`relative aspect-[16/9] overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} data-website-edit-control="content" style={websiteFrameStyle}>
                                  <Image alt={websitePortfolioGridPrimary.name} className="object-cover" fill sizes="720px" src={websitePortfolioGridPrimary.cover} />
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 text-white">
                                    <p className="text-xs uppercase tracking-[0.18em] opacity-75">All portfolios</p>
                                    <p className="mt-1 text-2xl font-semibold">{websitePortfolioGridPrimary.name}</p>
                                  </div>
                                </div>
                              )}
                              {websiteSettings.portfolioGridDisplayMode === "thumbnail-grid" && (
                                <div className={websitePreviewDevice === "mobile" ? "grid grid-cols-1 gap-2" : isGalleryWallWebsite ? "grid gap-2 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-3 md:grid-cols-3"} data-website-edit-control="content">
                                  {websitePortfolioGridGalleries.map((gallery) => (
                                    <div className={`relative overflow-hidden bg-black ${isGalleryWallWebsite ? "aspect-[16/10] rounded-none border-transparent" : `aspect-[4/3] ${websiteShapeClass} ${websiteFrameClass}`}`} key={gallery.id} style={isGalleryWallWebsite ? undefined : websiteFrameStyle}>
                                      <Image alt={gallery.name} className="object-cover" fill sizes="260px" src={gallery.cover} />
                                      <span className="absolute inset-x-0 bottom-0 bg-black/55 px-3 py-2 text-sm font-semibold text-white">{gallery.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {websiteSettings.portfolioGridDisplayMode === "full-frame-grid" && (
                                <div className={`${websitePreviewDevice === "mobile" ? "columns-2" : "columns-3"} gap-2`} data-website-edit-control="content">
                                  {websitePortfolioGridGalleries
                                    .flatMap((gallery) => getWebsiteGalleryPhotoItems(gallery).slice(0, 3))
                                    .slice(0, 24)
                                    .map((photo) => (
                                      <div className="mb-2 break-inside-avoid overflow-hidden bg-black/5" key={photo.id}>
                                        <Image
                                          alt={photo.title}
                                          className="h-auto w-full object-contain"
                                          height={photo.height || 900}
                                          sizes={websitePreviewDevice === "mobile" ? "50vw" : "33vw"}
                                          src={photo.source}
                                          width={photo.width || 1200}
                                        />
                                      </div>
                                    ))}
                                </div>
                              )}
                              {websiteSettings.portfolioGridDisplayMode === "film-strip" && websitePortfolioGridPrimary && (
                                <div className="space-y-3" data-website-edit-control="content">
                                  <div className={`relative aspect-[16/8] overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} style={websiteFrameStyle}>
                                    <Image alt={websitePortfolioGridPrimary.name} className="object-cover" fill sizes="720px" src={websitePortfolioGridPrimary.cover} />
                                  </div>
                                  <div className="flex gap-2 overflow-x-auto pb-1">
                                    {websitePortfolioGridGalleries.map((gallery) => (
                                      <div className={`relative h-16 w-24 shrink-0 overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} key={gallery.id} style={websiteFrameStyle}>
                                        <Image alt={gallery.name} className="object-cover" fill sizes="96px" src={gallery.cover} />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {websiteSettings.portfolioGridDisplayMode === "cover-cards" && (
                                <div className={`grid gap-4 ${websitePreviewDevice === "mobile" ? "grid-cols-1" : "md:grid-cols-3"}`} data-website-edit-control="content">
                                  {websitePortfolioGridGalleries.map((gallery) => (
                                    <div className={`relative aspect-[4/5] overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} key={gallery.id} style={websiteFrameStyle}>
                                      <Image alt={gallery.name} className="object-cover" fill sizes="280px" src={gallery.cover} />
                                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                                        <p className="text-lg font-semibold">{gallery.name}</p>
                                        <p className="text-xs opacity-75">{gallery.photos?.filter((photo) => !photo.hidden).length ?? 0} photos</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </section>
                        )}

                        {websiteBuilderPage === "home" && websiteSettings.customBlocks
                          .filter((block) => block.visible)
                          .map((block) => {
                            const selectedGalleries = block.galleryIds
                              .map((galleryId) => galleries.find((gallery) => gallery.id === galleryId))
                              .filter((gallery): gallery is Gallery => Boolean(gallery?.cover))

                            return (
                              <section
                                className="border-b border-current/10 p-6"
                                data-website-custom-section={block.id}
                                key={block.id}
                                style={{ order: websiteHomeBlockOrderIndex(`custom:${block.id}`) }}
                              >
                                {block.title && <h4 className={`text-2xl font-semibold ${websiteHeadingClass}`}>{block.title}</h4>}
                                {block.body && <p className="mt-3 max-w-3xl whitespace-pre-line text-base leading-7 opacity-75">{block.body}</p>}
                                {block.type === "portfolio" && (
                                  selectedGalleries.length > 0 ? (
                                    <div className={`mt-5 grid gap-3 ${websitePreviewDevice === "mobile" ? "grid-cols-1" : "md:grid-cols-3"}`}>
                                      {selectedGalleries.map((gallery) => (
                                        <div className={`overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} key={gallery.id} style={websiteFrameStyle}>
                                          <div className="relative aspect-[4/3]">
                                            <Image alt={gallery.name} className="object-cover" fill sizes="260px" src={gallery.cover} />
                                            <span className="absolute inset-x-0 bottom-0 bg-black/55 px-3 py-2 text-sm font-semibold text-white">{gallery.name}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="mt-4 rounded-md border border-dashed border-current/20 p-4 text-sm opacity-60">Choose portfolios for this grid in the block controls.</p>
                                  )
                                )}
                              </section>
                            )
                          })}

                        {websiteBuilderPage === "about" && (
                          <section
                            className={`p-8 ${websiteBuilderPage === "about" && websiteBuilderSection === "about" ? "ring-2 ring-[#d8a84f]" : ""}`}
                            data-website-section="page:about"
                            onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "about", "about")}
                            onClick={() => {
                              setWebsiteBuilderPage("about")
                              setWebsiteBuilderSection("about")
                            }}
                            style={{ order: websiteSectionOrderIndex("page:about") }}
                            tabIndex={0}
                            role="button"
                          >
                            <div className={`grid gap-7 ${websitePreviewDevice === "desktop" && (websiteSettings.aboutVideoUrl || websiteSettings.aboutImageUrl) ? "lg:grid-cols-[0.72fr_1.28fr] lg:items-start" : ""}`}>
                              {websiteSettings.aboutVideoUrl ? (
                                <div
                                  aria-label="Website About video paused while editing"
                                  className={`relative grid aspect-[4/5] place-items-center overflow-hidden bg-black text-center text-white ${websiteShapeClass} ${websiteFrameClass}`}
                                  data-website-edit-control="media"
                                  style={websiteFrameStyle}
                                >
                                  <div className="px-5">
                                    <Play className="mx-auto size-8 fill-current" />
                                    <p className="mt-3 text-sm font-semibold">About video paused while editing</p>
                                    <p className="mt-1 text-xs text-white/70">Use Preview to watch it</p>
                                  </div>
                                </div>
                              ) : websiteSettings.aboutImageUrl ? (
                                <div className={`relative aspect-[4/5] overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} data-website-edit-control="media" style={websiteFrameStyle}>
                                  <Image alt="About page portrait" className="object-cover" fill sizes="320px" src={websiteSettings.aboutImageUrl} />
                                </div>
                              ) : null}
                              <div>
                                {websiteSettings.showSectionHeadings["page:about"] && websiteSettings.pageCopy.aboutHeadline && (
                                  <h4 className="text-4xl font-semibold" data-website-edit-control="headline" style={{ textAlign: websiteSettings.headlineAlignment["page:about"] }}>{websiteSettings.pageCopy.aboutHeadline}</h4>
                                )}
                                {(websiteSettings.showSectionBodies["page:about"] ?? true) && websiteSettings.pageCopy.aboutBody && (
                                  <p className="mt-5 whitespace-pre-wrap text-lg leading-8 opacity-75" data-website-edit-control="body">{websiteSettings.pageCopy.aboutBody}</p>
                                )}
                                <button
                                  className="mt-4 rounded-md bg-[#1f2a24] px-5 py-3 text-sm font-semibold text-white"
                                  title="This link becomes active in Preview and on the published website."
                                  type="button"
                                >
                                  {websiteSettings.pageCopy.aboutButtonLabel}
                                </button>
                              </div>
                            </div>
                          </section>
                        )}

                        {websiteBuilderPage === "gear" && (
                          <section
                            className={`p-8 ${websiteBuilderPage === "gear" && websiteBuilderSection === "gear" ? "ring-2 ring-[#d8a84f]" : ""}`}
                            data-website-section="page:gear"
                            onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "gear", "gear")}
                            onClick={() => {
                              setWebsiteBuilderPage("gear")
                              setWebsiteBuilderSection("gear")
                            }}
                            style={{ order: websiteSectionOrderIndex("page:gear") }}
                            tabIndex={0}
                            role="button"
                          >
                            {websiteSettings.showSectionHeadings["page:gear"] && websiteSettings.pageCopy.gearHeadline && (
                              <h4 className="text-4xl font-semibold" data-website-edit-control="headline" style={{ textAlign: websiteSettings.headlineAlignment["page:gear"] }}>{websiteSettings.pageCopy.gearHeadline}</h4>
                            )}
                            {(websiteSettings.showSectionBodies["page:gear"] ?? true) && websiteSettings.pageCopy.gearBody && (
                              <p className="mt-5 text-lg leading-8 opacity-75" data-website-edit-control="body">{websiteSettings.pageCopy.gearBody}</p>
                            )}
                            {websiteBuilderPage === "gear" && websiteBuilderSection === "gear" ? (
                              <WebsiteGearEditor
                                categories={websiteSettings.gearCategories}
                                onChange={(gearCategories) => setWebsiteSettings((current) => ({ ...current, gearCategories }))}
                                onUploadImage={uploadWebsiteGearImage}
                                variant="canvas"
                              />
                            ) : (
                              <>
                                <WebsiteGearGrid categories={websiteSettings.gearCategories} interactive={false} />
                                {getCompletedWebsiteGearCategories(websiteSettings.gearCategories).length === 0 && (
                                  <div className="mt-6 rounded-md border border-dashed border-current/20 p-4 text-sm opacity-60">
                                    Select this section to add camera bodies, lenses, and travel accessories.
                                  </div>
                                )}
                              </>
                            )}
                          </section>
                        )}

                        {websiteBuilderPage === "contact" && (
                          <section
                            className={`p-8 ${websiteBuilderPage === "contact" && websiteBuilderSection === "contact" ? "ring-2 ring-[#d8a84f]" : ""}`}
                            data-website-section="page:contact"
                            onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "contact", "contact")}
                            onClick={() => {
                              setWebsiteBuilderPage("contact")
                              setWebsiteBuilderSection("contact")
                            }}
                            style={{ order: websiteSectionOrderIndex("page:contact") }}
                            tabIndex={0}
                            role="button"
                          >
                            {websiteSettings.showSectionHeadings["page:contact"] && websiteSettings.pageCopy.contactHeadline && (
                              <h4 className="text-4xl font-semibold" data-website-edit-control="headline" style={{ textAlign: websiteSettings.headlineAlignment["page:contact"] }}>{websiteSettings.pageCopy.contactHeadline}</h4>
                            )}
                            {(websiteSettings.showSectionBodies["page:contact"] ?? true) && websiteSettings.pageCopy.contactIntro && (
                              <p className="mt-5 text-lg leading-8 opacity-75" data-website-edit-control="body">{websiteSettings.pageCopy.contactIntro}</p>
                            )}
                            <div className={`mt-6 grid gap-3 ${websitePreviewDevice === "mobile" ? "grid-cols-1" : "md:grid-cols-2"}`} data-website-edit-control="content">
                              <div className="rounded-md border border-current/15 px-3 py-3 text-sm opacity-65">Name</div>
                              <div className="rounded-md border border-current/15 px-3 py-3 text-sm opacity-65">Email</div>
                              <div className="rounded-md border border-current/15 px-3 py-3 text-sm opacity-65 md:col-span-2">Subject</div>
                              <div className="rounded-md border border-current/15 px-3 py-3 text-sm opacity-65 md:col-span-2">Message</div>
                              <button className="rounded-md bg-[#1f2a24] px-5 py-3 text-sm font-semibold text-white md:col-span-2" type="button">Send message</button>
                            </div>
                            {!websiteSettings.contactEmail && (
                              <div className="mt-4 rounded-md border border-[#d8a84f]/50 bg-[#fff8e8] px-3 py-2 text-xs leading-5 text-[#735223]">
                                Builder note: open Contact in the left menu and add the delivery email before publishing. This note is not part of the public website.
                              </div>
                            )}
                          </section>
                        )}

                        {websiteBuilderPage === "blog" && (
                          <section
                            className={`p-8 ${websiteBuilderPage === "blog" && websiteBuilderSection === "articles" ? "ring-2 ring-[#d8a84f]" : ""}`}
                            data-website-section="page:blog"
                            onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "blog", "articles")}
                            onClick={() => {
                              setWebsiteBuilderPage("blog")
                              setWebsiteBuilderSection("articles")
                            }}
                            style={{ order: websiteSectionOrderIndex("page:blog") }}
                            tabIndex={0}
                            role="button"
                          >
                            <div>
                              {websiteSettings.showSectionHeadings["page:blog"] && websiteSettings.pageCopy.blogHeadline && (
                                <h4 className="text-4xl font-semibold" data-website-edit-control="headline" style={{ textAlign: websiteSettings.headlineAlignment["page:blog"] }}>{websiteSettings.pageCopy.blogHeadline}</h4>
                              )}
                              {(websiteSettings.showSectionBodies["page:blog"] ?? true) && websiteSettings.pageCopy.blogBody && (
                                <p className="mt-5 text-lg leading-8 opacity-75" data-website-edit-control="body">{websiteSettings.pageCopy.blogBody}</p>
                              )}
                            </div>
                            <div className="mt-8 grid gap-4" data-website-edit-control="content">
                              {websiteSettings.tripEntries.map((trip) => (
                                <article className="rounded-md border border-current/15 bg-black/[0.03] p-4" key={trip.id}>
                                  <h5 className="text-2xl font-semibold">{trip.title}</h5>
                                  {getSubscriberTripMeta(trip.meta) && (
                                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] opacity-60">{getSubscriberTripMeta(trip.meta)}</p>
                                  )}
                                  <p className="mt-4 text-base leading-7 opacity-75">{trip.body}</p>
                                  {(trip.galleryId || trip.linkUrl) && trip.linkLabel && <span className="mt-4 inline-flex text-sm font-semibold underline">{trip.linkLabel}</span>}
                                </article>
                              ))}
                            </div>
                          </section>
                        )}

                        {websiteBuilderPage === "articles" && (
                          <section
                            className={`p-8 ${websiteBuilderPage === "articles" && websiteBuilderSection === "articles" ? "ring-2 ring-[#d8a84f]" : ""}`}
                            data-website-section="page:articles"
                            onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "articles", "articles")}
                            onClick={() => {
                              setWebsiteBuilderPage("articles")
                              setWebsiteBuilderSection("articles")
                            }}
                            style={{ order: websiteSectionOrderIndex("page:articles") }}
                            tabIndex={0}
                            role="button"
                          >
                            {websiteSettings.showSectionHeadings["page:articles"] && websiteSettings.pageCopy.articlesHeadline && (
                              <h4 className="text-4xl font-semibold" data-website-edit-control="headline" style={{ textAlign: websiteSettings.headlineAlignment["page:articles"] }}>{websiteSettings.pageCopy.articlesHeadline}</h4>
                            )}
                            {(websiteSettings.showSectionBodies["page:articles"] ?? true) && websiteSettings.pageCopy.articlesBody && (
                              <p className="mt-5 text-lg leading-8 opacity-75" data-website-edit-control="body">{websiteSettings.pageCopy.articlesBody}</p>
                            )}
                          </section>
                        )}

                        {websiteBuilderPage === "custom" && activeCustomPage && (
                          <section
                            className={`p-8 ${websiteBuilderPage === "custom" && websiteBuilderSection === "articles" ? "ring-2 ring-[#d8a84f]" : ""}`}
                            data-website-section="page:custom"
                            onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "custom", "articles")}
                            onClick={() => {
                              setWebsiteBuilderPage("custom")
                              setWebsiteBuilderSection("articles")
                            }}
                            style={{ order: websiteSectionOrderIndex("page:custom") }}
                            tabIndex={0}
                            role="button"
                          >
                            {activeCustomPage.showHeadline && activeCustomPage.title && (
                              <h4 className="text-4xl font-semibold" data-website-edit-control="headline" style={{ textAlign: activeCustomPage.headlineAlignment }}>{activeCustomPage.title}</h4>
                            )}
                            {activeCustomPage.showBody && activeCustomPage.body && (
                              <p className="mt-5 whitespace-pre-wrap text-lg leading-8 opacity-75" data-website-edit-control="body">{activeCustomPage.body}</p>
                            )}
                          </section>
                        )}

                        {!["home", "about", "gear", "contact", "blog", "articles", "custom"].includes(websiteBuilderPage) && (
                          <section className="p-8">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b9842d]">{websitePageLabels[websiteBuilderPage]}</p>
                            <h4 className="mt-4 text-4xl font-semibold">{websiteBuilderPage === "custom" ? websiteSettings.customPageTitle : websitePageLabels[websiteBuilderPage]}</h4>
                            <p className="mt-5 max-w-2xl text-lg leading-8 opacity-70">
                              This page is enabled for navigation. Use its page settings to control the title, visibility, and available content.
                            </p>
                          </section>
                        )}
                        </div>
                        <footer className={`${websiteContentWidthClass} border-t border-current/10 px-6 py-6 text-xs opacity-75`}>
                          {orderedWebsiteNavItems.some((item) => item.placement === "bottom") && (
                            <nav aria-label="Website footer navigation" className="mb-5 flex flex-wrap gap-x-5 gap-y-2 font-medium">
                              {orderedWebsiteNavItems.filter((item) => item.placement === "bottom").map((item) => (
                                <button
                                  className="font-medium hover:underline"
                                  key={item.id}
                                  onClick={() => item.customPageId
                                    ? selectWebsiteCustomPage(item.customPageId)
                                    : selectWebsiteBuilderPage(item.pageKey)}
                                  type="button"
                                >
                                  {item.label}
                                </button>
                              ))}
                            </nav>
                          )}
                          <p className="max-w-4xl text-[11px] leading-5">{SUBSCRIBER_WEBSITE_CONTENT_NOTICE}</p>
                          <div className="mt-5 flex flex-col gap-3 border-t border-current/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <a
                              className="font-semibold underline-offset-4 hover:underline"
                              href="https://photoview.io"
                              onClick={(event) => event.stopPropagation()}
                              rel="noreferrer"
                              target="_blank"
                            >
                              Created with PhotoView.io
                            </a>
                            <nav aria-label="PhotoView.io policies" className="flex flex-wrap gap-x-4 gap-y-2">
                              <a href="https://photoview.io/terms" onClick={(event) => event.stopPropagation()} rel="noreferrer" target="_blank">Terms</a>
                              <a href="https://photoview.io/privacy" onClick={(event) => event.stopPropagation()} rel="noreferrer" target="_blank">Privacy</a>
                              <a href="https://photoview.io/copyright" onClick={(event) => event.stopPropagation()} rel="noreferrer" target="_blank">Copyright &amp; DMCA</a>
                            </nav>
                          </div>
                        </footer>
                      </div>
                    </div>
                  </div>
  )
}
