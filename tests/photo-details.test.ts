import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import { mergeEditablePhotoDetails } from "../src/lib/photo-details.ts"

test("photo detail updates preserve internal metadata and normalize editable values", () => {
  const result = mergeEditablePhotoDetails(
    {
      assetPurpose: "portfolio",
      externalId: "legacy-photo-id",
      location: "Old location",
      notes: "Old notes",
    },
    {
      category: "  Travel  ",
      location: "  Adirondacks, New York  ",
      notes: "   ",
      tags: [" Drone ", "Travel", "Drone", ""],
    },
  )

  assert.deepEqual(result, {
    assetPurpose: "portfolio",
    category: "Travel",
    externalId: "legacy-photo-id",
    location: "Adirondacks, New York",
    tags: ["Drone", "Travel"],
  })
})

test("Library photo details remain scrollable and have an explicit persistence action", () => {
  const dashboard = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const route = readFileSync(join(process.cwd(), "src/app/api/portfolio/galleries/[galleryId]/photos/[photoId]/route.ts"), "utf8")
  const styles = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")

  assert.match(dashboard, /xl:max-h-\[calc\(100dvh-6\.5rem\)\]/)
  assert.match(dashboard, /library-details-scrollbar min-h-0 flex-1/)
  assert.match(dashboard, /xl:overflow-y-scroll/)
  assert.match(dashboard, /"Save changes"/)
  assert.match(dashboard, /saveLibraryPhotoDetails\(activeLibraryItem\)/)
  assert.match(route, /mergeEditablePhotoDetails\(result\.photo\.metadata, parsed\.data\)/)
  assert.match(route, /tags: z\.array\(z\.string\(\)\.max\(80\)\)\.max\(50\)\.optional\(\)/)
  assert.match(styles, /\.library-details-scrollbar::\-webkit-scrollbar-thumb/)
})
