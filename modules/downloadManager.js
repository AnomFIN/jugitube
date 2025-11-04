// Download Manager for AnomTube extension
// Handles downloading YouTube videos/audio with quality options

class DownloadManager {
  constructor() {
    this.isDownloadUIVisible = false;
    this.downloadOptions = {
      format: 'mp3', // mp3 or mp4
      quality: 'medium' // low, medium, high
    };
    this.storageKey = 'anomTubeDownloadSettings';
  }

  async init() {
    const result = await chrome.storage.local.get([this.storageKey]);
    if (result[this.storageKey]) {
      this.downloadOptions = { ...this.downloadOptions, ...result[this.storageKey] };
    }
  }

  async saveSettings() {
    await chrome.storage.local.set({
      [this.storageKey]: this.downloadOptions
    });
  }

  toggleDownloadUI() {
    this.isDownloadUIVisible = !this.isDownloadUIVisible;
    
    if (this.isDownloadUIVisible) {
      this.showDownloadUI();
    } else {
      this.hideDownloadUI();
    }
  }

  showDownloadUI() {
    // Check if UI already exists
    let downloadPanel = document.getElementById('anomtube-download-panel');
    
    if (!downloadPanel) {
      downloadPanel = this.createDownloadUI();
      document.body.appendChild(downloadPanel);
    } else {
      downloadPanel.style.display = 'block';
    }
  }

  hideDownloadUI() {
    const downloadPanel = document.getElementById('anomtube-download-panel');
    if (downloadPanel) {
      downloadPanel.style.display = 'none';
    }
  }

  createDownloadUI() {
    const panel = document.createElement('div');
    panel.id = 'anomtube-download-panel';
    panel.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 320px;
      background: linear-gradient(135deg, rgba(10, 14, 26, 0.98) 0%, rgba(18, 24, 43, 0.98) 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      z-index: 999998;
      backdrop-filter: blur(20px);
      font-family: 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif;
      color: #f8faff;
    `;

    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; font-size: 16px; letter-spacing: 1.5px; text-transform: uppercase;">Download Video</h3>
        <button id="anomtube-download-close" style="
          background: transparent;
          border: none;
          color: #f8faff;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-size: 12px; letter-spacing: 1.2px; text-transform: uppercase; opacity: 0.8;">Format</label>
        <div style="display: flex; gap: 10px;">
          <button class="format-btn" data-format="mp3" style="
            flex: 1;
            padding: 12px;
            background: ${this.downloadOptions.format === 'mp3' ? 'rgba(108, 168, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
            border: 1px solid ${this.downloadOptions.format === 'mp3' ? 'rgba(108, 168, 255, 0.6)' : 'rgba(255, 255, 255, 0.15)'};
            border-radius: 10px;
            color: #f8faff;
            cursor: pointer;
            font-size: 14px;
            letter-spacing: 1.5px;
            transition: all 0.2s;
          ">🎵 MP3</button>
          <button class="format-btn" data-format="mp4" style="
            flex: 1;
            padding: 12px;
            background: ${this.downloadOptions.format === 'mp4' ? 'rgba(108, 168, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
            border: 1px solid ${this.downloadOptions.format === 'mp4' ? 'rgba(108, 168, 255, 0.6)' : 'rgba(255, 255, 255, 0.15)'};
            border-radius: 10px;
            color: #f8faff;
            cursor: pointer;
            font-size: 14px;
            letter-spacing: 1.5px;
            transition: all 0.2s;
          ">🎬 MP4</button>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-size: 12px; letter-spacing: 1.2px; text-transform: uppercase; opacity: 0.8;">Quality</label>
        <select id="anomtube-quality-select" style="
          width: 100%;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          color: #f8faff;
          font-size: 14px;
          cursor: pointer;
        ">
          <option value="low" ${this.downloadOptions.quality === 'low' ? 'selected' : ''}>Low (Faster)</option>
          <option value="medium" ${this.downloadOptions.quality === 'medium' ? 'selected' : ''}>Medium (Balanced)</option>
          <option value="high" ${this.downloadOptions.quality === 'high' ? 'selected' : ''}>High (Best Quality)</option>
        </select>
      </div>

      <button id="anomtube-download-btn" style="
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, rgba(120, 174, 255, 0.4), rgba(176, 120, 255, 0.4));
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 10px;
        color: #f8faff;
        font-size: 14px;
        letter-spacing: 1.8px;
        text-transform: uppercase;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
      ">⬇ Download</button>

      <div id="anomtube-download-status" style="
        margin-top: 12px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        font-size: 12px;
        text-align: center;
        display: none;
      "></div>

      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
        <p style="font-size: 11px; opacity: 0.6; margin: 0; line-height: 1.5;">
          Note: Download uses browser's native download. For MP3 conversion, you may need additional tools.
        </p>
      </div>
    `;

    // Add event listeners
    const closeBtn = panel.querySelector('#anomtube-download-close');
    closeBtn.addEventListener('click', () => this.hideDownloadUI());

    const formatBtns = panel.querySelectorAll('.format-btn');
    formatBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.downloadOptions.format = btn.dataset.format;
        this.saveSettings();
        this.updateFormatButtons(formatBtns, btn.dataset.format);
      });
    });

    const qualitySelect = panel.querySelector('#anomtube-quality-select');
    qualitySelect.addEventListener('change', (e) => {
      this.downloadOptions.quality = e.target.value;
      this.saveSettings();
    });

    const downloadBtn = panel.querySelector('#anomtube-download-btn');
    downloadBtn.addEventListener('click', () => this.startDownload());

    return panel;
  }

  updateFormatButtons(buttons, selectedFormat) {
    buttons.forEach(btn => {
      const isSelected = btn.dataset.format === selectedFormat;
      btn.style.background = isSelected ? 'rgba(108, 168, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)';
      btn.style.borderColor = isSelected ? 'rgba(108, 168, 255, 0.6)' : 'rgba(255, 255, 255, 0.15)';
    });
  }

  async startDownload() {
    const statusEl = document.getElementById('anomtube-download-status');
    const downloadBtn = document.getElementById('anomtube-download-btn');
    
    if (!statusEl || !downloadBtn) return;

    // Get current video URL
    const videoId = new URLSearchParams(window.location.search).get('v');
    if (!videoId) {
      this.showStatus('No video detected', 'error');
      return;
    }

    // Get video title for filename
    const videoTitle = document.querySelector('h1.title yt-formatted-string')?.textContent || 'video';
    const sanitizedTitle = videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Preparing...';
    this.showStatus('Preparing download...', 'info');

    try {
      // Since this is a browser extension, we'll use YouTube's direct video URL
      // Note: This is a simplified version. Real implementation would need backend API
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      // Show information about downloading
      this.showStatus(
        `Format: ${this.downloadOptions.format.toUpperCase()} | Quality: ${this.downloadOptions.quality}`,
        'info'
      );

      // Trigger download using chrome downloads API
      await this.triggerBrowserDownload(videoUrl, sanitizedTitle);
      
      this.showStatus('Download started! Check your downloads folder.', 'success');
    } catch (error) {
      console.error('Download error:', error);
      this.showStatus('Download failed. Please try again.', 'error');
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.textContent = '⬇ Download';
    }
  }

  async triggerBrowserDownload(url, filename) {
    // Use chrome downloads API to trigger download
    const ext = this.downloadOptions.format === 'mp3' ? '.mp3' : '.mp4';
    
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'download',
        url: url,
        filename: `${filename}${ext}`,
        format: this.downloadOptions.format,
        quality: this.downloadOptions.quality
      }, (response) => {
        if (response && response.success) {
          resolve();
        } else {
          reject(new Error(response?.error || 'Download failed'));
        }
      });
    });
  }

  showStatus(message, type) {
    const statusEl = document.getElementById('anomtube-download-status');
    if (!statusEl) return;

    statusEl.style.display = 'block';
    statusEl.textContent = message;
    
    const colors = {
      info: 'rgba(108, 168, 255, 0.3)',
      success: 'rgba(80, 243, 192, 0.3)',
      error: 'rgba(255, 107, 107, 0.3)'
    };
    
    statusEl.style.background = colors[type] || colors.info;

    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 5000);
    }
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DownloadManager;
}
