# PhotoView.io Lightroom Classic Plugin

PhotoView.io includes a Lightroom Classic export plugin at:

`lightroom/PhotoViewIo.lrplugin`

This first version lets a photographer select photos in Lightroom, export rendered images, and send them directly into a PhotoView.io gallery through `/api/lightroom/import`.

## Install The Plugin

1. Open Lightroom Classic.
2. Choose `File > Plug-in Manager`.
3. Click `Add`.
4. Select the folder `lightroom/PhotoViewIo.lrplugin`.
5. Confirm that Lightroom shows `PhotoView.io` as installed and enabled.

## Export To PhotoView.io

1. Select one or more photos in Lightroom Classic.
2. Choose `File > Export`.
3. In `Export To`, choose `PhotoView.io`.
4. Set the export file settings the way you want PhotoView.io to receive them.
5. Fill in:
   - `API URL`: `http://localhost:3000` for local development, or the live PhotoView.io URL.
   - `API Key`: the private 90-day key generated in PhotoView.io under `Settings > Imports`.
   - `Gallery name`: the PhotoView.io gallery to create or append to.
   - `Client`: optional client or project name.
   - `Make gallery public after upload`: marks the import intent as public.
6. Click `Export`.

## Required Environment Variables

The PhotoView.io app needs a configured photo storage provider. Production should use Cloudflare R2:

```bash
PHOTO_STORAGE_PROVIDER="r2"
CLOUDFLARE_R2_ACCOUNT_ID="..."
CLOUDFLARE_R2_ACCESS_KEY_ID="..."
CLOUDFLARE_R2_SECRET_ACCESS_KEY="..."
CLOUDFLARE_R2_BUCKET="..."
```

The R2 bucket must remain private. Disable both its `r2.dev` public URL and public custom-domain access. PhotoView.io stores opaque `r2://` object references and authorizes each request before issuing a short-lived signed delivery URL. `CLOUDFLARE_R2_PUBLIC_BASE_URL` is optional and should only be retained temporarily if the database still contains legacy public R2 URLs.

The legacy Vercel Blob provider is still available only when explicitly selected:

```bash
PHOTO_STORAGE_PROVIDER="vercel-blob"
BLOB_READ_WRITE_TOKEN="..."
```

Older installations may use a server-managed legacy key:

```bash
PHOTOVIEWPRO_IMPORT_API_KEY="choose-a-long-private-key"
```

New subscribers should use the workspace-scoped key generated inside PhotoView.io instead. The import endpoint is never open without a valid subscriber token or configured legacy key.

## Current Behavior

- Uploads rendered files from Lightroom export settings.
- Stores images privately in the configured photo storage provider.
- Attaches each import to the authenticated subscriber workspace and selected portfolio.
- Preserves title, caption, capture time, and original file name metadata.
- Enforces the subscriber's portfolio-count and storage capacity.

## Current Limit

The plugin creates or appends to a portfolio by name. Lightroom-side portfolio lookup and collection synchronization are not yet available.
