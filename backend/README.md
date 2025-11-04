# AnomTube Download Backend

Optional backend service for the AnomTube browser extension that provides video/audio download functionality using yt-dlp and ffmpeg.

## Features

- **Video Download**: Download videos in multiple quality settings (low/medium/high)
- **Audio Extraction**: Convert and download audio as MP3
- **Rate Limiting**: 10 downloads per 15 minutes per IP
- **Queue System**: Maximum 3 concurrent downloads
- **CORS Support**: Cross-origin requests from browser extension
- **Timeout Protection**: 10-minute timeout per download

## Requirements

### System Dependencies

- **Node.js**: >= 16.0.0
- **yt-dlp**: YouTube video downloader ([Installation Guide](https://github.com/yt-dlp/yt-dlp#installation))
- **ffmpeg**: Video/audio processing ([Installation Guide](https://ffmpeg.org/download.html))

### Installation Steps

#### 1. Install System Dependencies

**Linux (Ubuntu/Debian):**
```bash
# Install ffmpeg
sudo apt update
sudo apt install ffmpeg

# Install yt-dlp
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

**macOS:**
```bash
# Install using Homebrew
brew install ffmpeg yt-dlp
```

**Windows:**
```bash
# Install using Chocolatey
choco install ffmpeg yt-dlp

# Or download manually:
# - ffmpeg: https://www.gyan.dev/ffmpeg/builds/
# - yt-dlp: https://github.com/yt-dlp/yt-dlp/releases
```

#### 2. Install Node.js Dependencies

```bash
cd backend
npm install
```

## Usage

### Environment Variables

Configure the server using environment variables:

- `PORT`: Server port (default: 3000)
- `CORS_ORIGIN`: Allowed CORS origin (default: http://localhost:3000)

**Security Note**: In production, always set `CORS_ORIGIN` to your extension's origin:

```bash
# For Chrome extension
export CORS_ORIGIN="chrome-extension://YOUR_EXTENSION_ID"

# For multiple origins (comma-separated)
export CORS_ORIGIN="chrome-extension://ID1,chrome-extension://ID2"

# For local development
export CORS_ORIGIN="http://localhost:3000"
```

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
# Set CORS origin first
export CORS_ORIGIN="chrome-extension://YOUR_EXTENSION_ID"
export PORT=3000

npm start
```

Or using inline environment variables:

```bash
CORS_ORIGIN="chrome-extension://YOUR_ID" PORT=8080 npm start
```

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "AnomTube Download Backend",
  "version": "1.0.0",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Download Video/Audio

```bash
POST /api/download
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "format": "mp3",
  "quality": "medium",
  "title": "My Video"
}
```

**Parameters:**
- `url` (required): YouTube video URL
- `format` (optional): `mp3` or `mp4` (default: `mp3`)
- `quality` (optional): `low`, `medium`, or `high` (default: `medium`)
- `title` (optional): Custom filename (default: `download`)

**Quality Settings:**

For **mp3**:
- `low`: 128kbps
- `medium`: 192kbps
- `high`: 320kbps

For **mp4**:
- `low`: Worst available quality
- `medium`: Best quality up to 720p
- `high`: Best available quality

**Example:**
```bash
curl -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "format": "mp3",
    "quality": "high",
    "title": "Never Gonna Give You Up"
  }' \
  --output "output.mp3"
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t anomtube-backend .
```

### Run Docker Container

```bash
docker run -d \
  -p 3000:3000 \
  -e CORS_ORIGIN="chrome-extension://YOUR_EXTENSION_ID" \
  --name anomtube-backend \
  --restart unless-stopped \
  anomtube-backend
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  anomtube-backend:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - PORT=3000
      - CORS_ORIGIN=chrome-extension://YOUR_EXTENSION_ID
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
```

Run with:
```bash
docker-compose up -d
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Limit**: 10 downloads per 15 minutes per IP address
- **Queue**: Maximum 3 concurrent downloads
- **Timeout**: 10 minutes per download

## Security Considerations

⚠️ **Important Security Notes:**

1. **CORS Configuration**: Always set the `CORS_ORIGIN` environment variable in production:
   ```bash
   # Single origin
   export CORS_ORIGIN="chrome-extension://YOUR_EXTENSION_ID"
   
   # Multiple origins (comma-separated)
   export CORS_ORIGIN="chrome-extension://ID1,chrome-extension://ID2"
   ```
   
   The default setting (`http://localhost:3000`) is only for local development.

2. **Authentication**: Consider adding authentication for production use (API keys, JWT, etc.)

3. **HTTPS**: Use HTTPS in production via reverse proxy (nginx/caddy)

4. **Firewall**: Restrict access to trusted IPs if possible

5. **Rate Limiting**: Default limits are conservative; adjust based on your needs:
   ```javascript
   const RATE_LIMIT_MAX_REQUESTS = 10;  // Requests per window
   const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;  // 15 minutes
   ```

6. **Logging**: Implement proper logging in production (winston, pino, etc.)

7. **Monitoring**: Set up health checks and alerting

## Troubleshooting

### yt-dlp not found

Make sure yt-dlp is installed and in your PATH:
```bash
yt-dlp --version
```

### ffmpeg not found

Make sure ffmpeg is installed and in your PATH:
```bash
ffmpeg -version
```

### Permission denied

On Linux/macOS, ensure the yt-dlp binary is executable:
```bash
chmod +x /usr/local/bin/yt-dlp
```

### Download fails

Check the server logs for detailed error messages. Common issues:
- Video is private or unavailable
- Geo-restricted content
- Age-restricted content (requires cookies/auth)

## License

MIT

## Credits

- **yt-dlp**: https://github.com/yt-dlp/yt-dlp
- **ffmpeg**: https://ffmpeg.org
- **AnomFIN Tools**: Made by Jugi @ AnomFIN
