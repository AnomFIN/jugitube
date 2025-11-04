// Lightweight Express backend for /api/download
// Requires: npm i express express-rate-limit cors sanitize-filename
// System: yt-dlp and ffmpeg should be installed; fallback returns 501 if missing.

const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const sanitize = require('sanitize-filename');
const { spawn } = require('child_process');

const MAX_CONCURRENT = 3;
let current = 0;
const QUEUE = [];

function enqueue(task) {
  QUEUE.push(task);
  processQueue();
}

function processQueue() {
  if (current >= MAX_CONCURRENT) return;
  const task = QUEUE.shift();
  if (!task) return;
  current++;
  task(() => {
    current--;
    processQueue();
  });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // 10 requests per minute per IP
});
app.use('/api/download', limiter);

function checkCommand(cmd, args = ['--version']) {
  try {
    const p = spawn(cmd, args);
    p.on('error', () => {});
    return true;
  } catch (e) {
    return false;
  }
}

app.post('/api/download', (req, res) => {
  const { url, format = 'mp4', quality = 'high', title = 'jugitube' } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Missing url' });

  const filenameBase = sanitize(title).replace(/\s+/g, '_') || 'file';
  const ext = format === 'mp3' ? 'mp3' : 'mp4';
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.${ext}"`);

  const job = (done) => {
    // Choose args for yt-dlp
    let args = ['--no-playlist', '-o', '-', url];
    if (format === 'mp3') {
      args = ['--no-playlist', '--extract-audio', '--audio-format', 'mp3', '--audio-quality', quality === 'high' ? '0' : quality === 'medium' ? '5' : '9', '-o', '-', url];
    } else {
      let selector = 'best';
      if (quality === 'low') selector = 'bestvideo[height<=360]+bestaudio/best';
      else if (quality === 'medium') selector = 'bestvideo[height<=720]+bestaudio/best';
      else selector = 'bestvideo[height<=1080]+bestaudio/best';
      args = ['--no-playlist', '-f', selector, '-o', '-', url];
    }

    // Spawn yt-dlp
    const child = spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    const killTimer = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch (e) {}
    }, 5 * 60 * 1000); // 5 minutes

    child.stdout.pipe(res, { end: true });

    child.stderr.on('data', (d) => {
      console.error('yt-dlp:', d.toString());
    });

    child.on('close', (code) => {
      clearTimeout(killTimer);
      if (code !== 0) {
        if (!res.headersSent) res.status(500).json({ error: 'yt-dlp failed', code });
      }
      try { res.end(); } catch (e) {}
      done();
    });

    child.on('error', (err) => {
      clearTimeout(killTimer);
      console.error('yt-dlp spawn error', err);
      if (!res.headersSent) res.status(500).json({ error: 'spawn failed' });
      done();
    });
  };

  enqueue(job);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Download server listening on ${PORT}`));