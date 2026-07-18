import assert from "node:assert/strict"
import test from "node:test"
import {
  createSecureShareToken,
  parseSecureShareToken,
  secureShareTargetAllows,
  secureShareTargetAllowsGalleryAsset,
} from "../src/lib/secure-share-links.ts"

process.env.AUTH_SECRET = "test-only-secure-share-secret-that-is-long-enough"

test("secure share tokens round-trip without exposing target names", () => {
  const target = {
    gallerySlug: "private-family-gallery",
    photoId: "photo-42",
    type: "photo" as const,
    workspaceSlug: "subscriber-workspace",
  }
  const token = createSecureShareToken(target)

  assert.match(token, /^pv1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
  assert.equal(token.includes(target.gallerySlug), false)
  assert.equal(token.includes(target.workspaceSlug), false)
  assert.deepEqual(parseSecureShareToken(token), target)
})

test("secure share tokens reject tampering and malformed values", () => {
  const token = createSecureShareToken({ gallerySlug: "egypt", type: "gallery", workspaceSlug: "mitch" })
  const lastCharacter = token.at(-1)
  const tampered = `${token.slice(0, -1)}${lastCharacter === "A" ? "B" : "A"}`

  assert.equal(parseSecureShareToken(tampered), null)
  assert.equal(parseSecureShareToken("pv1.invalid"), null)
  assert.equal(parseSecureShareToken("x".repeat(1_501)), null)
})

test("photo share tokens authorize only their exact photo while gallery tokens authorize the gallery", () => {
  const photoTarget = parseSecureShareToken(createSecureShareToken({
    gallerySlug: "egypt",
    photoId: "sphinx",
    type: "photo",
    workspaceSlug: "mitch",
  }))
  const galleryTarget = parseSecureShareToken(createSecureShareToken({
    gallerySlug: "egypt",
    type: "gallery",
    workspaceSlug: "mitch",
  }))

  assert.equal(secureShareTargetAllows(photoTarget, { gallerySlug: "egypt", photoId: "sphinx", workspaceSlug: "mitch" }), true)
  assert.equal(secureShareTargetAllows(photoTarget, { gallerySlug: "egypt", photoId: "temple", workspaceSlug: "mitch" }), false)
  assert.equal(secureShareTargetAllows(photoTarget, { gallerySlug: "myanmar", photoId: "sphinx", workspaceSlug: "mitch" }), false)
  assert.equal(secureShareTargetAllows(galleryTarget, { gallerySlug: "egypt", photoId: "temple", workspaceSlug: "mitch" }), true)
  assert.equal(secureShareTargetAllowsGalleryAsset(photoTarget, { gallerySlug: "egypt", workspaceSlug: "mitch" }), true)
})
