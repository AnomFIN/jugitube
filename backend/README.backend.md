# AnomTube Download Backend

This is the optional backend server for AnomTube that provides video/audio download functionality using yt-dlp.

## Requirements

### System Dependencies

1. **yt-dlp**: YouTube downloader
   ```bash
   # Install via pip
   pip install yt-dlp
   
   # Or on macOS via brew
   brew install yt-dlp
   
   # Or download binary from https://github.com/yt-dlp/yt-dlp/releases
   ```

2. **ffmpeg**: Audio/video processing
   ```bash
   # Ubuntu/Debian
   sudo apt-get install ffmpeg
   
   # macOS
   brew install ffmpeg
   
   # Windows
   # Download from https://ffmpeg.org/download.html
   ```

### Node.js Dependencies

```bash
npm install
```

## Configuration

The server runs on `http://localhost:3000` by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and queue information.

**Response:**
```json
{
  "status": "ok",
  "activeDownloads": 0,
  "queueSize": 0
}
```

### Check Dependencies
```
GET /api/dependencies
```
Checks if yt-dlp and ffmpeg are installed.

**Response:**
```json
{
  "yt-dlp": true,
  "ffmpeg": true
}
```

### Download Video/Audio
```
POST /api/download
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "format": "mp4",
  "quality": "medium"
}
```

**Parameters:**
- `url` (required): YouTube video URL
- `format` (optional): `mp4` (video) or `mp3` (audio only). Default: `mp4`
- `quality` (optional): `low`, `medium`, or `high`. Default: `medium`

**Response:**
- Success: Streams the file with appropriate Content-Type and Content-Disposition headers
- Error: JSON with error details

**Quality Settings:**
- **High**: Best available quality (up to 1080p for video, 320kbps for audio)
- **Medium**: 720p for video, 128kbps for audio
- **Low**: Lowest available quality

**Rate Limiting:**
- 10 requests per minute per IP address
- Maximum 3 concurrent downloads

**Timeouts:**
- 5 minutes per download

## Testing

### Using curl

Download MP4 (medium quality):
```bash
curl -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","format":"mp4","quality":"medium"}' \
  --output video.mp4
```

Download MP3 (high quality):
```bash
curl -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","format":"mp3","quality":"high"}' \
  --output audio.mp3
```

Check server health:
```bash
curl http://localhost:3000/health
```

Check dependencies:
```bash
curl http://localhost:3000/api/dependencies
```

## Docker Deployment

See the `Dockerfile` in the project root for containerized deployment.

## Security Notes

- This server is designed for local/internal use only
- Do not expose this server to the public internet without proper authentication
- Rate limiting is enabled but may not be sufficient for public exposure
- Consider adding authentication middleware for production use

## Troubleshooting

### "yt-dlp not found" error
Make sure yt-dlp is installed and available in your PATH:
```bash
which yt-dlp  # Should show the path to yt-dlp
yt-dlp --version  # Should show version number
```

### "ffmpeg not found" warning
Make sure ffmpeg is installed:
```bash
which ffmpeg  # Should show the path to ffmpeg
ffmpeg -version  # Should show version information
```

### Downloads timeout
- Check your internet connection
- Try a different video URL
- Increase the timeout in `server.js` if needed

### Rate limit errors
Wait 60 seconds and try again, or adjust rate limits in `server.js`.

## License

MIT
