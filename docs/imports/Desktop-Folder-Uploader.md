# PhotoView.io Desktop Folder Uploader

The desktop folder uploader lets any photo application publish to PhotoView.io if it can export images into a folder.

This is useful for:

- Capture One
- Photoshop
- Photo Mechanic
- DxO PhotoLab / PureRAW
- ON1 Photo RAW
- Luminar
- Affinity Photo
- Pixelmator Pro
- RawTherapee
- darktable, until the native Lua exporter is built

## How It Works

1. Create a folder on your computer, such as `~/Pictures/PhotoView-Exports`.
2. In your photo app, export JPEG, PNG, WebP, HEIC, HEIF, or TIFF files into that folder.
3. Start the PhotoView.io watcher.
4. New files are uploaded to PhotoView.io and marked as uploaded in `.photoviewpro-uploaded.json`.

## Run The Watcher

```bash
npm run photoviewpro:watch -- \
  --folder "$HOME/Pictures/PhotoView-Exports" \
  --api-url https://photoview.io \
  --api-key YOUR_IMPORT_KEY \
  --gallery "Travel Portfolio"
```

## One-Time Scan

```bash
npm run photoviewpro:watch -- \
  --folder "$HOME/Pictures/PhotoView-Exports" \
  --api-url https://photoview.io \
  --api-key YOUR_IMPORT_KEY \
  --gallery "Travel Portfolio" \
  --once
```

## Options

- `--folder`: folder to watch.
- `--api-url`: PhotoView.io base URL.
- `--api-key`: the private 90-day import key generated in PhotoView.io under `Settings > Imports`.
- `--gallery`: gallery or portfolio name.
- `--client`: optional client/project name.
- `--public`: mark imported gallery intent as public.
- `--recursive`: include nested folders.
- `--once`: scan once and exit.
- `--interval`: watch interval in seconds. Default is `5`.

## Supported Files

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`
- `.heic`
- `.heif`
- `.tif`
- `.tiff`

## Environment Variables

Instead of command-line flags, you can use:

```bash
PHOTOVIEWPRO_WATCH_FOLDER="$HOME/Pictures/PhotoView-Exports"
PHOTOVIEWPRO_API_URL="https://photoview.io"
PHOTOVIEWPRO_IMPORT_API_KEY="YOUR_90_DAY_SUBSCRIBER_IMPORT_KEY"
PHOTOVIEWPRO_GALLERY_NAME="Travel Portfolio"
PHOTOVIEWPRO_CLIENT_NAME="Optional Client"
PHOTOVIEWPRO_MAKE_PUBLIC="false"
```

## Photo App Setup Notes

- Capture One: create a process recipe that exports to the watch folder.
- Photoshop: export final files to the watch folder, or use an action/batch process.
- Photo Mechanic: save selected photos or processed copies to the watch folder.
- DxO / ON1 / Luminar / Affinity / Pixelmator: export finished display images to the watch folder.
- RawTherapee / darktable: export queue output to the watch folder.

## Current Behavior

- Uploaded files are stored in the configured PhotoView.io photo storage provider. Production should use Cloudflare R2; the legacy Vercel Blob provider is only used when explicitly selected.
- Imports are attached to the subscriber workspace and named portfolio.
- Portfolio-count, subscription-write, and storage capacity are enforced.
- Import keys are subscriber-specific and expire after 90 days.
