// Frontend download helper that posts to /api/download and starts a browser download.
// Usage: await JugitubeDownload.start({url, format, quality, title})

(function (root) {
  async function start({ url, format = 'mp4', quality = 'high', title = 'download' }) {
    const resp = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format, quality, title }),
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => 'error');
      throw new Error('Download failed: ' + (txt || resp.status));
    }
    // Try to get filename from headers
    const contentDisposition = resp.headers.get('Content-Disposition') || '';
    const match = /filename="?([^"]+)"?/.exec(contentDisposition);
    const filename = match ? match[1] : `${title}.${format}`;

    // Stream body to Blob
    const reader = resp.body.getReader();
    const chunks = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      window.dispatchEvent(new CustomEvent('jugitube-download-progress', { detail: { received } }));
    }
    const blob = new Blob(chunks);
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
    return filename;
  }

  root.JugitubeDownload = { start };
})(window);
