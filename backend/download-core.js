// Security-first. Creator-ready. Future-proof.
// Why this design: pure validation/argument builders keep the Express shell small, testable, and safe at the API boundary.

const sanitizeFilename = require('sanitize-filename');

const ALLOWED_FORMATS = new Set(['mp3', 'mp4']);
const ALLOWED_QUALITIES = new Set(['low', 'medium', 'high']);
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be']);
const DEFAULT_TITLE = 'anomtube-download';

const AUDIO_QUALITY_ARGS = {
  low: '9',
  medium: '5',
  high: '0'
};

const MP4_FORMAT_SELECTORS = {
  low: 'bv*[ext=mp4][height<=360]+ba[ext=m4a]/b[ext=mp4][height<=360]/b[height<=360]',
  medium: 'bv*[ext=mp4][height<=720]+ba[ext=m4a]/b[ext=mp4][height<=720]/b[height<=720]',
  high: 'bv*[ext=mp4][height<=1080]+ba[ext=m4a]/b[ext=mp4][height<=1080]/b[height<=1080]/best'
};

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateYouTubeUrl(rawUrl) {
  const url = normalizeString(rawUrl);
  if (!url) {
    return { ok: false, error: 'url is required' };
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch (_error) {
    return { ok: false, error: 'url must be a valid URL' };
  }

  if (!['https:', 'http:'].includes(parsed.protocol)) {
    return { ok: false, error: 'url protocol must be http or https' };
  }

  const hostname = parsed.hostname.toLowerCase();
  const isYouTubeHost = YOUTUBE_HOSTS.has(hostname) || hostname.endsWith('.youtube.com');
  if (!isYouTubeHost) {
    return { ok: false, error: 'Only youtube.com and youtu.be URLs are accepted' };
  }

  return { ok: true, value: parsed.toString() };
}

function validateEnum(value, allowedValues, fieldName) {
  const normalized = normalizeString(value).toLowerCase();
  if (!allowedValues.has(normalized)) {
    return { ok: false, error: `${fieldName} must be one of: ${Array.from(allowedValues).join(', ')}` };
  }
  return { ok: true, value: normalized };
}

function buildSafeFilenameBase(title) {
  const normalized = normalizeString(title)
    .replace(/\s+-\s+YouTube$/i, '')
    .replace(/\s+/g, ' ')
    .slice(0, 140);

  const safe = sanitizeFilename(normalized || DEFAULT_TITLE)
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^\.+/, '')
    .trim();

  return safe || DEFAULT_TITLE;
}

function validateDownloadRequest(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, status: 400, error: 'Request body must be a JSON object' };
  }

  const urlResult = validateYouTubeUrl(body.url);
  if (!urlResult.ok) {
    return { ok: false, status: 400, error: urlResult.error };
  }

  const formatResult = validateEnum(body.format, ALLOWED_FORMATS, 'format');
  if (!formatResult.ok) {
    return { ok: false, status: 400, error: formatResult.error };
  }

  const qualityResult = validateEnum(body.quality, ALLOWED_QUALITIES, 'quality');
  if (!qualityResult.ok) {
    return { ok: false, status: 400, error: qualityResult.error };
  }

  const filenameBase = buildSafeFilenameBase(body.title);

  return {
    ok: true,
    value: {
      url: urlResult.value,
      format: formatResult.value,
      quality: qualityResult.value,
      title: normalizeString(body.title),
      filenameBase,
      filename: `${filenameBase}.${formatResult.value}`
    }
  };
}

function buildYtDlpArgs({ url, format, quality }, outputTemplate) {
  const commonArgs = [
    '--no-playlist',
    '--restrict-filenames',
    '--no-mtime',
    '--newline',
    '-o',
    outputTemplate
  ];

  if (format === 'mp3') {
    return [
      ...commonArgs,
      '--extract-audio',
      '--audio-format',
      'mp3',
      '--audio-quality',
      AUDIO_QUALITY_ARGS[quality],
      url
    ];
  }

  return [
    ...commonArgs,
    '-f',
    MP4_FORMAT_SELECTORS[quality],
    '--merge-output-format',
    'mp4',
    url
  ];
}

module.exports = {
  ALLOWED_FORMATS,
  ALLOWED_QUALITIES,
  buildSafeFilenameBase,
  buildYtDlpArgs,
  validateDownloadRequest,
  validateYouTubeUrl
};
