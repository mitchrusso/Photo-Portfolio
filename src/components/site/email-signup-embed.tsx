import {
  detectEmailSignupProvider,
  emailSignupProviderLabel,
  getHostedEmailSignupUrl,
} from "@/lib/email-signup-providers"

type EmailSignupEmbedProps = {
  embedCode: string
  interactive?: boolean
}

export function EmailSignupEmbed({ embedCode, interactive = true }: EmailSignupEmbedProps) {
  const provider = detectEmailSignupProvider(embedCode)
  const providerLabel = emailSignupProviderLabel(provider)
  const hostedUrl = getHostedEmailSignupUrl(embedCode)

  if (!provider) {
    return (
      <div className="mt-5 rounded-lg border border-dashed border-current/25 p-5 text-sm opacity-70">
        Paste a supported email provider&apos;s form code or hosted form link in the block controls.
      </div>
    )
  }

  if (!interactive) {
    return (
      <div className="mt-5 rounded-lg border border-current/15 bg-current/[0.04] p-5 text-sm">
        <p className="font-semibold">{providerLabel} signup form connected</p>
        <p className="mt-1 opacity-65">Save and preview your website to test the live form.</p>
      </div>
    )
  }

  if (hostedUrl) {
    return (
      <a
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-current px-5 py-3 text-sm font-semibold transition hover:opacity-70"
        href={hostedUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        Join the email list
      </a>
    )
  }

  return (
    <iframe
      className="mt-5 min-h-96 w-full rounded-lg border border-current/15 bg-white"
      referrerPolicy="no-referrer"
      sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-scripts"
      srcDoc={embedCode}
      title={`${providerLabel} email signup form`}
    />
  )
}
