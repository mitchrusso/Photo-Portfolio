# PhotoView.io Domain Connect onboarding

PhotoView.io uses the free Domain Connect synchronous flow. No paid DNS
automation intermediary is required. Domain Connect is an open standard, and
PhotoView does not need to buy an automation service to use this flow.

## Templates

- `domain-connect-templates/photoview.io.website-apex.json`
- `domain-connect-templates/photoview.io.website-subdomain.json`

The apex template creates the Vercel-recommended A record. The subdomain
template creates the Vercel-recommended CNAME record. PhotoView requests the
current destination from Vercel and cryptographically signs that exact value.

## Required production configuration

1. Generate a 2048-bit or stronger RSA key pair.
2. Store the base64-encoded private PEM only in the production secret
   `DOMAIN_CONNECT_PRIVATE_KEY_BASE64`.
3. Keep `DOMAIN_CONNECT_KEY_LABEL` set to `_dcpubkeyv1` unless rotating keys.
4. Export the public key as DER SubjectPublicKeyInfo, base64 encode it, split
   it into DNS-safe fragments, and publish the fragments as TXT records at
   `_dcpubkeyv1.photoview.io`:

   `p=1,a=RS256,d=<first fragment>`

   Continue with `p=2`, `p=3`, and so on. Publish exactly one public key at a
   key label. Use a new label during rotation.

The private key must never be committed, logged, returned to the browser, or
placed in a `NEXT_PUBLIC_` environment variable.

## Provider onboarding

1. Validate both templates with the official
   `Domain-Connect/dc-template-linter`. Both current templates pass its general
   validation. Cloudflare's optional rules currently report informational
   compatibility notes, so keep Cloudflare on guided setup until its onboarding
   review is complete.
2. Test apex and subdomain replacements in the official linked online editor
   and retain its generated test-result link.
3. Submit the templates to the official repository using its pull-request
   template.
4. After merge, complete each provider's free onboarding process. Cloudflare
   currently also requests the template links, public-key DNS hostname, SVG
   logo, desired proxy behavior, and optionally a test account.
5. Confirm the provider's supported-template endpoint returns a successful
   status for the relevant service ID.

PhotoView automatically hides one-click setup until the provider reports that
the exact template is supported and production signing is configured.

## Callback security

The callback state is random, signed, expires after ten minutes, and is bound
to the authenticated workspace and exact domain. A provider callback never
marks a domain connected. It only triggers Vercel and DNS verification; those
checks remain authoritative because DNS propagation may continue after the
provider returns.

## Manual fallback

Provider detection, direct DNS-dashboard links, exact record values, copy
buttons, and connection checks remain available when Domain Connect is
unsupported, not onboarded, temporarily unavailable, or cancelled.
