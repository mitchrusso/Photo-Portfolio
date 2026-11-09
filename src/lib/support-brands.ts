import { z } from "zod"

const brandSchema = z.object({
  adminUrl: z.string().url(),
  appUrl: z.string().url(),
  key: z.literal("photoview"),
  name: z.literal("PhotoView.io"),
  supportEmail: z.literal("support@photoview.io"),
})

export type SupportBrand = z.infer<typeof brandSchema>
export type SupportBrandKey = SupportBrand["key"]

const registry: Record<SupportBrandKey, SupportBrand> = {
  photoview: brandSchema.parse({
    adminUrl: "https://photoview.io/admin/feedback",
    appUrl: "https://photoview.io",
    key: "photoview",
    name: "PhotoView.io",
    supportEmail: "support@photoview.io",
  }),
}

export function getSupportBrand(key: SupportBrandKey = "photoview") {
  return registry[key]
}

export function assertSupportBrand(key: string): SupportBrand {
  if (key !== "photoview") throw new Error(`Unsupported support brand: ${key}`)
  return registry.photoview
}
