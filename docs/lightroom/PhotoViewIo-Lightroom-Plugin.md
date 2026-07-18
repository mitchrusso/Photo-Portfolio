# PhotoView.io Lightroom Classic Plugin

The PhotoView.io plugin lets a photographer select finished photographs in Lightroom Classic and send them directly into a new or existing PhotoView.io portfolio. The photographer does not need to export files to a folder and upload them again.

## The Workflow

1. Select finished photographs in Lightroom Classic.
2. Open `File > Export` and choose `PhotoView.io`.
3. Choose `Create a new portfolio` or `Add to an existing portfolio`.
4. Click `Export` and review the completed portfolio in PhotoView.io.

## Install The Plugin

1. Download the plugin ZIP from PhotoView.io under `Settings > Imports`.
2. Open the ZIP file and move the resulting `PhotoViewIo.lrplugin` folder somewhere permanent, such as the Pictures folder.
3. Open Lightroom Classic and choose `File > Plug-in Manager`.
4. Click `Add` and select the `PhotoViewIo.lrplugin` folder.
5. Confirm that Lightroom shows the plugin as `Installed and running`.

Keep the plugin folder in its permanent location. Lightroom references that folder after installation, so moving or deleting it requires reinstalling the plugin.

## Connect The Subscriber Account

1. In PhotoView.io, open `Settings > Imports`.
2. Turn on Lightroom imports.
3. Generate the private 90-day API key and save the Imports settings.
4. Copy the API URL and API key into Lightroom's PhotoView.io Export panel.

The API URL identifies the PhotoView.io site. An endpoint is the secure receiving address used by the plugin. Subscribers do not need to type the endpoint; the plugin automatically adds `/api/lightroom/import` to the API URL.

## Export To PhotoView.io

1. Select one or more finished photographs in Lightroom Classic's Library module.
2. Choose `File > Export`.
3. In `Export To`, choose `PhotoView.io`.
4. Paste the API URL and API key the first time the plugin is used.
5. Under Destination, choose one of these paths:
   - `Create a new portfolio`: enter the new portfolio name and optional client name.
   - `Add to an existing portfolio`: click `Refresh portfolios` and select the destination from the returned list.
6. Optionally select `Make portfolio public after upload` for a new destination. Existing portfolios keep their current access settings.
7. Click `Export`.

The plugin transfers available Lightroom title, caption, capture date, and original file-name metadata with each photograph. New photographs are added to the end of an existing portfolio.

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
- Refreshes the authenticated subscriber's portfolio list inside Lightroom.
- Creates a new portfolio or appends to the selected existing portfolio.
- Stores images privately in the configured photo storage provider.
- Preserves title, caption, capture time, and original file name metadata.
- Enforces the subscriber's portfolio-count and storage capacity.

## Troubleshooting

- If no portfolios appear, confirm the API URL and key, then click `Refresh portfolios` again.
- If the key is invalid or expired, generate a new key in `Settings > Imports` and replace the old key in Lightroom.
- If a selected existing portfolio was deleted, refresh the list and choose another destination.
- Imports count toward subscriber storage and portfolio limits.
