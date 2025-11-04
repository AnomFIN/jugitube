// AnomTube Download Backend Server
// Node.js/Express server for streaming yt-dlp downloads
// Requires: yt-dlp and ffmpeg installed on system

const express = require('express');
const { spawn } = require('child_process');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting: 10 requests per minute per IP
const downloadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per window
  message: { error: 'Too many download requests, please try again later.' }
});

// In-memory download queue
const downloadQueue = new Map();
let activeDownloads = 0;
const MAX_CONCURRENT_DOWNLOADS = 3;

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    activeDownloads,
    queueSize: downloadQueue.size
  });
});

/**
 * Check dependencies
 */
async function checkDependencies() {
  const checks = {
    'yt-dlp': false,
    'ffmpeg': false
  };

  // Check yt-dlp
  try {
    const ytdlp = spawn('yt-dlp', ['--version']);
    await new Promise((resolve) => {
      ytdlp.on('close', (code) => {
        checks['yt-dlp'] = code === 0;
        resolve();
      });
    });
  } catch (error) {
    console.error('yt-dlp not found');
  }

  // Check ffmpeg
  try {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    await new Promise((resolve) => {
      ffmpeg.on('close', (code) => {
        checks.ffmpeg = code === 0;
        resolve();
      });
    });
  } catch (error) {
    console.error('ffmpeg not found');
  }

  return checks;
}

/**
 * Dependencies check endpoint
 */
app.get('/api/dependencies', async (req, res) => {
  const deps = await checkDependencies();
  res.json(deps);
});

/**
 * Download endpoint
 * POST /api/download
 * Body: { url: string, format: 'mp3'|'mp4', quality: 'low'|'medium'|'high' }
 */
app.post('/api/download', downloadLimiter, async (req, res) => {
  const { url, format = 'mp4', quality = 'medium' } = req.body;

  // Validate input
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!['mp3', 'mp4'].includes(format)) {
    return res.status(400).json({ error: 'Invalid format. Must be mp3 or mp4' });
  }

  if (!['low', 'medium', 'high'].includes(quality)) {
    return res.status(400).json({ error: 'Invalid quality. Must be low, medium, or high' });
  }

  // Check if at max concurrent downloads
  if (activeDownloads >= MAX_CONCURRENT_DOWNLOADS) {
    return res.status(429).json({ 
      error: 'Server is busy. Please try again in a moment.',
      queueSize: downloadQueue.size
    });
  }

  activeDownloads++;

  try {
    // Build yt-dlp command
    const args = [
      url,
      '--no-playlist',
      '--no-warnings',
      '--print', 'filename',
      '-o', '-' // Output to stdout
    ];

    // Add format options
    if (format === 'mp3') {
      args.push('-x'); // Extract audio
      args.push('--audio-format', 'mp3');
      
      // Quality for audio
      switch (quality) {
        case 'high':
          args.push('--audio-quality', '0'); // Best
          break;
        case 'low':
          args.push('--audio-quality', '9'); // Worst
          break;
        default:
          args.push('--audio-quality', '5'); // Medium
      }
    } else {
      // Video quality
      switch (quality) {
        case 'high':
          args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
          break;
        case 'low':
          args.push('-f', 'worstvideo[ext=mp4]+worstaudio[ext=m4a]/worst[ext=mp4]/worst');
          break;
        default:
          args.push('-f', 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best');
      }
    }

    // Set response headers
    res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="video.${format}"`);

    // Spawn yt-dlp process
    const ytdlp = spawn('yt-dlp', args);

    let hasError = false;
    let errorMessage = '';

    // Pipe stdout to response
    ytdlp.stdout.on('data', (chunk) => {
      if (!hasError) {
        res.write(chunk);
      }
    });

    // Collect stderr for errors
    ytdlp.stderr.on('data', (chunk) => {
      errorMessage += chunk.toString();
      console.error('yt-dlp stderr:', chunk.toString());
    });

    // Handle process completion
    ytdlp.on('close', (code) => {
      activeDownloads--;
      
      if (code !== 0) {
        hasError = true;
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Download failed',
            message: errorMessage || 'Unknown error occurred'
          });
        } else {
          res.end();
        }
      } else {
        res.end();
      }
    });

    // Handle process errors
    ytdlp.on('error', (error) => {
      activeDownloads--;
      hasError = true;
      console.error('yt-dlp process error:', error);
      
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to start download',
          message: error.message
        });
      } else {
        res.end();
      }
    });

    // Set timeout (5 minutes)
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        ytdlp.kill();
        activeDownloads--;
        res.status(408).json({ error: 'Download timeout' });
      }
    }, 5 * 60 * 1000);

    // Clear timeout on completion
    ytdlp.on('close', () => clearTimeout(timeout));

  } catch (error) {
    activeDownloads--;
    console.error('Download error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message
      });
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`AnomTube Download Server running on port ${PORT}`);
  console.log('Checking dependencies...');
  
  const deps = await checkDependencies();
  console.log('Dependencies:');
  console.log(`  yt-dlp: ${deps['yt-dlp'] ? '✓' : '✗'}`);
  console.log(`  ffmpeg: ${deps.ffmpeg ? '✓' : '✗'}`);
  
  if (!deps['yt-dlp']) {
    console.warn('WARNING: yt-dlp not found. Downloads will not work.');
    console.warn('Install with: pip install yt-dlp');
  }
  
  if (!deps.ffmpeg) {
    console.warn('WARNING: ffmpeg not found. Audio conversion may not work.');
    console.warn('Install with: apt-get install ffmpeg (or brew install ffmpeg on macOS)');
  }
});

module.exports = app;
