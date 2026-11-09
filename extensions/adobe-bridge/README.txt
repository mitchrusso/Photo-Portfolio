PhotoView.io Publish Extension for Adobe Bridge
Version 1.0.1

INSTALL ON macOS
1. Quit Adobe Bridge.
2. Copy PhotoViewIoBridge.jsx into:
   ~/Library/Application Support/Adobe/Bridge 2026/Startup Scripts/
   Use the folder for your installed Bridge version. Create Startup Scripts if needed.
3. Reopen Bridge and approve the startup script when Adobe asks.

INSTALL ON WINDOWS
1. Quit Adobe Bridge.
2. Copy PhotoViewIoBridge.jsx into:
   %APPDATA%\Adobe\Bridge 2026\Startup Scripts\
   Use the folder for your installed Bridge version. Create Startup Scripts if needed.
3. Reopen Bridge and approve the startup script when Adobe asks.

PUBLISH
1. In PhotoView.io, open Settings > Imports > Adobe Bridge.
2. Generate and copy the private import key.
3. In Bridge, select finished photographs.
4. Open Tools > PhotoView.io > Publish selected photos.
5. The PhotoView.io API URL is already filled in. Paste the private key, choose a new or existing portfolio, and select Publish.

TROUBLESHOOTING
- Use Show key to confirm that the complete private key was pasted. Keep the key private and hide it again before continuing.
- If publishing fails, the extension displays PhotoView.io's specific error message. Follow that message or include it when contacting support.

SUPPORTED FILES
JPEG, PNG, WebP, HEIC, HEIF, and TIFF, up to 50 MB each.

The extension copies selected files. It does not delete or modify the originals.
The private key expires after 90 days. Generate a new one in PhotoView when needed.
