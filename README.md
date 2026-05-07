# Jugitube / AnomTube

A clean YouTube helper for Chrome Extension / Electron workflows: audio-only focus mode, ad shield controls, lyrics, themes, PiP, playlists, and a local MP3/MP4 download flow for your own or otherwise licensed content.

> **Legal / security boundary:** the download feature is only for user-owned or permitted content. It does not bypass DRM, paywalls, login walls, or platform restrictions.

## Features

- Clear **⬇️ Lataa** button in the popup.
- **D** hotkey on YouTube opens the same download menu.
- Download menu choices:
  - `MP3` or `MP4`
  - quality: `low`, `medium`, `high`
  - `Lataa` and `Peruutus`
- Current YouTube URL and title are detected automatically from the active content tab.
- Frontend calls `POST http://localhost:3000/api/download` with `{ url, format, quality, title }`.
- Browser receives a blob and starts a native file download with `.mp3` or `.mp4` extension.
- Status states: ready, loading, success, error.

## Install

```bash
npm install
cd backend && npm install
```

## Required system tools

Install both tools and ensure they are available in `PATH`:

```bash
yt-dlp --version
ffmpeg -version
```

Examples:

```bash
# macOS
brew install yt-dlp ffmpeg

# Ubuntu / Debian
sudo apt update
sudo apt install ffmpeg
python3 -m pip install --user yt-dlp

# Windows
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
```

## Run backend

```bash
cd backend
npm install
node server.js
```

Health check:

```bash
curl http://localhost:3000/api/health
```

If `yt-dlp` or `ffmpeg` is missing, `/api/health` returns `503` with a clear error.

## Load the Chrome extension

1. Open Chrome: `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this repository folder.
5. Open a YouTube watch page.
6. Click the extension popup and press **⬇️ Lataa**, or press **D** on the page.

## Verify downloads manually

Use content you own or are licensed to download.

### Curl MP3 test

```bash
curl -L -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=VIDEO_ID","format":"mp3","quality":"medium","title":"sample"}' \
  --output sample.mp3
```

Expected: `sample.mp3` exists and opens as MP3 audio.

### Curl MP4 test

```bash
curl -L -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=VIDEO_ID","format":"mp4","quality":"medium","title":"sample"}' \
  --output sample.mp4
```

Expected: `sample.mp4` exists and opens as MP4 video.

### Invalid URL block test

```bash
curl -i -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/video","format":"mp3","quality":"medium","title":"blocked"}'
```

Expected: HTTP `400` with `Only youtube.com and youtu.be URLs are accepted`.

### UI test checklist

- Start backend: `cd backend && npm install && node server.js`.
- Open a YouTube video page.
- Press **D**: the AnomTube download menu opens; no blank tab opens.
- In the popup, click **⬇️ Lataa**: the same menu opens.
- Select **MP3**, quality `low / medium / high`, click **Lataa**: status moves `Valmis → Ladataan → Onnistui`, browser downloads `.mp3`.
- Select **MP4**, click **Lataa**: browser downloads `.mp4`.
- Stop backend and retry: UI shows `Download backend ei ole käynnissä. Käynnistä: cd backend && npm install && node server.js`.
- Existing audio-only, ad shield, lyrics, PiP, theme, and playlist controls remain available.

## Test commands

```bash
node --check popup.js
node --check content.js
node --check modules/downloadManager.js
cd backend && npm test
```

## Backend API

### `GET /api/health`

Returns backend status, dependency status, and queue size.

### `POST /api/download`

Request body:

```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "format": "mp3",
  "quality": "medium",
  "title": "Safe filename title"
}
```

Validation:

- `url`: only `youtube.com` and `youtu.be` hosts.
- `format`: `mp3` or `mp4`.
- `quality`: `low`, `medium`, or `high`.
- `title`: sanitized with `sanitize-filename`.

Implementation:

- MP3 uses `yt-dlp --extract-audio --audio-format mp3`.
- MP4 uses MP4/M4A selectors and `--merge-output-format mp4`.
- Missing `yt-dlp` or `ffmpeg` returns a structured `503` response.
- Download jobs run through a small concurrency queue to avoid local resource spikes.

## Why this design

- **Local-first:** conversion happens on `localhost`; no third-party backend receives URLs.
- **Security-first:** strict host/enum validation and sanitized filenames at the API boundary.
- **DX-first:** health endpoint, curl tests, and explicit missing-tool errors.
- **Minimal UX:** one button, one hotkey, one modal, no blank tabs.
- **Compatibility:** existing feature modules are not replaced; download logic is isolated in `modules/downloadManager.js`.

## Troubleshooting

- **Backend not running:** start it with `cd backend && npm install && node server.js`.
- **Health returns 503:** install `yt-dlp` and `ffmpeg`, then restart backend.
- **Chrome blocks localhost call:** reload the extension and confirm `manifest.json` includes `http://localhost:3000/*` host permission.
- **yt-dlp fails:** update it with your package manager and verify the video is your own or licensed content.

## TODO — next iterations

- Add optional job progress streaming from backend to UI.
- Add a small diagnostics panel in the popup for backend health.
- Add CI for backend unit tests and extension syntax checks.
