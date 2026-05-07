// AnomTube: Strip the noise, stream the essence.
// Why this design: one local modal owns validation, state, and blob download without opening tabs or touching unrelated features.

class DownloadManager {
  constructor() {
    this.isDownloadUIVisible = false;
    this.isDownloading = false;
    this.storageKey = 'anomTubeDownloadSettings';
    this.backendUrl = 'http://localhost:3000/api/download';
    this.downloadOptions = {
      format: 'mp3',
      quality: 'medium'
    };
  }

  async init() {
    const result = await chrome.storage.local.get([this.storageKey]);
    if (result[this.storageKey] && typeof result[this.storageKey] === 'object') {
      this.downloadOptions = { ...this.downloadOptions, ...result[this.storageKey] };
    }
  }

  async saveSettings() {
    await chrome.storage.local.set({ [this.storageKey]: this.downloadOptions });
  }

  toggleDownloadUI() {
    if (this.isDownloadUIVisible) {
      this.hideDownloadUI();
      return;
    }
    this.showDownloadUI();
  }

  openDownloadMenu() {
    this.showDownloadUI();
  }

  showDownloadUI() {
    let panel = document.getElementById('anomtube-download-panel');
    if (!panel) {
      panel = this.createDownloadUI();
      document.body.appendChild(panel);
    }

    panel.style.display = 'block';
    this.isDownloadUIVisible = true;
    this.renderSelectionState();
    this.showStatus('Valmis — valitse formaatti ja laatu.', 'ready');
  }

  hideDownloadUI() {
    const panel = document.getElementById('anomtube-download-panel');
    if (panel) panel.style.display = 'none';
    this.isDownloadUIVisible = false;
  }

  createDownloadUI() {
    const panel = document.createElement('div');
    panel.id = 'anomtube-download-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'AnomTube latausvalikko');
    panel.style.cssText = `
      position: fixed;
      top: 84px;
      right: 24px;
      width: min(360px, calc(100vw - 32px));
      padding: 20px;
      z-index: 2147483646;
      color: #f8faff;
      font-family: Inter, "SF Pro Display", "Segoe UI", system-ui, sans-serif;
      background: radial-gradient(circle at top left, rgba(108,168,255,.24), transparent 42%), linear-gradient(145deg, rgba(5,10,22,.96), rgba(12,18,36,.97));
      border: 1px solid rgba(180, 210, 255, .20);
      border-radius: 22px;
      box-shadow: 0 24px 90px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.08);
      backdrop-filter: blur(22px) saturate(150%);
    `;

    panel.innerHTML = `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:18px;">
        <div>
          <div style="font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:#82b7ff;margin-bottom:6px;">AnomTube Download</div>
          <h3 style="margin:0;font-size:20px;line-height:1.1;letter-spacing:.4px;">⬇️ Lataa nykyinen video</h3>
        </div>
        <button id="anomtube-download-close" type="button" aria-label="Peruuta" style="width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;cursor:pointer;font-size:20px;">×</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
        <button class="anomtube-format-btn" data-format="mp3" type="button">MP3</button>
        <button class="anomtube-format-btn" data-format="mp4" type="button">MP4</button>
      </div>

      <label for="anomtube-quality-select" style="display:block;font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:rgba(248,250,255,.72);margin-bottom:8px;">Laatu</label>
      <select id="anomtube-quality-select" style="width:100%;padding:13px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:#10182d;color:#f8faff;outline:none;margin-bottom:16px;">
        <option value="low">low — nopea / kevyt</option>
        <option value="medium">medium — tasapaino</option>
        <option value="high">high — paras laatu</option>
      </select>

      <div id="anomtube-download-status" style="display:block;min-height:42px;padding:12px 13px;margin-bottom:14px;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.055);font-size:13px;line-height:1.35;color:rgba(248,250,255,.86);"></div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <button id="anomtube-download-btn" type="button" style="padding:13px 14px;border-radius:14px;border:1px solid rgba(108,168,255,.48);background:linear-gradient(135deg, rgba(108,168,255,.36), rgba(181,108,255,.30));color:#fff;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;cursor:pointer;">Lataa</button>
        <button id="anomtube-download-cancel" type="button" style="padding:13px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;cursor:pointer;">Peruutus</button>
      </div>

      <p style="margin:14px 0 0;font-size:11px;line-height:1.45;color:rgba(248,250,255,.52);">Käytä vain omaan tai luvalliseen sisältöön. Ei DRM:n tai maksumuurien kiertämistä.</p>
    `;

    this.bindPanelEvents(panel);
    return panel;
  }

  bindPanelEvents(panel) {
    panel.querySelector('#anomtube-download-close')?.addEventListener('click', () => this.hideDownloadUI());
    panel.querySelector('#anomtube-download-cancel')?.addEventListener('click', () => this.hideDownloadUI());

    panel.querySelectorAll('.anomtube-format-btn').forEach((button) => {
      button.addEventListener('click', async () => {
        if (this.isDownloading) return;
        this.downloadOptions.format = button.dataset.format;
        await this.saveSettings();
        this.renderSelectionState();
      });
    });

    const qualitySelect = panel.querySelector('#anomtube-quality-select');
    qualitySelect?.addEventListener('change', async (event) => {
      if (this.isDownloading) return;
      this.downloadOptions.quality = event.target.value;
      await this.saveSettings();
    });

    panel.querySelector('#anomtube-download-btn')?.addEventListener('click', () => this.startDownload());
  }

  renderSelectionState() {
    const panel = document.getElementById('anomtube-download-panel');
    if (!panel) return;

    panel.querySelectorAll('.anomtube-format-btn').forEach((button) => {
      const selected = button.dataset.format === this.downloadOptions.format;
      button.style.cssText = `
        padding: 14px 12px;
        border-radius: 14px;
        border: 1px solid ${selected ? 'rgba(108,168,255,.70)' : 'rgba(255,255,255,.14)'};
        background: ${selected ? 'linear-gradient(135deg, rgba(108,168,255,.34), rgba(80,243,192,.18))' : 'rgba(255,255,255,.055)'};
        color: #f8faff;
        font-weight: 800;
        letter-spacing: 1.5px;
        cursor: ${this.isDownloading ? 'not-allowed' : 'pointer'};
        opacity: ${this.isDownloading ? '.62' : '1'};
      `;
    });

    const qualitySelect = panel.querySelector('#anomtube-quality-select');
    if (qualitySelect) {
      qualitySelect.value = this.downloadOptions.quality;
      qualitySelect.disabled = this.isDownloading;
    }
  }

  setBusy(isBusy) {
    this.isDownloading = isBusy;
    const button = document.getElementById('anomtube-download-btn');
    if (button) {
      button.disabled = isBusy;
      button.textContent = isBusy ? 'Ladataan…' : 'Lataa';
      button.style.cursor = isBusy ? 'not-allowed' : 'pointer';
      button.style.opacity = isBusy ? '.62' : '1';
    }
    this.renderSelectionState();
  }

  getCurrentVideoPayload() {
    const canonicalUrl = document.querySelector('link[rel="canonical"]')?.href;
    const url = canonicalUrl && canonicalUrl.includes('youtube.com/watch') ? canonicalUrl : window.location.href;
    const titleElement = document.querySelector('h1 yt-formatted-string, h1.title yt-formatted-string, ytd-watch-metadata h1');
    const rawTitle = titleElement?.textContent?.trim() || document.title || 'anomtube-download';
    const title = rawTitle.replace(/\s+-\s+YouTube$/i, '').trim() || 'anomtube-download';

    return {
      url,
      format: this.downloadOptions.format,
      quality: this.downloadOptions.quality,
      title
    };
  }

  async startDownload(options = {}) {
    if (this.isDownloading) return;
    this.showDownloadUI();
    this.setBusy(true);
    this.showStatus('Ladataan — backend käsittelee tiedostoa…', 'loading');

    const payload = { ...this.getCurrentVideoPayload(), ...options };

    try {
      const response = await fetch(this.backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        await this.throwDownloadError(response);
      }

      const blob = await response.blob();
      const filename = this.resolveFilename(response, payload.title, payload.format);
      this.downloadBlob(blob, filename);
      this.showStatus(`Onnistui — ${filename} käynnistyi selaimen latauksiin.`, 'success');
    } catch (error) {
      const backendMessage = 'Download backend ei ole käynnissä. Käynnistä: cd backend && npm install && node server.js';
      const message = error.name === 'TypeError' ? backendMessage : error.message || backendMessage;
      console.error('AnomTube download failed:', error);
      this.showStatus(message, 'error');
    } finally {
      this.setBusy(false);
    }
  }

  async throwDownloadError(response) {
    let errorMessage = `Download failed (${response.status})`;
    try {
      const data = await response.json();
      if (data?.error) errorMessage = data.error;
    } catch (_error) {
      const text = await response.text().catch(() => '');
      if (text) errorMessage = text.slice(0, 240);
    }
    throw new Error(errorMessage);
  }

  resolveFilename(response, title, format) {
    const disposition = response.headers.get('Content-Disposition') || response.headers.get('content-disposition') || '';
    const match = disposition.match(/filename="?([^";]+)"?/i);
    if (match?.[1]) return match[1];

    const safeTitle = (title || 'anomtube-download')
      .replace(/\s+-\s+YouTube$/i, '')
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 140)
      .replace(/^\.+/, '') || 'anomtube-download';

    return `${safeTitle}.${format === 'mp4' ? 'mp4' : 'mp3'}`;
  }

  downloadBlob(blob, filename) {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
  }

  showStatus(message, type = 'ready') {
    const statusEl = document.getElementById('anomtube-download-status');
    if (!statusEl) return;

    const colors = {
      ready: ['rgba(255,255,255,.055)', 'rgba(255,255,255,.10)'],
      loading: ['rgba(108,168,255,.18)', 'rgba(108,168,255,.30)'],
      success: ['rgba(80,243,192,.18)', 'rgba(80,243,192,.34)'],
      error: ['rgba(255,107,107,.18)', 'rgba(255,107,107,.34)']
    };
    const [background, border] = colors[type] || colors.ready;
    statusEl.textContent = message;
    statusEl.style.background = background;
    statusEl.style.borderColor = border;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DownloadManager;
}
