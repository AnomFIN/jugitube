```md
# Jugitube — Manual test checklist (added features)

Manual test checklist (MVP bundle):
- Window/State:
  - Start the app; window opens ~1280x800.
  - Resize to different size and move; close and reopen app — window restores size/position.
- Responsive:
  - Shrink window to width <= 900px — sidebar moves below main content; controls remain visible.
- Hotkeys:
  - Play/pause with Space.
  - Seek -5/+5s with ← / →.
  - Volume up/down with ↑ / ↓.
  - Press "d" to trigger download UI action.
  - Press "t" to toggle theme; selection persists.
  - Press "p" to toggle PiP.
- Playlists/bookmarks:
  - Create a playlist, add an item (url/title), add a bookmark with timestamp, click bookmark -> video jumps there.
- PiP/themes:
  - Toggle dark/light theme; refresh page — theme persists.
  - Try Picture-in-Picture; fallback to Electron mini-window if available.
- Download backend:
  - Start backend: cd backend && npm install && node server.js
  - Test via curl:
    curl -X POST http://localhost:3000/api/download -H "Content-Type: application/json" -d '{"url":"<VIDEO_URL>","format":"mp3","quality":"high","title":"sample"}' --output sample.mp3

Notes:
- Backend requires yt-dlp and ffmpeg on PATH.
- For production: add auth, persistent job queue, and more strict rate-limiting.
