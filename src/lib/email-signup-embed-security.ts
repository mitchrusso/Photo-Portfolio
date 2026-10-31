import sanitizeHtml from "sanitize-html"

import {
  detectEmailSignupProvider,
  getHostedEmailSignupUrl,
  isAllowedEmailSignupUrl,
} from "./email-signup-providers.ts"

const MAX_EMAIL_SIGNUP_EMBED_LENGTH = 50_000

function safeProviderUrl(value: string | undefined, provider: ReturnType<typeof detectEmailSignupProvider>) {
  const normalized = value?.startsWith("//") ? `https:${value}` : value
  return normalized && isAllowedEmailSignupUrl(normalized, provider) ? normalized : ""
}

export function sanitizeEmailSignupEmbed(value: unknown) {
  if (typeof value !== "string") return ""
  const input = value.trim().slice(0, MAX_EMAIL_SIGNUP_EMBED_LENGTH)
  const provider = detectEmailSignupProvider(input)
  if (!provider) return ""

  const hostedUrl = getHostedEmailSignupUrl(input)
  if (hostedUrl) return hostedUrl

  return sanitizeHtml(input, {
    // Provider scripts and styles run only inside the renderer's sandboxed,
    // no-same-origin iframe. Inline scripts and unapproved script URLs are
    // removed below before the markup can reach that boundary.
    allowVulnerableTags: true,
    allowedAttributes: {
      "*": ["aria-label", "aria-describedby", "class", "data-*", "id", "role", "style"],
      a: ["href", "target", "rel"],
      button: ["name", "type", "value"],
      form: ["accept-charset", "action", "method", "target"],
      iframe: ["height", "loading", "src", "title", "width"],
      input: ["autocomplete", "checked", "id", "name", "placeholder", "required", "type", "value"],
      label: ["for"],
      option: ["selected", "value"],
      script: ["async", "defer", "src", "type"],
      select: ["id", "name", "required"],
      textarea: ["id", "name", "placeholder", "required", "rows"],
    },
    allowedSchemes: ["https"],
    allowedTags: [
      "a", "b", "button", "div", "em", "fieldset", "form", "h1", "h2", "h3", "h4", "iframe",
      "input", "label", "legend", "li", "ol", "option", "p", "script", "select", "small", "span",
      "strong", "style", "textarea", "ul",
    ],
    exclusiveFilter(frame) {
      if (frame.tag === "script") return !safeProviderUrl(frame.attribs.src, provider)
      if (frame.tag === "iframe") return !safeProviderUrl(frame.attribs.src, provider)
      return false
    },
    parseStyleAttributes: false,
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          ...attribs,
          href: safeProviderUrl(attribs.href, provider),
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      form: (_tagName, attribs) => ({
        tagName: "form",
        attribs: {
          ...attribs,
          action: safeProviderUrl(attribs.action, provider),
          method: attribs.method?.toLowerCase() === "get" ? "get" : "post",
          target: "_blank",
        },
      }),
      iframe: (_tagName, attribs) => ({
        tagName: "iframe",
        attribs: {
          ...attribs,
          loading: "lazy",
          src: safeProviderUrl(attribs.src, provider),
          title: attribs.title || "Email signup form",
        },
      }),
      script: (_tagName, attribs) => ({
        tagName: "script",
        attribs: {
          ...attribs,
          src: safeProviderUrl(attribs.src, provider),
        },
      }),
    },
  }).trim()
}
