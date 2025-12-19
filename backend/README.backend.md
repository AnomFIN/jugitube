# Backend download service (yt-dlp + ffmpeg)

Requirements:
- Node.js 14+
- yt-dlp installed and available on PATH
- ffmpeg installed and available on PATH (yt-dlp uses it for post-processing)

Quick start:
1. cd backend
2. npm install
3. Ensure yt-dlp and ffmpeg are installed (system package or pip for yt-dlp)
4. node server.js

Docker (example):
- Build: docker build -t jugitube-downloader .
- Run: docker run -p 3000:3000 jugitube-downloader

Notes:
- The server streams yt-dlp stdout directly to the HTTP response.
- For production, run behind a reverse proxy, enable authentication or restrict access, and implement persistent job queue.
- Legal: ensure you comply with content provider Terms of Service.
