// Less noise. More signal. AnomFIN.
// Why this design: validate before IO, isolate yt-dlp jobs, and return files only after successful conversion.

const cors = require('cors');
const express = require('express');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { spawn } = require('child_process');
const { spawnSync } = require('child_process');
const {
  buildSafeFilenameBase,
  buildYtDlpArgs,
  validateDownloadRequest
} = require('./download-core');

const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const MAX_CONCURRENT_DOWNLOADS = Number.parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || '2', 10);
const DOWNLOAD_TIMEOUT_MS = Number.parseInt(process.env.DOWNLOAD_TIMEOUT_MS || String(10 * 60 * 1000), 10);
const BODY_LIMIT = '64kb';

let activeDownloads = 0;
const downloadQueue = [];

function log(level, message, meta = {}) {
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
    JSON.stringify({ level, message, time: new Date().toISOString(), ...meta })
  );
}

function enqueueDownload(job) {
  downloadQueue.push(job);
  processDownloadQueue();
}

function processDownloadQueue() {
  if (activeDownloads >= MAX_CONCURRENT_DOWNLOADS) return;
  const job = downloadQueue.shift();
  if (!job) return;

  activeDownloads += 1;
  job(() => {
    activeDownloads -= 1;
    processDownloadQueue();
  });
}

function commandExists(command) {
  const result = spawnSync(command, ['--version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'ignore', 'ignore']
  });
  return !result.error && result.status === 0;
}

function assertRuntimeDependencies() {
  const missing = ['yt-dlp', 'ffmpeg'].filter((command) => !commandExists(command));
  if (missing.length > 0) {
    return {
      ok: false,
      error: `Missing required command(s) in PATH: ${missing.join(', ')}. Install yt-dlp and ffmpeg, then restart the backend.`
    };
  }
  return { ok: true };
}

async function findDownloadedFile(directory, expectedExtension) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(`.${expectedExtension}`))
    .map((entry) => path.join(directory, entry.name));

  if (files.length === 0) {
    throw new Error(`yt-dlp did not produce a .${expectedExtension} file`);
  }

  return files[0];
}

function runYtDlp(args, { requestId }) {
  return new Promise((resolve, reject) => {
    const child = spawn('yt-dlp', args, {
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true
    });

    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`yt-dlp timed out after ${DOWNLOAD_TIMEOUT_MS}ms`));
    }, DOWNLOAD_TIMEOUT_MS);

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > 6000) stderr = stderr.slice(-6000);
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`yt-dlp exited with code ${code}: ${stderr.trim() || 'no stderr'}`));
        return;
      }
      log('info', 'yt-dlp completed', { requestId });
      resolve();
    });
  });
}

async function sendFileAndCleanup(res, filePath, filename, tempDir) {
  await new Promise((resolve, reject) => {
    res.download(filePath, filename, (error) => {
      if (error) reject(error);
      else resolve();
    });
  }).finally(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });
}

async function handleDownload(req, res) {
  const validation = validateDownloadRequest(req.body);
  if (!validation.ok) {
    res.status(validation.status).json({ error: validation.error });
    return;
  }

  const dependencyStatus = assertRuntimeDependencies();
  if (!dependencyStatus.ok) {
    res.status(503).json({ error: dependencyStatus.error });
    return;
  }

  const download = validation.value;
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'anomtube-'));
  const outputBase = buildSafeFilenameBase(`${download.filenameBase}-${requestId}`);
  const outputTemplate = path.join(tempDir, `${outputBase}.%(ext)s`);
  const args = buildYtDlpArgs(download, outputTemplate);

  log('info', 'download started', {
    requestId,
    host: new URL(download.url).hostname,
    format: download.format,
    quality: download.quality
  });

  try {
    await runYtDlp(args, { requestId });
    const filePath = await findDownloadedFile(tempDir, download.format);
    res.setHeader('X-AnomTube-Status', 'success');
    await sendFileAndCleanup(res, filePath, download.filename, tempDir);
    log('info', 'download delivered', { requestId, filename: download.filename });
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true });
    log('error', 'download failed', { requestId, error: error.message });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Download failed. Verify the URL, content permissions, yt-dlp, and ffmpeg.' });
    }
  }
}

function createApp() {
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json({ limit: BODY_LIMIT }));

  app.get('/api/health', (_req, res) => {
    const dependencies = assertRuntimeDependencies();
    res.status(dependencies.ok ? 200 : 503).json({
      ok: dependencies.ok,
      service: 'anomtube-download-backend',
      dependencies: dependencies.ok ? { ytDlp: true, ffmpeg: true } : { error: dependencies.error },
      queue: { active: activeDownloads, pending: downloadQueue.length }
    });
  });

  app.post(
    '/api/download',
    rateLimit({ windowMs: 60 * 1000, max: 12, standardHeaders: true, legacyHeaders: false }),
    (req, res) => enqueueDownload((done) => handleDownload(req, res).finally(done))
  );

  app.use((error, _req, res, _next) => {
    log('error', 'unhandled request error', { error: error.message });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return app;
}

if (require.main === module) {
  createApp().listen(PORT, () => {
    log('info', 'download backend listening', { port: PORT });
  });
}

module.exports = { createApp, commandExists, assertRuntimeDependencies };
