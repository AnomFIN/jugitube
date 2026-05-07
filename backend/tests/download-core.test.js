// From raw data to real impact.

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  buildSafeFilenameBase,
  buildYtDlpArgs,
  validateDownloadRequest,
  validateYouTubeUrl
} = require('../download-core');

test('validateYouTubeUrl accepts youtube.com and youtu.be', () => {
  assert.equal(validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ').ok, true);
  assert.equal(validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ').ok, true);
});

test('validateYouTubeUrl blocks non-YouTube URLs', () => {
  const result = validateYouTubeUrl('https://example.com/watch?v=dQw4w9WgXcQ');
  assert.equal(result.ok, false);
  assert.match(result.error, /youtube\.com|youtu\.be/i);
});

test('validateDownloadRequest enforces format and quality enums', () => {
  const badFormat = validateDownloadRequest({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    format: 'wav',
    quality: 'high'
  });
  assert.equal(badFormat.ok, false);
  assert.match(badFormat.error, /format/);

  const badQuality = validateDownloadRequest({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    format: 'mp3',
    quality: 'ultra'
  });
  assert.equal(badQuality.ok, false);
  assert.match(badQuality.error, /quality/);
});

test('buildSafeFilenameBase strips unsafe characters and YouTube suffix', () => {
  assert.equal(buildSafeFilenameBase('AC/DC: Thunder? - YouTube'), 'ACDC_Thunder');
  assert.equal(buildSafeFilenameBase('..'), 'anomtube-download');
});

test('buildYtDlpArgs creates mp3 extraction args', () => {
  const args = buildYtDlpArgs(
    { url: 'https://youtu.be/dQw4w9WgXcQ', format: 'mp3', quality: 'medium' },
    '/tmp/%(title)s.%(ext)s'
  );
  assert.ok(args.includes('--extract-audio'));
  assert.ok(args.includes('--audio-format'));
  assert.ok(args.includes('mp3'));
});

test('buildYtDlpArgs creates mp4 merge args', () => {
  const args = buildYtDlpArgs(
    { url: 'https://youtu.be/dQw4w9WgXcQ', format: 'mp4', quality: 'high' },
    '/tmp/%(title)s.%(ext)s'
  );
  assert.ok(args.includes('--merge-output-format'));
  assert.ok(args.includes('mp4'));
  assert.ok(args.includes('-f'));
});
