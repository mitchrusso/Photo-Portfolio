export type FeatureAcademyKey =
  | "academy_referral_reward"
  | "academy_website_builder"
  | "academy_blog_trip_diary"
  | "academy_affiliate_gear"
  | "academy_useful_articles"
  | "academy_social_queue"
  | "academy_portfolio_galleries"
  | "academy_mobile_companion"
  | "academy_embed_portfolios"
  | "academy_privacy_protection"
  | "academy_import_workflows"
  | "academy_library_organization"
  | "academy_sharing_tools"
  | "academy_business_pages"
  | "academy_merlin_help"

export const featureAcademyLaunchAt = new Date("2026-07-15T16:00:00.000Z")

export const featureAcademySequence: Array<{
  customerDay: number
  key: FeatureAcademyKey
  rolloutDay: number
}> = [
  { customerDay: 14, key: "academy_referral_reward", rolloutDay: 1 },
  { customerDay: 18, key: "academy_website_builder", rolloutDay: 5 },
  { customerDay: 22, key: "academy_blog_trip_diary", rolloutDay: 9 },
  { customerDay: 26, key: "academy_affiliate_gear", rolloutDay: 13 },
  { customerDay: 30, key: "academy_useful_articles", rolloutDay: 17 },
  { customerDay: 34, key: "academy_social_queue", rolloutDay: 21 },
  { customerDay: 38, key: "academy_portfolio_galleries", rolloutDay: 25 },
  { customerDay: 42, key: "academy_mobile_companion", rolloutDay: 29 },
  { customerDay: 46, key: "academy_embed_portfolios", rolloutDay: 33 },
  { customerDay: 50, key: "academy_privacy_protection", rolloutDay: 37 },
  { customerDay: 54, key: "academy_import_workflows", rolloutDay: 41 },
  { customerDay: 58, key: "academy_library_organization", rolloutDay: 45 },
  { customerDay: 62, key: "academy_sharing_tools", rolloutDay: 49 },
  { customerDay: 66, key: "academy_business_pages", rolloutDay: 53 },
  { customerDay: 70, key: "academy_merlin_help", rolloutDay: 57 },
]
