# Private Cloudflare R2 media

PhotoViewPro uses Cloudflare R2 as private object storage. A browser never receives a permanent R2 object URL.

## Delivery flow

1. Uploads are written to R2 with private cache metadata.
2. The database stores an opaque `r2://bucket/object-key` reference.
3. The browser requests `/api/media/{gallery}/{photo}?variant=...`.
4. PhotoViewPro verifies the subscriber, gallery status, privacy/password access, hidden-photo state, download policy, and bandwidth policy.
5. The server records metered delivery and redirects to an R2 signed GET URL that expires after 60 seconds.

Signed URLs are bearer credentials during their short lifetime. Keep them out of logs and never persist them in the database.

## Required production settings

```dotenv
PHOTO_STORAGE_PROVIDER="r2"
CLOUDFLARE_R2_ACCOUNT_ID="..."
CLOUDFLARE_R2_ACCESS_KEY_ID="..."
CLOUDFLARE_R2_SECRET_ACCESS_KEY="..."
CLOUDFLARE_R2_BUCKET="photoviewpro-media"
CLOUDFLARE_R2_ENDPOINT="https://ACCOUNT_ID.r2.cloudflarestorage.com"
PUBLIC_PORTFOLIO_WORKSPACE_SLUG="your-workspace-slug"
```

Create an R2 API token restricted to Object Read & Write for the PhotoViewPro media bucket. Store its S3 Access Key ID and Secret Access Key only in Vercel environment variables. Rotate the token if it is ever exposed.

Both the bucket's `r2.dev` public URL and custom-domain public access must be disabled. R2 signed URLs use the S3 API endpoint, not a custom domain.

## Legacy URL migration

For existing Vercel Blob objects, first preview and then run the resumable copy migration:

```bash
npm run r2:migrate-vercel-blob
npm run r2:migrate-vercel-blob -- --apply
```

The command copies each unique object into private R2, updates each database row only after its objects succeed, and retains the Vercel source objects for rollback verification.

During migration only, retain the old public prefix:

```dotenv
CLOUDFLARE_R2_PUBLIC_BASE_URL="https://media.example.com"
```

Preview the conversion:

```bash
npm run r2:migrate-private-references
```

Apply it:

```bash
npm run r2:migrate-private-references -- --apply
```

The apply command creates a permission-restricted JSON backup under `exports/` and prints an exact rollback command. After the database is converted and private delivery is verified, the legacy base URL can be removed.

## Release verification

- Upload an image and confirm its database URL begins with `r2://`.
- Open a public gallery and confirm the media route returns a `307` to a URL containing `X-Amz-Expires=60`.
- Confirm a private, hidden, or password-protected photo cannot be fetched without its required access.
- Confirm direct requests through the old custom domain and `r2.dev` fail.
- Confirm downloads respect the gallery's download setting and return an attachment disposition.
