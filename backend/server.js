// AnomTube Download Backend Server
// Express server for handling video/audio downloads via yt-dlp

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const sanitizeFilename = require('sanitize-filename');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration constants
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 10;
const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CONCURRENT_DOWNLOADS = 3;

// Security configuration
const ALLOWED_ORIGINS = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: ALLOWED_ORIGINS, // Configure via environment variable
  methods: ['GET', 'POST']
}));

app.use(express.json());

// Rate limiting: max 10 downloads per 15 minutes per IP
const downloadLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: { error: 'Too many download requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Simple in-memory queue for download requests
class DownloadQueue {
  constructor(maxConcurrent = MAX_CONCURRENT_DOWNLOADS) {
    this.queue = [];
    this.active = 0;
    this.maxConcurrent = maxConcurrent;
  }

  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.active >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.active++;
    const { task, resolve, reject } = this.queue.shift();

    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.active--;
      this.process();
    }
  }
}

const downloadQueue = new DownloadQueue(3);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AnomTube Download Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Download endpoint
app.post('/api/download', downloadLimiter, async (req, res) => {
  const { url, format = 'mp3', quality = 'medium', title = 'download' } = req.body;

  // Validate URL
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid URL provided' });
  }

  // Validate format
  const validFormats = ['mp3', 'mp4'];
  if (!validFormats.includes(format)) {
    return res.status(400).json({ error: 'Invalid format. Must be mp3 or mp4' });
  }

  // Validate quality
  const validQualities = ['low', 'medium', 'high'];
  if (!validQualities.includes(quality)) {
    return res.status(400).json({ error: 'Invalid quality. Must be low, medium, or high' });
  }

  console.log(`Download request: ${url} (${format}, ${quality})`);

  try {
    // Add to queue and execute
    await downloadQueue.add(async () => {
      return new Promise((resolve, reject) => {
        // Sanitize filename
        const safeTitle = sanitizeFilename(title.substring(0, 100)) || 'download';
        const filename = `${safeTitle}.${format}`;

        // Set response headers
        res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Build yt-dlp arguments based on format and quality
        const args = buildYtDlpArgs(url, format, quality);

        console.log('Executing yt-dlp with args:', args);

        // Spawn yt-dlp process
        const ytdlp = spawn('yt-dlp', args);

        let errorOutput = '';

        // Pipe stdout to response
        ytdlp.stdout.pipe(res);

        // Collect stderr for error reporting
        ytdlp.stderr.on('data', (data) => {
          errorOutput += data.toString();
          console.error('yt-dlp stderr:', data.toString());
        });

        // Handle process completion
        ytdlp.on('close', (code) => {
          if (code === 0) {
            console.log('Download completed successfully');
            resolve();
          } else {
            console.error(`yt-dlp exited with code ${code}`);
            if (!res.headersSent) {
              res.status(500).json({
                error: 'Download failed',
                details: errorOutput
              });
            }
            reject(new Error(`yt-dlp exited with code ${code}`));
          }
        });

        // Handle process errors
        ytdlp.on('error', (error) => {
          console.error('Failed to spawn yt-dlp:', error);
          if (!res.headersSent) {
            res.status(500).json({
              error: 'Failed to start download',
              details: error.message
            });
          }
          reject(error);
        });

        // Set timeout
        const timeout = setTimeout(() => {
          console.error('Download timeout');
          ytdlp.kill();
          if (!res.headersSent) {
            res.status(504).json({ error: 'Download timeout' });
          }
          reject(new Error('Download timeout'));
        }, DOWNLOAD_TIMEOUT_MS);

        // Clear timeout on completion
        ytdlp.on('close', () => clearTimeout(timeout));
      });
    });
  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Download failed',
        details: error.message
      });
    }
  }
});

/**
 * Build yt-dlp arguments based on format and quality
 * @param {string} url - Video URL
 * @param {string} format - Output format (mp3 or mp4)
 * @param {string} quality - Quality setting (low, medium, high)
 * @returns {Array<string>} yt-dlp arguments
 */
function buildYtDlpArgs(url, format, quality) {
  const args = [url];

  if (format === 'mp3') {
    // Audio-only download with conversion to MP3
    args.push('-x'); // Extract audio
    args.push('--audio-format', 'mp3');
    
    // Quality settings for audio
    const audioBitrates = {
      low: '128K',
      medium: '192K',
      high: '320K'
    };
    args.push('--audio-quality', audioBitrates[quality]);
  } else {
    // Video download
    const videoFormats = {
      low: 'worst',
      medium: 'best[height<=720]',
      high: 'best'
    };
    args.push('-f', videoFormats[quality]);
  }

  // Output to stdout
  args.push('-o', '-');

  // Additional options
  args.push('--no-playlist'); // Download single video, not playlist
  args.push('--no-warnings');
  args.push('--quiet');
  args.push('--no-progress');

  return args;
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   AnomTube Download Backend Server                         ║
║   Port: ${PORT}                                              ║
║   Status: Running                                          ║
║                                                            ║
║   Endpoints:                                               ║
║   - GET  /health                                           ║
║   - POST /api/download                                     ║
║                                                            ║
║   Requirements:                                            ║
║   - yt-dlp installed and in PATH                           ║
║   - ffmpeg installed and in PATH                           ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
