import type { SiteSettings } from "@/lib/gallery-utils"

export const socialAccountFields: Array<{
  brandColor: string
  key: keyof SiteSettings["socialAccounts"]
  label: string
  placeholder: string
  shareStyle: "direct" | "copy-open"
}> = [
  {
    brandColor: "#1877f2",
    key: "facebook",
    label: "Facebook",
    placeholder: "@your-page or full URL",
    shareStyle: "direct",
  },
  {
    brandColor: "#e4405f",
    key: "instagram",
    label: "Instagram",
    placeholder: "@your-handle or full URL",
    shareStyle: "copy-open",
  },
  {
    brandColor: "#0a66c2",
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "your-profile or full URL",
    shareStyle: "direct",
  },
  {
    brandColor: "#bd081c",
    key: "pinterest",
    label: "Pinterest",
    placeholder: "@your-profile or full URL",
    shareStyle: "direct",
  },
  {
    brandColor: "#111111",
    key: "x",
    label: "X",
    placeholder: "@your-handle or full URL",
    shareStyle: "direct",
  },
  {
    brandColor: "#111111",
    key: "tiktok",
    label: "TikTok",
    placeholder: "@your-handle or full URL",
    shareStyle: "copy-open",
  },
  {
    brandColor: "#ff0000",
    key: "youtube",
    label: "YouTube",
    placeholder: "@your-channel or full URL",
    shareStyle: "copy-open",
  },
]

export function SocialIcon({ platform }: { platform: keyof SiteSettings["socialAccounts"] }) {
  const commonClass = "size-4 fill-current"

  switch (platform) {
    case "facebook":
      return (
        <svg aria-hidden="true" className={commonClass} viewBox="0 0 24 24">
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.23.2 2.23.2v2.47h-1.25c-1.24 0-1.62.77-1.62 1.56v1.9h2.76l-.44 2.91h-2.32V22C18.34 21.24 22 17.08 22 12.06z" />
        </svg>
      )
    case "instagram":
      return (
        <svg aria-hidden="true" className={commonClass} viewBox="0 0 24 24">
          <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
        </svg>
      )
    case "linkedin":
      return (
        <svg aria-hidden="true" className={commonClass} viewBox="0 0 24 24">
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.32 7.44a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.01H3.54V9H7.1v11.45z" />
        </svg>
      )
    case "pinterest":
      return (
        <svg aria-hidden="true" className={commonClass} viewBox="0 0 24 24">
          <path d="M12.04 2C6.52 2 3 5.82 3 10.15c0 2.01 1.08 4.52 2.81 5.32.26.12.4.07.46-.18.04-.19.28-1.11.39-1.54.03-.14.02-.26-.1-.4-.57-.68-1.03-1.93-1.03-3.1 0-3.02 2.29-5.94 6.18-5.94 3.36 0 5.72 2.29 5.72 5.56 0 3.69-1.86 6.24-4.28 6.24-1.34 0-2.34-1.1-2.02-2.46.38-1.62 1.12-3.37 1.12-4.54 0-1.05-.56-1.92-1.72-1.92-1.37 0-2.47 1.42-2.47 3.32 0 1.21.41 2.03.41 2.03s-1.35 5.72-1.6 6.79c-.28 1.2-.17 2.88-.05 3.97.04.35.47.47.65.16.55-.95 1.45-2.58 1.76-3.74.17-.63.87-3.2.87-3.2.46.86 1.78 1.58 3.19 1.58 4.2 0 7.23-3.86 7.23-8.65C20.53 5.36 17.2 2 12.04 2z" />
        </svg>
      )
    case "x":
      return (
        <svg aria-hidden="true" className={commonClass} viewBox="0 0 24 24">
          <path d="M18.9 2.5h3.02l-6.6 7.55 7.76 10.27h-6.08l-4.76-6.23-5.45 6.23H3.76l7.06-8.07L3.38 2.5h6.23l4.3 5.69 4.99-5.69zm-1.06 16.01h1.67L8.71 4.21H6.92l10.92 14.3z" />
        </svg>
      )
    case "tiktok":
      return (
        <svg aria-hidden="true" className={commonClass} viewBox="0 0 24 24">
          <path d="M16.6 2c.34 2.5 1.75 4 4.24 4.16v3.02a7.18 7.18 0 0 1-4.16-1.32v6.58c0 4.15-2.72 6.84-6.7 6.84-3.45 0-6.82-2.28-6.82-6.2 0-4.09 3.52-6.35 7.06-6.02v3.16c-1.77-.28-3.85.78-3.85 2.77 0 1.8 1.55 2.95 3.33 2.95 2.12 0 3.52-1.22 3.52-3.68V2h3.38z" />
        </svg>
      )
    case "youtube":
      return (
        <svg aria-hidden="true" className={commonClass} viewBox="0 0 24 24">
          <path d="M21.58 7.19a2.75 2.75 0 0 0-1.94-1.95C17.93 4.78 12 4.78 12 4.78s-5.93 0-7.64.46a2.75 2.75 0 0 0-1.94 1.95A28.65 28.65 0 0 0 2 12a28.65 28.65 0 0 0 .42 4.81 2.75 2.75 0 0 0 1.94 1.95c1.71.46 7.64.46 7.64.46s5.93 0 7.64-.46a2.75 2.75 0 0 0 1.94-1.95A28.65 28.65 0 0 0 22 12a28.65 28.65 0 0 0-.42-4.81zM10 15.27V8.73L15.45 12 10 15.27z" />
        </svg>
      )
  }
}
