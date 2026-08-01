"use client"

import { ArrowDown, ArrowUp, ChevronUp } from "lucide-react"
import { createPortal } from "react-dom"
import type {
  Dispatch,
  RefObject,
  SetStateAction,
} from "react"
import {
  WebsiteAboutControls,
  type WebsiteAboutControlSettings,
} from "@/components/portfolio/website-builder/website-about-controls"
import {
  type WebsiteBuilderSectionKey,
  type WebsiteBuilderSettings,
  type WebsiteBuilderTool,
} from "@/components/portfolio/website-builder/website-builder-model"
import { WebsiteContactControls } from "@/components/portfolio/website-builder/website-contact-controls"
import { WebsiteHeadlineControls } from "@/components/portfolio/website-builder/website-headline-controls"
import {
  WebsiteHeroControls,
  type WebsiteHeroControlSettings,
  type WebsiteHeroLibraryItem,
} from "@/components/portfolio/website-builder/website-hero-controls"
import {
  WebsitePortfolioContentControls,
} from "@/components/portfolio/website-builder/website-portfolio-content-controls"
import {
  WebsitePageNavigationControls,
  WebsiteSectionBodyControls,
  WebsiteSectionEditorShell,
  WebsiteSectionVisibilityControl,
} from "@/components/portfolio/website-builder/website-section-editor-common"
import { WebsiteTripControls } from "@/components/portfolio/website-builder/website-trip-controls"
import {
  WebsiteGearEditor,
  WebsiteQuickAddGear,
} from "@/components/portfolio/website-gear-editor"
import type { PortfolioGallery } from "@/lib/gallery-utils"
import type {
  WebsiteBuilderPageKey,
  WebsiteCustomPage,
  WebsiteHeadlineAlignment,
  WebsiteHomeBlockOrderKey,
  WebsiteHomeSectionKey,
  WebsiteSectionOrderKey,
} from "@/lib/website-builder-rules"
import type { WebsiteGearCategory } from "@/lib/website-gear"

type UploadStatus = "idle" | "uploading" | "uploaded" | "error"

type WebsiteSectionEditorProps = {
  aboutImageUploadError: string
  aboutImageUploadStatus: UploadStatus
  aboutVideoConversionProgress: number | null
  aboutVideoUploadError: string
  aboutVideoUploadStatus: UploadStatus
  activeCustomPage: WebsiteCustomPage | null
  activeWebsiteHeadlineAlignment: WebsiteHeadlineAlignment
  activeWebsiteHomeBlock: WebsiteHomeSectionKey | null
  activeWebsitePageSection: Exclude<WebsiteBuilderPageKey, "home"> | null
  activeWebsiteSectionBody: string | null
  activeWebsiteSectionHeading: string
  activeWebsiteSectionKey: WebsiteSectionOrderKey
  activeWebsiteShowBody: boolean
  activeWebsiteShowHeadline: boolean
  fieldClass: string
  filteredWebsiteHeroLibraryItems: WebsiteHeroLibraryItem[]
  galleries: PortfolioGallery[]
  getWebsiteSectionLabel: (sectionKey: WebsiteSectionOrderKey) => string
  heroImageUploadStatus: UploadStatus
  heroLibraryQuery: string
  heroVideoConversionProgress: number | null
  heroVideoUploadError: string
  heroVideoUploadStatus: UploadStatus
  importAndSaveWebsiteGear: (gearCategories: WebsiteGearCategory[]) => void
  isDark: boolean
  isStoryPortfolioWebsite: boolean
  isWebsiteSectionVisible: (sectionKey: WebsiteSectionOrderKey) => boolean
  moveWebsiteHomeBlockByOffset: (blockKey: WebsiteHomeBlockOrderKey, offset: -1 | 1) => void
  moveWebsiteSectionByOffset: (sectionKey: WebsiteSectionOrderKey, offset: -1 | 1) => void
  mutedTextClass: string
  orderedWebsiteHomeBlockKeys: WebsiteHomeBlockOrderKey[]
  orderedWebsiteSectionKeys: WebsiteSectionOrderKey[]
  removeWebsiteAboutVideo: () => Promise<void>
  removeWebsiteHeroVideo: () => Promise<void>
  setHeroLibraryQuery: Dispatch<SetStateAction<string>>
  setWebsiteBuilderTool: Dispatch<SetStateAction<WebsiteBuilderTool>>
  setWebsiteInspectorOpen: Dispatch<SetStateAction<boolean>>
  setWebsiteSettings: Dispatch<SetStateAction<WebsiteBuilderSettings>>
  toggleWebsiteSectionNavigation: (
    pageKey: Exclude<WebsiteBuilderPageKey, "home">,
    isVisible: boolean,
  ) => void
  toggleWebsiteSectionVisibility: (sectionKey: WebsiteSectionOrderKey, isVisible: boolean) => void
  updateWebsiteCustomPage: (customPageId: string, patch: Partial<WebsiteCustomPage>) => void
  updateWebsiteSectionBody: (sectionKey: WebsiteSectionOrderKey, value: string) => void
  updateWebsiteSectionHeading: (sectionKey: WebsiteSectionOrderKey, value: string) => void
  uploadWebsiteAboutImage: (file: File) => Promise<void>
  uploadWebsiteAboutVideo: (file: File) => Promise<void>
  uploadWebsiteGearImage: (categoryId: string, itemId: string, file: File) => Promise<void>
  uploadWebsiteGearProductImage: (file: File) => Promise<string>
  uploadWebsiteHeroImage: (file: File) => Promise<void>
  uploadWebsiteHeroVideo: (file: File) => Promise<void>
  websiteBuilderPage: WebsiteBuilderPageKey
  websiteBuilderSection: WebsiteBuilderSectionKey
  websiteHeroLibraryItem?: WebsiteHeroLibraryItem
  websiteInlineEditorHost: Element | null
  websiteInspectorOpen: boolean
  websiteInspectorScrollRef: RefObject<HTMLElement | null>
  websiteSettings: WebsiteBuilderSettings
  websiteTemplateHasPositionableHeroCopy: boolean
}

export function WebsiteSectionEditor({
  aboutImageUploadError,
  aboutImageUploadStatus,
  aboutVideoConversionProgress,
  aboutVideoUploadError,
  aboutVideoUploadStatus,
  activeCustomPage,
  activeWebsiteHeadlineAlignment,
  activeWebsiteHomeBlock,
  activeWebsitePageSection,
  activeWebsiteSectionBody,
  activeWebsiteSectionHeading,
  activeWebsiteSectionKey,
  activeWebsiteShowBody,
  activeWebsiteShowHeadline,
  fieldClass,
  filteredWebsiteHeroLibraryItems,
  galleries,
  getWebsiteSectionLabel,
  heroImageUploadStatus,
  heroLibraryQuery,
  heroVideoConversionProgress,
  heroVideoUploadError,
  heroVideoUploadStatus,
  importAndSaveWebsiteGear,
  isDark,
  isStoryPortfolioWebsite,
  isWebsiteSectionVisible,
  moveWebsiteHomeBlockByOffset,
  moveWebsiteSectionByOffset,
  mutedTextClass,
  orderedWebsiteHomeBlockKeys,
  orderedWebsiteSectionKeys,
  removeWebsiteAboutVideo,
  removeWebsiteHeroVideo,
  setHeroLibraryQuery,
  setWebsiteBuilderTool,
  setWebsiteInspectorOpen,
  setWebsiteSettings,
  toggleWebsiteSectionNavigation,
  toggleWebsiteSectionVisibility,
  updateWebsiteCustomPage,
  updateWebsiteSectionBody,
  updateWebsiteSectionHeading,
  uploadWebsiteAboutImage,
  uploadWebsiteAboutVideo,
  uploadWebsiteGearImage,
  uploadWebsiteGearProductImage,
  uploadWebsiteHeroImage,
  uploadWebsiteHeroVideo,
  websiteBuilderPage,
  websiteBuilderSection,
  websiteHeroLibraryItem,
  websiteInlineEditorHost,
  websiteInspectorOpen,
  websiteInspectorScrollRef,
  websiteSettings,
  websiteTemplateHasPositionableHeroCopy,
}: WebsiteSectionEditorProps) {
  if (!websiteInspectorOpen || !websiteInlineEditorHost) return null

  return createPortal(

                  <WebsiteSectionEditorShell
                    isDark={isDark}
                    label={getWebsiteSectionLabel(activeWebsiteSectionKey)}
                    mutedTextClass={mutedTextClass}
                    onClose={() => setWebsiteInspectorOpen(false)}
                    scrollRef={websiteInspectorScrollRef}
                  >
                        {websiteBuilderSection === "gear" && (
                          <WebsiteQuickAddGear
                            affiliateSettings={websiteSettings.gearAffiliate}
                            categories={websiteSettings.gearCategories}
                            onAffiliateSettingsChange={(gearAffiliate) => setWebsiteSettings((current) => ({ ...current, gearAffiliate }))}
                            onImportAndSave={importAndSaveWebsiteGear}
                            onUploadProductImage={uploadWebsiteGearProductImage}
                          />
                        )}
                        <div className={`rounded-md border p-3 ${isDark ? "border-[#d8a84f]/35 bg-[#d8a84f]/10" : "border-[#e0bd69] bg-[#fff8e8]"}`} data-website-editor-field="section">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{getWebsiteSectionLabel(activeWebsiteSectionKey)}</p>
                              <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>Edit content, media, visibility, and layout here.</p>
                            </div>
                            <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                              isWebsiteSectionVisible(activeWebsiteSectionKey)
                                ? "border-emerald-700/20 text-emerald-700"
                                : "border-current/15 opacity-55"
                            }`}>
                              {isWebsiteSectionVisible(activeWebsiteSectionKey) ? "On page" : "Hidden"}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2">
                            {(
                            <>
                            <WebsiteSectionVisibilityControl
                              checked={isWebsiteSectionVisible(activeWebsiteSectionKey)}
                              isDark={isDark}
                              mutedTextClass={mutedTextClass}
                              onChange={(visible) => toggleWebsiteSectionVisibility(activeWebsiteSectionKey, visible)}
                            />

                            <WebsitePageNavigationControls
                              customPage={activeCustomPage}
                              enabledPages={websiteSettings.enabledPages}
                              fieldClass={fieldClass}
                              isDark={isDark}
                              mutedTextClass={mutedTextClass}
                              navigationLabels={websiteSettings.navigationLabels}
                              navigationPlacement={websiteSettings.navigationPlacement}
                              onSetCustomPage={(patch) => {
                                if (activeCustomPage) updateWebsiteCustomPage(activeCustomPage.id, patch)
                              }}
                              onSetPageEnabled={toggleWebsiteSectionNavigation}
                              onSetPageLabel={(page, label) => setWebsiteSettings((current) => ({
                                ...current,
                                navigationLabels: { ...current.navigationLabels, [page]: label },
                              }))}
                              onSetPagePlacement={(page, placement) => setWebsiteSettings((current) => ({
                                ...current,
                                navigationPlacement: { ...current.navigationPlacement, [page]: placement },
                              }))}
                              pageSection={activeWebsitePageSection}
                            />
                            </>
                            )}

                            {activeWebsiteHomeBlock !== "filmStrip" && (
                            <>
                            <WebsiteHeadlineControls
                              accentColor={websiteSettings.siteAccentColor}
                              alignment={activeWebsiteHeadlineAlignment}
                              fieldClass={fieldClass}
                              headline={activeWebsiteSectionHeading}
                              heroHeadlineScrollSlowdown={websiteSettings.heroHeadlineScrollSlowdown}
                              heroHeadlineScrollSpeed={websiteSettings.heroHeadlineScrollSpeed}
                              heroHeadlineSize={websiteSettings.heroHeadlineSize}
                              heroVerticalAlignment={websiteSettings.heroContentVerticalAlignment}
                              isDark={isDark}
                              isHero={activeWebsiteSectionKey === "home:hero"}
                              isStoryPortfolio={isStoryPortfolioWebsite}
                              mutedTextClass={mutedTextClass}
                              onSetAccentColor={(siteAccentColor) => setWebsiteSettings((current) => ({ ...current, siteAccentColor }))}
                              onSetAlignment={(headlineAlignment) => activeWebsiteSectionKey === "page:custom" && activeCustomPage
                                ? updateWebsiteCustomPage(activeCustomPage.id, { headlineAlignment })
                                : setWebsiteSettings((current) => ({
                                    ...current,
                                    headlineAlignment: { ...current.headlineAlignment, [activeWebsiteSectionKey]: headlineAlignment },
                                  }))}
                              onSetFontStyle={(siteFontStyle) => setWebsiteSettings((current) => ({ ...current, siteFontStyle }))}
                              onSetHeroHeadlineSize={(heroHeadlineSize) => setWebsiteSettings((current) => ({ ...current, heroHeadlineSize }))}
                              onSetHeroScrollSlowdown={(heroHeadlineScrollSlowdown) => setWebsiteSettings((current) => ({
                                ...current,
                                heroHeadlineScrollSlowdown,
                              }))}
                              onSetHeroScrollSpeed={(heroHeadlineScrollSpeed) => setWebsiteSettings((current) => ({
                                ...current,
                                heroHeadlineScrollSpeed,
                              }))}
                              onSetHeroVerticalAlignment={(heroContentVerticalAlignment) => setWebsiteSettings((current) => ({
                                ...current,
                                heroContentVerticalAlignment,
                              }))}
                              onSetShowHeadline={(showHeadline) => activeWebsiteSectionKey === "page:custom" && activeCustomPage
                                ? updateWebsiteCustomPage(activeCustomPage.id, { showHeadline })
                                : setWebsiteSettings((current) => ({
                                    ...current,
                                    showSectionHeadings: {
                                      ...current.showSectionHeadings,
                                      [activeWebsiteSectionKey]: showHeadline,
                                    },
                                  }))}
                              onUpdateHeadline={(headline) => updateWebsiteSectionHeading(activeWebsiteSectionKey, headline)}
                              sectionLabel={getWebsiteSectionLabel(activeWebsiteSectionKey)}
                              showHeadline={activeWebsiteShowHeadline}
                              siteFontStyle={websiteSettings.siteFontStyle}
                              template={websiteSettings.template}
                              templateHasPositionableHeroCopy={websiteTemplateHasPositionableHeroCopy}
                            />

                            <WebsiteSectionBodyControls
                              body={activeWebsiteSectionBody}
                              fieldClass={fieldClass}
                              isDark={isDark}
                              label={getWebsiteSectionLabel(activeWebsiteSectionKey)}
                              mutedTextClass={mutedTextClass}
                              onSetShowBody={(showBody) => activeWebsiteSectionKey === "page:custom" && activeCustomPage
                                ? updateWebsiteCustomPage(activeCustomPage.id, { showBody })
                                : setWebsiteSettings((current) => ({
                                    ...current,
                                    showSectionBodies: {
                                      ...current.showSectionBodies,
                                      [activeWebsiteSectionKey]: showBody,
                                    },
                                  }))}
                              onUpdateBody={(body) => updateWebsiteSectionBody(activeWebsiteSectionKey, body)}
                              showBody={activeWebsiteShowBody}
                            />
                            </>
                            )}
                          </div>
                        </div>

                        <div className={`grid grid-cols-2 gap-2 rounded-md border p-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"}`}>
                          <button
                            className={`flex h-9 items-center justify-center gap-2 rounded-md border text-xs font-semibold ${isDark ? "border-white/10" : "border-[#ded8cc] bg-white"}`}
                            disabled={activeWebsiteHomeBlock
                              ? orderedWebsiteHomeBlockKeys.indexOf(activeWebsiteHomeBlock) <= 0
                              : orderedWebsiteSectionKeys.indexOf(activeWebsiteSectionKey) <= 0}
                            onClick={() => activeWebsiteHomeBlock
                              ? moveWebsiteHomeBlockByOffset(activeWebsiteHomeBlock, -1)
                              : moveWebsiteSectionByOffset(activeWebsiteSectionKey, -1)}
                            type="button"
                          >
                            <ArrowUp className="size-3.5" />
                            Move up
                          </button>
                          <button
                            className={`flex h-9 items-center justify-center gap-2 rounded-md border text-xs font-semibold ${isDark ? "border-white/10" : "border-[#ded8cc] bg-white"}`}
                            disabled={activeWebsiteHomeBlock
                              ? orderedWebsiteHomeBlockKeys.indexOf(activeWebsiteHomeBlock) >= orderedWebsiteHomeBlockKeys.length - 1
                              : orderedWebsiteSectionKeys.indexOf(activeWebsiteSectionKey) >= orderedWebsiteSectionKeys.length - 1}
                            onClick={() => activeWebsiteHomeBlock
                              ? moveWebsiteHomeBlockByOffset(activeWebsiteHomeBlock, 1)
                              : moveWebsiteSectionByOffset(activeWebsiteSectionKey, 1)}
                            type="button"
                          >
                            <ArrowDown className="size-3.5" />
                            Move down
                          </button>
                        </div>

                        <WebsitePortfolioContentControls
                          activeBlock={activeWebsiteHomeBlock}
                          fieldClass={fieldClass}
                          galleries={galleries}
                          isDark={isDark}
                          mutedTextClass={mutedTextClass}
                          onSelectDisplayMode={(displayMode) =>
                            setWebsiteSettings((current) => ({
                              ...current,
                              enabledBlocks: {
                                ...current.enabledBlocks,
                                ...(activeWebsiteHomeBlock ? { [activeWebsiteHomeBlock]: true } : {}),
                              },
                              ...(activeWebsiteHomeBlock === "portfolioGrid"
                                ? { portfolioGridDisplayMode: displayMode }
                                : { workDisplayMode: displayMode }),
                            }))
                          }
                          onSelectGallery={(selectedGalleryId) =>
                            setWebsiteSettings((current) => ({
                              ...current,
                              enabledBlocks: {
                                ...current.enabledBlocks,
                                ...(activeWebsiteHomeBlock ? { [activeWebsiteHomeBlock]: true } : {}),
                              },
                              selectedGalleryId,
                            }))
                          }
                          onSelectWorkSource={(workSourceMode) =>
                            setWebsiteSettings((current) => {
                              const validFeaturedGalleryIds = current.featuredGalleryIds.filter((galleryId) =>
                                galleries.some((gallery) => gallery.id === galleryId),
                              )

                              return {
                                ...current,
                                enabledBlocks: {
                                  ...current.enabledBlocks,
                                  ...(activeWebsiteHomeBlock ? { [activeWebsiteHomeBlock]: true } : {}),
                                },
                                featuredGalleryIds: workSourceMode === "featured" && validFeaturedGalleryIds.length === 0
                                  ? galleries.slice(0, 4).map((gallery) => gallery.id)
                                  : validFeaturedGalleryIds,
                                workSourceMode,
                              }
                            })
                          }
                          onSetFilmStripGallery={(filmStripGalleryId) =>
                            setWebsiteSettings((current) => ({
                              ...current,
                              enabledBlocks: { ...current.enabledBlocks, filmStrip: true },
                              filmStripGalleryId,
                            }))
                          }
                          onSetFilmStripImageCount={(filmStripImageCount) =>
                            setWebsiteSettings((current) => ({
                              ...current,
                              filmStripImageCount,
                            }))
                          }
                          onToggleFeaturedGallery={(galleryId, selected) =>
                            setWebsiteSettings((current) => ({
                              ...current,
                              enabledBlocks: {
                                ...current.enabledBlocks,
                                ...(activeWebsiteHomeBlock ? { [activeWebsiteHomeBlock]: true } : {}),
                              },
                              featuredGalleryIds: selected
                                ? current.featuredGalleryIds.includes(galleryId)
                                  ? current.featuredGalleryIds
                                  : [...current.featuredGalleryIds, galleryId]
                                : current.featuredGalleryIds.filter((currentGalleryId) => currentGalleryId !== galleryId),
                            }))
                          }
                          settings={{
                            featuredGalleryIds: websiteSettings.featuredGalleryIds,
                            filmStripGalleryId: websiteSettings.filmStripGalleryId,
                            filmStripImageCount: websiteSettings.filmStripImageCount,
                            portfolioGridDisplayMode: websiteSettings.portfolioGridDisplayMode,
                            selectedGalleryId: websiteSettings.selectedGalleryId,
                            workDisplayMode: websiteSettings.workDisplayMode,
                            workSourceMode: websiteSettings.workSourceMode,
                          }}
                        />

                        {websiteBuilderSection === "hero" && (
                          <WebsiteHeroControls
                            fieldClass={fieldClass}
                            filteredLibraryItems={filteredWebsiteHeroLibraryItems}
                            galleries={galleries}
                            heroImageUploadStatus={heroImageUploadStatus}
                            heroVideoConversionProgress={heroVideoConversionProgress}
                            heroVideoUploadError={heroVideoUploadError}
                            heroVideoUploadStatus={heroVideoUploadStatus}
                            isDark={isDark}
                            isStoryPortfolio={isStoryPortfolioWebsite}
                            libraryItem={websiteHeroLibraryItem}
                            libraryQuery={heroLibraryQuery}
                            mutedTextClass={mutedTextClass}
                            onLibraryQueryChange={setHeroLibraryQuery}
                            onRemoveHeroVideo={removeWebsiteHeroVideo}
                            onUpdate={(patch: Partial<WebsiteHeroControlSettings>) => {
                              const { showCallToAction, ...heroSettingsPatch } = patch
                              setWebsiteSettings((current) => ({
                                ...current,
                                ...heroSettingsPatch,
                                ...(showCallToAction === undefined
                                  ? {}
                                  : {
                                      enabledBlocks: {
                                        ...current.enabledBlocks,
                                        callToAction: showCallToAction,
                                      },
                                    }),
                              }))
                            }}
                            onUploadHeroImage={uploadWebsiteHeroImage}
                            onUploadHeroVideo={uploadWebsiteHeroVideo}
                            settings={{
                              heroButtonLabel: websiteSettings.heroButtonLabel,
                              heroButtonUrl: websiteSettings.heroButtonUrl,
                              heroEyebrow: websiteSettings.heroEyebrow,
                              heroGalleryId: websiteSettings.heroGalleryId,
                              heroImageFit: websiteSettings.heroImageFit,
                              heroImageMode: websiteSettings.heroImageMode,
                              heroImagePosition: websiteSettings.heroImagePosition,
                              heroImageUrl: websiteSettings.heroImageUrl,
                              heroLayout: websiteSettings.heroLayout,
                              heroLibraryPhotoKey: websiteSettings.heroLibraryPhotoKey,
                              heroOverlayStrength: websiteSettings.heroOverlayStrength,
                              heroVideoUrl: websiteSettings.heroVideoUrl,
                              showCallToAction: websiteSettings.enabledBlocks.callToAction,
                              showHeroEyebrow: websiteSettings.showHeroEyebrow,
                            }}
                          />
                        )}

                          {websiteBuilderSection === "about" && (
                            <WebsiteAboutControls
                              fieldClass={fieldClass}
                              imageUploadError={aboutImageUploadError}
                              imageUploadStatus={aboutImageUploadStatus}
                              isDark={isDark}
                              mutedTextClass={mutedTextClass}
                              onRemoveVideo={removeWebsiteAboutVideo}
                              onUpdate={(patch: Partial<WebsiteAboutControlSettings>) => {
                                const { aboutButtonLabel, aboutButtonUrl, ...aboutMediaPatch } = patch
                                setWebsiteSettings((current) => ({
                                  ...current,
                                  ...aboutMediaPatch,
                                  pageCopy: {
                                    ...current.pageCopy,
                                    ...(aboutButtonLabel === undefined ? {} : { aboutButtonLabel }),
                                    ...(aboutButtonUrl === undefined ? {} : { aboutButtonUrl }),
                                  },
                                }))
                              }}
                              onUploadImage={uploadWebsiteAboutImage}
                              onUploadVideo={uploadWebsiteAboutVideo}
                              settings={{
                                aboutButtonLabel: websiteSettings.pageCopy.aboutButtonLabel,
                                aboutButtonUrl: websiteSettings.pageCopy.aboutButtonUrl,
                                aboutImageUrl: websiteSettings.aboutImageUrl,
                                aboutVideoUrl: websiteSettings.aboutVideoUrl,
                              }}
                              videoConversionProgress={aboutVideoConversionProgress}
                              videoUploadError={aboutVideoUploadError}
                              videoUploadStatus={aboutVideoUploadStatus}
                            />
                          )}

                          {websiteBuilderSection === "gear" && (
                            <div className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"}`} data-website-editor-field="content">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em]">Equipment</p>
                              <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
                                Add each product name, a short note, and its optional product or affiliate URL. Use Add product for more items. The trash icon removes an item; click Save changes afterward to keep the change. Blank products stay private.
                              </p>
                              <WebsiteGearEditor
                                categories={websiteSettings.gearCategories}
                                onChange={(gearCategories) => setWebsiteSettings((current) => ({ ...current, gearCategories }))}
                                onUploadImage={uploadWebsiteGearImage}
                                variant="panel"
                              />
                            </div>
                          )}

                        {websiteBuilderPage === "blog" && (
                          <WebsiteTripControls
                            fieldClass={fieldClass}
                            galleries={galleries}
                            isDark={isDark}
                            mutedTextClass={mutedTextClass}
                            onChange={(tripEntries) => setWebsiteSettings((current) => ({ ...current, tripEntries }))}
                            tripEntries={websiteSettings.tripEntries}
                          />
                        )}

                        {websiteBuilderSection === "contact" && (
                          <WebsiteContactControls
                            contactEmail={websiteSettings.contactEmail}
                            fieldClass={fieldClass}
                            isDark={isDark}
                            mutedTextClass={mutedTextClass}
                            onChange={(contactEmail) => setWebsiteSettings((current) => ({ ...current, contactEmail }))}
                          />
                        )}
                        {activeWebsiteHomeBlock !== "featuredPortfolio" && activeWebsiteHomeBlock !== "portfolioGrid" && activeWebsiteHomeBlock !== "filmStrip" && (
                          <div className={`rounded-md border p-3 text-xs leading-5 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"} ${mutedTextClass}`}>
                            This section uses the selected site design. Open <button className="font-semibold text-[#9b6d22] underline" onClick={() => { setWebsiteInspectorOpen(false); setWebsiteBuilderTool("style") }} type="button">Template controls</button> to change its typography, colors, image frame, or image shape.
                          </div>
                        )}

                        <button
                          aria-label={`Close ${getWebsiteSectionLabel(activeWebsiteSectionKey)} editor`}
                          className={`flex h-11 w-full items-center justify-center gap-2 rounded-md border text-sm font-semibold ${isDark ? "border-white/15 bg-white/[0.06]" : "border-[#cfc5b5] bg-white"}`}
                          onClick={() => setWebsiteInspectorOpen(false)}
                          type="button"
                        >
                          <ChevronUp className="size-4" />
                          Close section
                        </button>

                  </WebsiteSectionEditorShell>,
                  websiteInlineEditorHost,
  )
}
