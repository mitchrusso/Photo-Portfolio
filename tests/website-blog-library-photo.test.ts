import assert from "node:assert/strict"
import test from "node:test"

import { publishedWebsiteIncludesBlogPhoto } from "../src/lib/website-public-cover.ts"

test("published websites expose only the Library photo explicitly selected for a blog entry", () => {
  const publishedBody = JSON.stringify({
    enabledPages: { blog: true },
    tripEntries: [
      {
        body: "A field note",
        galleryId: "public-portfolio",
        id: "trip-1",
        imageGalleryId: "private-library-source",
        imagePhotoId: "selected-photo",
        imageUrl: "/api/media/private-library-source/selected-photo?variant=display",
        linkLabel: "View portfolio",
        linkUrl: "",
        meta: "",
        title: "On location",
      },
    ],
  })

  assert.equal(
    publishedWebsiteIncludesBlogPhoto(
      publishedBody,
      ["private-library-source", "private-source-slug"],
      ["selected-photo"],
    ),
    true,
  )
  assert.equal(
    publishedWebsiteIncludesBlogPhoto(publishedBody, ["private-library-source"], ["another-photo"]),
    false,
  )
  assert.equal(
    publishedWebsiteIncludesBlogPhoto(publishedBody, ["another-gallery"], ["selected-photo"]),
    false,
  )
})

test("legacy blog entries remain valid and do not expose a Library photo", () => {
  const legacyPublishedBody = JSON.stringify({
    enabledPages: { blog: true },
    tripEntries: [
      {
        body: "Existing story",
        galleryId: "public-portfolio",
        id: "trip-legacy",
        linkLabel: "View portfolio",
        linkUrl: "",
        meta: "",
        title: "Existing trip",
      },
    ],
  })

  assert.equal(
    publishedWebsiteIncludesBlogPhoto(legacyPublishedBody, ["public-portfolio"], ["photo-1"]),
    false,
  )
  assert.equal(publishedWebsiteIncludesBlogPhoto("not-json", ["gallery"], ["photo"]), false)
})

test("a Library photo stops being public when its blog page is not published", () => {
  const hiddenBlog = JSON.stringify({
    enabledPages: { blog: false },
    tripEntries: [{ imageGalleryId: "gallery", imagePhotoId: "photo" }],
    visiblePages: { blog: false },
  })

  assert.equal(publishedWebsiteIncludesBlogPhoto(hiddenBlog, ["gallery"], ["photo"]), false)
})
