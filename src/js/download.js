// Download Manager for AnomTube
// Handles download UI and communication with backend server

class DownloadManager {
  constructor() {
    this.backendUrl = 'http://localhost:3000'; // Default backend URL
    this.downloadButton = null;
    this.downloadDialog = null;
  }

  /**
   * Initialize download manager
   */
  init() {
    // Check if backend URL is configured
    chrome.storage.sync.get('backendUrl', (result) => {
      if (result.backendUrl) {
        this.backendUrl = result.backendUrl;
      }
    });
  }

  /**
   * Show download dialog
   * @param {Object} videoInfo - Video information {id, title, url}
   */
  showDownloadDialog(videoInfo) {
    // Remove existing dialog if any
    if (this.downloadDialog) {
      this.downloadDialog.remove();
    }

    // Create download dialog
    const dialog = document.createElement('div');
    dialog.id = 'anomtube-download-dialog';
    dialog.className = 'anomtube-download-dialog';
    dialog.innerHTML = `
      <div class="anomtube-download-panel">
        <div class="anomtube-download-header">
          <h3>Download Video</h3>
          <button class="anomtube-download-close" aria-label="Close">&times;</button>
        </div>
        <div class="anomtube-download-body">
          <div class="anomtube-download-info">
            <strong>${this.escapeHtml(videoInfo.title)}</strong>
          </div>
          <div class="anomtube-download-options">
            <div class="anomtube-download-field">
              <label for="download-format">Format:</label>
              <select id="download-format" class="anomtube-download-select">
                <option value="mp4">MP4 (Video)</option>
                <option value="mp3">MP3 (Audio)</option>
              </select>
            </div>
            <div class="anomtube-download-field">
              <label for="download-quality">Quality:</label>
              <select id="download-quality" class="anomtube-download-select">
                <option value="high">High</option>
                <option value="medium" selected>Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div class="anomtube-download-status"></div>
        </div>
        <div class="anomtube-download-footer">
          <button class="anomtube-download-btn anomtube-download-btn--secondary" data-action="cancel">Cancel</button>
          <button class="anomtube-download-btn anomtube-download-btn--primary" data-action="download">Download</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);
    this.downloadDialog = dialog;

    // Add event listeners
    const closeBtn = dialog.querySelector('.anomtube-download-close');
    const cancelBtn = dialog.querySelector('[data-action="cancel"]');
    const downloadBtn = dialog.querySelector('[data-action="download"]');

    closeBtn.addEventListener('click', () => this.hideDownloadDialog());
    cancelBtn.addEventListener('click', () => this.hideDownloadDialog());
    downloadBtn.addEventListener('click', () => this.initiateDownload(videoInfo));
  }

  /**
   * Hide download dialog
   */
  hideDownloadDialog() {
    if (this.downloadDialog) {
      this.downloadDialog.remove();
      this.downloadDialog = null;
    }
  }

  /**
   * Initiate download
   * @param {Object} videoInfo - Video information
   */
  async initiateDownload(videoInfo) {
    const format = document.getElementById('download-format').value;
    const quality = document.getElementById('download-quality').value;
    const statusEl = this.downloadDialog.querySelector('.anomtube-download-status');
    const downloadBtn = this.downloadDialog.querySelector('[data-action="download"]');

    // Disable download button
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Downloading...';
    statusEl.innerHTML = '<div class="anomtube-download-status--loading">Initiating download...</div>';

    try {
      const response = await fetch(`${this.backendUrl}/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: videoInfo.url,
          format,
          quality
        })
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${videoInfo.title}.${format}`;
      
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      statusEl.innerHTML = '<div class="anomtube-download-status--success">Download completed!</div>';
      
      // Close dialog after 2 seconds
      setTimeout(() => this.hideDownloadDialog(), 2000);
    } catch (error) {
      console.error('Download failed:', error);
      statusEl.innerHTML = `<div class="anomtube-download-status--error">Download failed: ${this.escapeHtml(error.message)}<br><small>Make sure the backend server is running.</small></div>`;
      downloadBtn.disabled = false;
      downloadBtn.textContent = 'Retry';
    }
  }

  /**
   * Extract video information from page
   * @returns {Object|null} Video info or null
   */
  extractVideoInfo() {
    try {
      const url = window.location.href;
      const urlParams = new URLSearchParams(window.location.search);
      const videoId = urlParams.get('v');
      
      if (!videoId) return null;

      const titleElement = document.querySelector('h1.title yt-formatted-string, h1 yt-formatted-string');
      const title = titleElement ? titleElement.textContent.trim() : 'video';

      return {
        id: videoId,
        title: this.sanitizeFilename(title),
        url: url
      };
    } catch (error) {
      console.error('Failed to extract video info:', error);
      return null;
    }
  }

  /**
   * Sanitize filename
   * @param {string} filename - Filename to sanitize
   * @returns {string} Sanitized filename
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 200);
  }

  /**
   * Escape HTML
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Check backend health
   * @returns {Promise<boolean>} Backend health status
   */
  async checkBackendHealth() {
    try {
      const response = await fetch(`${this.backendUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DownloadManager;
}
