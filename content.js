// Content script for JugiTube extension
class JugiTube {
  constructor() {
    this.isEnabled = false;
    this.lyricsElements = {
      root: null,
      panel: null,
      title: null,
      artist: null,
      status: null,
      statusText: null,
      lines: null,
      toggle: null,
      retry: null,
      dragHandle: null,
      brandLogo: null
    };
    this.currentLyrics = [];
    this.startTime = 0;
    this.videoElement = null;
    this.originalVideoDisplay = '';
    this.lyricsInterval = null;
    this.domObserver = null;
    this.navigationListener = null;
    this.navigationListenerAttached = false;
    this.lyricsReloadTimeout = null;
    this.placeholderElement = null;
    this.lyricLineElements = [];
    this.lyricsPosition = null;
    this.lyricsRequestToken = 0;
    this.activeVideoId = null;
    this.dragState = null;
    this.lyricsCache = new Map();
    this.boundLyricsPointerMove = this.onLyricsPointerMove.bind(this);
    this.boundLyricsPointerUp = this.onLyricsPointerUp.bind(this);
    this.boundHandleResize = this.handleWindowResize.bind(this);
    this.manualRetryInProgress = false;
    this.customAssets = {
      background: null,
      logo: null
    };
    this.defaultLogoUrl = chrome.runtime.getURL('logo.png');

    this.init();
  }

  async init() {
    // Check if extension is enabled
    const [syncState, assets] = await Promise.all([
      chrome.storage.sync.get(['enabled']),
      chrome.storage.local.get(['customBackground', 'customLogo', 'lyricsConsolePosition'])
    ]);

    this.isEnabled = syncState.enabled || false;
    this.customAssets.background = assets.customBackground || null;
    this.customAssets.logo = assets.customLogo || null;
    this.lyricsPosition = assets.lyricsConsolePosition || null;

    if (this.isEnabled) {
      this.activate();
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request) => {
      if (request.action === 'toggleJugiTube') {
        this.isEnabled = request.enabled;
        if (this.isEnabled) {
          this.activate();
        } else {
          this.deactivate();
        }
      }
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') {
        return;
      }

      let brandingChanged = false;

      if (Object.prototype.hasOwnProperty.call(changes, 'customBackground')) {
        this.customAssets.background = changes.customBackground.newValue || null;
        brandingChanged = true;
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'customLogo')) {
        this.customAssets.logo = changes.customLogo.newValue || null;
        brandingChanged = true;
      }

      if (brandingChanged) {
        this.updatePlaceholderAssets();
        this.applyBrandingToLyricsWindow();
      }
    });
  }
  
  activate() {
    console.log('JugiTube activated');
    this.attachNavigationListeners();
    this.ensureVideoMonitoring();
    this.ensureLyricsUi();
    this.scheduleLyricsRefresh(true);
    this.startLyricsSync();
  }

  deactivate() {
    console.log('JugiTube deactivated');
    this.detachNavigationListeners();
    this.disconnectVideoMonitoring();
    this.unblockVideo();
    this.videoElement = null;
    this.originalVideoDisplay = '';
    this.lyricsRequestToken += 1;
    this.currentLyrics = [];
    this.lyricLineElements = [];
    this.activeVideoId = null;
    this.closeLyricsWindow();
    this.stopLyricsSync();
  }

  ensureVideoMonitoring() {
    if (this.domObserver) {
      return;
    }

    const handleVideoChange = () => {
      const { changed, hasVideo } = this.updateVideoElement();
      if (changed) {
        this.startLyricsSync();
        this.scheduleLyricsRefresh();
      } else if (hasVideo && this.videoElement && this.videoElement.style.display !== 'none') {
        // Ensure the video stays hidden even if YouTube tweaks the DOM.
        this.videoElement.style.display = 'none';
      }
    };

    this.domObserver = new MutationObserver(() => {
      if (!this.isEnabled) {
        return;
      }
      handleVideoChange();
    });

    this.domObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    handleVideoChange();
  }

  updateVideoElement() {
    if (!this.isEnabled) {
      return { changed: false, hasVideo: !!this.videoElement };
    }

    const video = document.querySelector('video');

    if (!video) {
      if (this.videoElement) {
        this.unblockVideo(this.videoElement);
        this.videoElement = null;
      }
      return { changed: false, hasVideo: false };
    }

    const previousVideo = this.videoElement;
    const isNewVideo = previousVideo !== video;

    if (isNewVideo && previousVideo) {
      this.unblockVideo(previousVideo);
    }

    this.videoElement = video;
    if (isNewVideo) {
      this.originalVideoDisplay = video.style.display;
    }

    this.applyPlaceholder(video);

    return { changed: isNewVideo, hasVideo: true };
  }

  applyPlaceholder(video) {
    if (!video) {
      return;
    }

    video.style.display = 'none';

    const videoContainer = video.parentElement;
    if (!videoContainer) {
      return;
    }

    const computedPosition = window.getComputedStyle(videoContainer).position;
    if (!videoContainer.hasAttribute('data-anomfin-audio-only')) {
      videoContainer.setAttribute('data-anomfin-audio-only', 'true');
      if (computedPosition === 'static') {
        videoContainer.dataset.anomfinOriginalPosition = 'static';
        videoContainer.style.position = 'relative';
      }
    }

    if (this.placeholderElement && this.placeholderElement.parentElement !== videoContainer) {
      this.placeholderElement.remove();
      this.placeholderElement = null;
    }

    const { logoUrl } = this.getAssetUrls();

    if (!this.placeholderElement) {
      const placeholder = document.createElement('div');
      placeholder.id = 'jugitube-placeholder';
      placeholder.innerHTML = `
        <div class="jugitube-overlay">
          <div class="jugitube-floating-logo jugitube-floating-logo--one"></div>
          <div class="jugitube-floating-logo jugitube-floating-logo--two"></div>
          <div class="jugitube-audio-only">
              <div class="jugitube-brand-badge">
                <img src="${logoUrl}" alt="AnomFIN Tools logo" class="jugitube-logo-img" />
                <div class="jugitube-brand-text">
                  <span class="jugitube-brand-primary">AnomFIN Tools</span>
                  <span class="jugitube-brand-secondary">Audio only- tube</span>
                </div>
            </div>
            <div class="jugitube-title">Audio Only Mode</div>
            <div class="jugitube-subtitle">AnomTools soundstage engaged — lean back and enjoy the vibes.</div>
            <div class="jugitube-note">Lyrics stream live inside the AnomFIN karaoke console overlay.</div>
            <div class="jugitube-credit">Made by: <strong>Jugi @ AnomFIN · AnomTools</strong></div>
          </div>
        </div>
      `;
      videoContainer.appendChild(placeholder);
      this.placeholderElement = placeholder;
    }

    this.updatePlaceholderAssets();
  }

  getAssetUrls() {
    const logoUrl = this.customAssets.logo || this.defaultLogoUrl;
    const backgroundUrl = this.customAssets.background || this.customAssets.logo || this.defaultLogoUrl;
    return { logoUrl, backgroundUrl };
  }

  updatePlaceholderAssets() {
    if (!this.placeholderElement) {
      return;
    }

    const { logoUrl, backgroundUrl } = this.getAssetUrls();
    this.placeholderElement.style.setProperty('--jugitube-logo', `url("${logoUrl}")`);
    this.placeholderElement.style.setProperty('--jugitube-background', `url("${backgroundUrl}")`);

    const logoImg = this.placeholderElement.querySelector('.jugitube-logo-img');
    if (logoImg) {
      logoImg.src = logoUrl;
    }
  }

  applyBrandingToLyricsWindow() {
    if (!this.lyricsElements.root) {
      return;
    }

    const { logoUrl, backgroundUrl } = this.getAssetUrls();
    const root = this.lyricsElements.root;

    root.style.setProperty('--anomfin-logo', `url("${logoUrl}")`);
    root.style.setProperty('--anomfin-background', `url("${backgroundUrl}")`);

    if (this.lyricsElements.brandLogo) {
      this.lyricsElements.brandLogo.src = logoUrl;
    }
  }

  unblockVideo(targetVideo = this.videoElement) {
    if (targetVideo) {
      targetVideo.style.display = this.originalVideoDisplay;

      const container = targetVideo.parentElement;
      if (container && container.hasAttribute('data-anomfin-audio-only')) {
        if (container.dataset.anomfinOriginalPosition === 'static') {
          container.style.position = '';
          delete container.dataset.anomfinOriginalPosition;
        }
        container.removeAttribute('data-anomfin-audio-only');
      }
    }

    if (this.placeholderElement) {
      this.placeholderElement.remove();
      this.placeholderElement = null;
    }
  }

  disconnectVideoMonitoring() {
    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = null;
    }

    if (this.lyricsReloadTimeout) {
      clearTimeout(this.lyricsReloadTimeout);
      this.lyricsReloadTimeout = null;
    }
  }

  ensureLyricsUi() {
    if (this.lyricsElements.root && document.body && document.body.contains(this.lyricsElements.root)) {
      this.applyBrandingToLyricsWindow();
      return;
    }

    if (!document.body) {
      return;
    }

    const { logoUrl } = this.getAssetUrls();
    const root = document.createElement('aside');
    root.id = 'anomfin-lyrics-console';
    root.className = 'anomfin-lyrics';
    root.setAttribute('role', 'complementary');
    root.setAttribute('aria-label', 'AnomFIN Tools karaoke console');

    root.innerHTML = `
      <div class="anomfin-lyrics__panel">
        <div class="anomfin-lyrics__branding">
          <div class="anomfin-lyrics__brand-block" data-role="drag-handle">
            <img src="${logoUrl}" alt="AnomFIN Tools logo" class="anomfin-lyrics__logo" />
            <div class="anomfin-lyrics__brand-copy">
              <span class="anomfin-lyrics__brand-title">AnomFIN Tools</span>
              <span class="anomfin-lyrics__brand-subtitle">AnomTools Karaoke Console</span>
            </div>
          </div>
          <button type="button" class="anomfin-lyrics__btn" data-role="toggle" aria-expanded="true">PIILOITA</button>
        </div>
        <div class="anomfin-lyrics__meta">
          <div class="anomfin-lyrics__song" data-role="title">🎵 JugiTube Lyrics</div>
          <div class="anomfin-lyrics__artist" data-role="artist">Karaoke Mode Active</div>
        </div>
        <div class="anomfin-lyrics__status" data-role="status" data-variant="loading" role="status" aria-live="polite">
          <span class="anomfin-lyrics__status-dot"></span>
          <span class="anomfin-lyrics__status-text" data-role="status-text">AnomFIN analysoi kappaletta…</span>
        </div>
        <div class="anomfin-lyrics__body">
          <div class="anomfin-lyrics__lines" data-role="lines" role="list" tabindex="0"></div>
        </div>
        <div class="anomfin-lyrics__footer">Made by: <strong>Jugi @ AnomFIN · AnomTools</strong></div>
      </div>
    `;

    document.body.appendChild(root);

    this.lyricsElements = {
      root,
      panel: root.querySelector('.anomfin-lyrics__panel'),
      title: root.querySelector('[data-role="title"]'),
      artist: root.querySelector('[data-role="artist"]'),
      status: root.querySelector('[data-role="status"]'),
      statusText: root.querySelector('[data-role="status-text"]'),
      lines: root.querySelector('[data-role="lines"]'),
      toggle: root.querySelector('[data-role="toggle"]'),
      retry: root.querySelector('[data-role="retry"]'),
      dragHandle: root.querySelector('[data-role="drag-handle"]'),
      brandLogo: root.querySelector('.anomfin-lyrics__logo')
    };

    this.lyricLineElements = [];

    this.renderLyricsPlaceholder('AnomFIN analysoi kappaletta…', 'loading');
    this.updateLyricsStatus('AnomFIN analysoi kappaletta…', 'loading');

    if (this.lyricsElements.toggle) {
      this.lyricsElements.toggle.addEventListener('click', () => {
        const collapsed = root.classList.toggle('anomfin-lyrics--collapsed');
        this.lyricsElements.toggle.textContent = collapsed ? 'AVAA' : 'PIILOITA';
        this.lyricsElements.toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        if (!collapsed) {
          this.handleWindowResize();
        }
      });
    }

    if (this.lyricsElements.dragHandle) {
      this.lyricsElements.dragHandle.addEventListener('pointerdown', (event) => this.onLyricsPointerDown(event));
    }

    if (this.lyricsElements.retry) {
      this.lyricsElements.retry.addEventListener('click', () => this.handleManualLyricsRetry());
      this.lyricsElements.retry.dataset.originalLabel = this.lyricsElements.retry.textContent.trim();
    }

    window.addEventListener('resize', this.boundHandleResize);

    if (this.lyricsPosition) {
      this.setLyricsPosition(this.lyricsPosition, { skipPersist: true });
    }

    this.applyBrandingToLyricsWindow();
  }

  renderLyricsPlaceholder(message, mode = 'loading') {
    if (!this.lyricsElements.lines) {
      return;
    }

    const variants = {
      loading: 'anomfin-lyrics__placeholder--loading',
      empty: 'anomfin-lyrics__placeholder--empty',
      error: 'anomfin-lyrics__placeholder--error'
    };

    const placeholderClass = variants[mode] || variants.loading;
    const container = this.lyricsElements.lines;
    container.innerHTML = '';

    const placeholder = document.createElement('div');
    placeholder.className = `anomfin-lyrics__placeholder ${placeholderClass}`;
    placeholder.textContent = message;
    container.appendChild(placeholder);

    this.lyricLineElements = [];
  }

  updateLyricsStatus(message, variant = 'info') {
    if (!this.lyricsElements.status) {
      return;
    }

    const allowed = new Set(['loading', 'ready', 'error', 'empty', 'info']);
    const appliedVariant = allowed.has(variant) ? variant : 'info';
    this.lyricsElements.status.setAttribute('data-variant', appliedVariant);

    const textEl = this.lyricsElements.statusText || this.lyricsElements.status.querySelector('[data-role="status-text"]');
    if (textEl) {
      textEl.textContent = message;
    }
  }

  updateLyricsHeader(title, artist) {
    if (this.lyricsElements.title) {
      const resolvedTitle = title || 'Unknown Title';
      this.lyricsElements.title.textContent = resolvedTitle;
      this.lyricsElements.title.setAttribute('title', resolvedTitle);
    }

    if (this.lyricsElements.artist) {
      const resolvedArtist = artist || 'Unknown Artist';
      this.lyricsElements.artist.textContent = resolvedArtist;
      this.lyricsElements.artist.setAttribute('title', resolvedArtist);
    }
  }

  setLyricsPosition(position, { skipPersist = false } = {}) {
    if (!this.lyricsElements.root) {
      return;
    }

    const panel = this.lyricsElements.panel || this.lyricsElements.root;
    const width = panel.offsetWidth || this.lyricsElements.root.offsetWidth || 360;
    const height = panel.offsetHeight || this.lyricsElements.root.offsetHeight || 420;

    const maxLeft = Math.max(window.innerWidth - width - 16, 0);
    const maxTop = Math.max(window.innerHeight - height - 16, 0);

    const left = Math.min(Math.max(position.left, 16), maxLeft);
    const top = Math.min(Math.max(position.top, 16), maxTop);

    this.lyricsElements.root.style.left = `${left}px`;
    this.lyricsElements.root.style.top = `${top}px`;
    this.lyricsElements.root.style.right = 'auto';
    this.lyricsElements.root.style.bottom = 'auto';

    if (!skipPersist) {
      this.lyricsPosition = { left, top };
      const result = chrome.storage?.local?.set?.({ lyricsConsolePosition: this.lyricsPosition });
      if (result && typeof result.catch === 'function') {
        result.catch(() => {});
      }
    }
  }

  onLyricsPointerDown(event) {
    if (!this.lyricsElements.root || event.button !== 0) {
      return;
    }

    event.preventDefault();

    const rect = this.lyricsElements.root.getBoundingClientRect();
    this.dragState = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };

    if (event.currentTarget && typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    this.lyricsElements.root.classList.add('anomfin-lyrics--dragging');

    document.addEventListener('pointermove', this.boundLyricsPointerMove);
    document.addEventListener('pointerup', this.boundLyricsPointerUp);
    document.addEventListener('pointercancel', this.boundLyricsPointerUp);
  }

  onLyricsPointerMove(event) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) {
      return;
    }

    const left = event.clientX - this.dragState.offsetX;
    const top = event.clientY - this.dragState.offsetY;
    this.setLyricsPosition({ left, top }, { skipPersist: true });
  }

  onLyricsPointerUp(event) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) {
      return;
    }

    let left = event.clientX;
    let top = event.clientY;

    if (Number.isFinite(left) && Number.isFinite(top)) {
      left -= this.dragState.offsetX;
      top -= this.dragState.offsetY;
    } else if (this.lyricsElements.root) {
      const rect = this.lyricsElements.root.getBoundingClientRect();
      left = rect.left;
      top = rect.top;
    } else if (this.lyricsPosition) {
      left = this.lyricsPosition.left;
      top = this.lyricsPosition.top;
    } else {
      left = 24;
      top = 24;
    }

    this.setLyricsPosition({ left, top });

    if (this.lyricsElements.dragHandle && typeof this.lyricsElements.dragHandle.releasePointerCapture === 'function') {
      try {
        this.lyricsElements.dragHandle.releasePointerCapture(this.dragState.pointerId);
      } catch (error) {
        // Ignore release errors
      }
    }

    this.detachLyricsDragListeners();
    this.dragState = null;
  }

  detachLyricsDragListeners() {
    document.removeEventListener('pointermove', this.boundLyricsPointerMove);
    document.removeEventListener('pointerup', this.boundLyricsPointerUp);
    document.removeEventListener('pointercancel', this.boundLyricsPointerUp);

    if (this.lyricsElements.dragHandle && this.dragState && typeof this.lyricsElements.dragHandle.releasePointerCapture === 'function') {
      try {
        this.lyricsElements.dragHandle.releasePointerCapture(this.dragState.pointerId);
      } catch (error) {
        // Ignore release errors when detaching listeners
      }
    }

    if (this.lyricsElements.root) {
      this.lyricsElements.root.classList.remove('anomfin-lyrics--dragging');
    }
  }

  handleWindowResize() {
    if (!this.lyricsElements.root) {
      return;
    }

    if (this.lyricsPosition) {
      this.setLyricsPosition(this.lyricsPosition, { skipPersist: true });
    }
  }

  scrollActiveLyricIntoView(lineElement) {
    if (!this.lyricsElements.lines || !lineElement) {
      return;
    }

    const container = this.lyricsElements.lines;
    const containerHeight = container.clientHeight;
    const targetOffset = lineElement.offsetTop;
    const targetHeight = lineElement.offsetHeight;
    const scrollTarget = Math.max(targetOffset - containerHeight / 2 + targetHeight / 2, 0);

    container.scrollTo({
      top: scrollTarget,
      behavior: 'smooth'
    });
  }

  extractVideoMetadata() {
    const titleElement = document.querySelector('h1.title yt-formatted-string, h1 yt-formatted-string');
    let rawTitle = titleElement ? titleElement.textContent.trim() : '';

    if (!rawTitle && document.title) {
      rawTitle = document.title.replace(/ - YouTube$/i, '').trim();
    }

    const artistElement = document.querySelector('#channel-name a, #owner-name a, ytd-video-owner-renderer a');
    let artist = artistElement ? artistElement.textContent.trim() : '';

    let cleanedTitle = rawTitle;
    const hyphenMatch = rawTitle.match(/^(.*?)[\-–—]{1}(.*)$/);
    if (hyphenMatch) {
      const possibleArtist = hyphenMatch[1].trim();
      const possibleTitle = hyphenMatch[2].trim();
      if (!artist && possibleArtist) {
        artist = possibleArtist;
      }
      if (possibleTitle) {
        cleanedTitle = possibleTitle;
      }
    }

    cleanedTitle = cleanedTitle
      .replace(/\(official.*?\)/gi, '')
      .replace(/\(feat\.?[^)]*\)/gi, '')
      .replace(/\(ft\.?[^)]*\)/gi, '')
      .replace(/\[.*?\]/g, '')
      .replace(/feat\.?\s+.+/gi, '')
      .replace(/ft\.?\s+.+/gi, '')
      .replace(/lyrics?/gi, '')
      .replace(/official\s+music\s+video/gi, '')
      .replace(/official\s+video/gi, '')
      .replace(/visualizer/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    artist = artist
      .replace(/\s+-\s+Topic$/i, '')
      .replace(/\s+VEVO$/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      title: cleanedTitle || rawTitle || 'Unknown Title',
      artist: artist || 'Unknown Artist',
      rawTitle: rawTitle || 'Unknown Title'
    };
  }

  extractVideoId() {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get('v');
    } catch (error) {
      return null;
    }
  }

  normalizeLyrics(rawLyrics) {
    if (!Array.isArray(rawLyrics)) {
      return [];
    }

    const normalized = [];

    rawLyrics.forEach((entry, index) => {
      if (entry === null || entry === undefined) {
        return;
      }

      const textValue = typeof entry === 'string' ? entry : entry.text || entry.line || '';
      const trimmedText = textValue.toString().trim();

      if (!trimmedText) {
        return;
      }

      let timeValue = 0;

      if (typeof entry === 'number') {
        timeValue = entry;
      } else if (typeof entry.time === 'number') {
        timeValue = entry.time;
      } else if (typeof entry.time === 'string') {
        const parsed = parseFloat(entry.time.replace(',', '.'));
        timeValue = Number.isNaN(parsed) ? index * 4 : parsed;
      } else {
        timeValue = index * 4;
      }

      if (!Number.isFinite(timeValue) || timeValue < 0) {
        timeValue = Math.max(index * 4, 0);
      }

      normalized.push({
        time: timeValue,
        text: trimmedText
      });
    });

    normalized.sort((a, b) => a.time - b.time);
    return normalized;
  }

  trimLyricsCache(limit = 12) {
    if (!this.lyricsCache || typeof this.lyricsCache.keys !== 'function') {
      return;
    }

    while (this.lyricsCache.size > limit) {
      const oldestEntry = this.lyricsCache.keys().next();
      if (oldestEntry && typeof oldestEntry.value !== 'undefined') {
        this.lyricsCache.delete(oldestEntry.value);
      } else {
        break;
      }
    }
  }
  
  async loadLyrics(options = {}) {
    const { manualRetry = false } = options;

    if (!this.isEnabled) {
      return;
    }

    this.ensureLyricsUi();

    const metadata = this.extractVideoMetadata();
    const videoId = this.extractVideoId();
    if (videoId) {
      this.activeVideoId = videoId;
    }

    this.updateLyricsHeader(metadata.title, metadata.artist);

    const cacheKey = videoId || `${metadata.title}:::${metadata.artist}`;
    if (manualRetry && cacheKey) {
      this.lyricsCache.delete(cacheKey);
    }

    if (!manualRetry && cacheKey && this.lyricsCache.has(cacheKey)) {
      const cached = this.lyricsCache.get(cacheKey);
      const cachedLyrics = Array.isArray(cached?.lyrics) ? cached.lyrics : [];
      this.currentLyrics = cachedLyrics.slice();
      this.lyricLineElements = [];

      if (this.currentLyrics.length > 0) {
        this.displayLyrics();
      } else {
        this.showNoLyrics(cached?.error || null);
      }

      return;
    }

    const loadingMessage = manualRetry ? 'Haetaan uusia lyriikoita…' : 'AnomFIN analysoi kappaletta…';
    this.updateLyricsStatus(loadingMessage, 'loading');
    this.renderLyricsPlaceholder(manualRetry ? 'AnomFIN hakee tuoreita lyriikoita…' : 'AnomFIN analysoi kappaletta…', 'loading');
    this.currentLyrics = [];
    this.lyricLineElements = [];

    this.lyricsRequestToken += 1;
    const requestToken = this.lyricsRequestToken;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getLyrics',
        title: metadata.title,
        artist: metadata.artist,
        manualRetry
      });

      if (requestToken !== this.lyricsRequestToken) {
        return;
      }

      if (response && Array.isArray(response.lyrics) && response.lyrics.length > 0) {
        const normalized = this.normalizeLyrics(response.lyrics);
        if (normalized.length > 0) {
          this.currentLyrics = normalized.slice();
          if (cacheKey) {
            this.lyricsCache.set(cacheKey, { lyrics: this.currentLyrics.slice(), error: null });
            this.trimLyricsCache();
          }
          this.displayLyrics();
          return;
        }
      }

      this.currentLyrics = [];
      if (cacheKey) {
        this.lyricsCache.set(cacheKey, { lyrics: [], error: response && response.error ? response.error : null });
        this.trimLyricsCache();
      }
      this.showNoLyrics(response && response.error ? response.error : null);
    } catch (error) {
      console.log('Could not load lyrics:', error);

      if (requestToken !== this.lyricsRequestToken) {
        return;
      }

      this.currentLyrics = [];
      const fallbackMessage = 'AnomFIN karaoke backend unreachable just now — yritä uudelleen hetken kuluttua.';
      if (cacheKey) {
        this.lyricsCache.set(cacheKey, { lyrics: [], error: fallbackMessage });
        this.trimLyricsCache();
      }
      this.showNoLyrics(fallbackMessage);
    }
  }

  async handleManualLyricsRetry() {
    if (!this.lyricsElements.retry || this.manualRetryInProgress) {
      return;
    }

    const button = this.lyricsElements.retry;
    this.manualRetryInProgress = true;

    const originalLabel = button.dataset.originalLabel || button.textContent.trim();
    button.disabled = true;
    button.classList.add('anomfin-lyrics__btn--loading');
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Generating…';

    try {
      await this.loadLyrics({ manualRetry: true });
    } catch (error) {
      console.error('Manual lyrics retry failed:', error);
      this.updateLyricsStatus('Lyriikoiden haku epäonnistui — yritä hetken päästä uudelleen.', 'error');
      this.renderLyricsPlaceholder('Lyriikoita ei löytynyt – kokeile hakea hetken kuluttua uudelleen.', 'error');
    } finally {
      button.disabled = false;
      button.classList.remove('anomfin-lyrics__btn--loading');
      button.removeAttribute('aria-busy');
      button.textContent = originalLabel;
      this.manualRetryInProgress = false;
      requestAnimationFrame(() => {
        try {
          button.focus({ preventScroll: true });
        } catch (focusError) {
          button.focus();
        }
      });
    }
  }

  scheduleLyricsRefresh(immediate = false) {
    if (this.lyricsReloadTimeout) {
      clearTimeout(this.lyricsReloadTimeout);
      this.lyricsReloadTimeout = null;
    }

    if (!this.isEnabled) {
      return;
    }

    this.ensureLyricsUi();

    if (immediate) {
      this.loadLyrics();
      return;
    }

    this.lyricsReloadTimeout = setTimeout(() => {
      this.lyricsReloadTimeout = null;
      this.loadLyrics();
    }, 300);
  }

  displayLyrics() {
    if (!this.lyricsElements.lines) {
      return;
    }

    if (!this.currentLyrics.length) {
      this.renderLyricsPlaceholder('Lyriikoita ei löytynyt — AnomFIN jatkaa etsintää.', 'empty');
      this.updateLyricsStatus('Lyriikoita ei löytynyt', 'empty');
      return;
    }

    const container = this.lyricsElements.lines;
    container.innerHTML = '';

    const fragment = document.createDocumentFragment();

    this.currentLyrics.forEach((lyric, index) => {
      const lyricElement = document.createElement('div');
      lyricElement.className = 'anomfin-lyrics__line';
      lyricElement.textContent = lyric.text;
      lyricElement.dataset.time = String(lyric.time);
      lyricElement.dataset.index = String(index);
      lyricElement.setAttribute('role', 'listitem');
      fragment.appendChild(lyricElement);
    });

    container.appendChild(fragment);
    this.lyricLineElements = Array.from(container.querySelectorAll('.anomfin-lyrics__line'));
    this.updateLyricsStatus('Synkronoidut lyriikat by AnomFIN · AnomTools', 'ready');
    container.scrollTop = 0;
    this.syncLyrics();
  }

  showNoLyrics(message = null) {
    const hasMessage = typeof message === 'string' && message.trim().length > 0;
    const displayMessage = hasMessage
      ? message.trim()
      : 'No lyrics available for this video yet — AnomFIN scanners are still sweeping the net.';
    const variant = hasMessage ? 'error' : 'empty';
    this.renderLyricsPlaceholder(displayMessage, variant);
    this.updateLyricsStatus(hasMessage ? 'Lyriikoiden haku epäonnistui' : 'Lyriikoita ei löytynyt', variant);
  }
  
  startLyricsSync() {
    if (this.lyricsInterval) {
      clearInterval(this.lyricsInterval);
    }

    this.startTime = Date.now();

    this.lyricsInterval = setInterval(() => {
      this.syncLyrics();
    }, 400);
  }
  
  stopLyricsSync() {
    if (this.lyricsInterval) {
      clearInterval(this.lyricsInterval);
      this.lyricsInterval = null;
    }
  }
  
  syncLyrics() {
    if (!this.videoElement || !this.lyricLineElements.length) {
      return;
    }

    const currentTime = this.videoElement.currentTime;

    let currentIndex = -1;
    for (let i = 0; i < this.currentLyrics.length; i++) {
      if (currentTime + 0.2 >= this.currentLyrics[i].time) {
        currentIndex = i;
      } else {
        break;
      }
    }

    this.lyricLineElements.forEach((element, index) => {
      const isCurrent = index === currentIndex;
      const isNext = index === currentIndex + 1 || (currentIndex === -1 && index === 0);
      element.classList.toggle('anomfin-lyrics__line--current', isCurrent);
      element.classList.toggle('anomfin-lyrics__line--next', isNext && !isCurrent);
    });

    if (currentIndex >= 0 && this.lyricLineElements[currentIndex]) {
      this.scrollActiveLyricIntoView(this.lyricLineElements[currentIndex]);
    }
  }

  closeLyricsWindow() {
    this.detachLyricsDragListeners();
    window.removeEventListener('resize', this.boundHandleResize);

    if (this.lyricsElements.root && this.lyricsElements.root.parentElement) {
      this.lyricsElements.root.parentElement.removeChild(this.lyricsElements.root);
    }

    this.lyricsElements = {
      root: null,
      panel: null,
      title: null,
      artist: null,
      status: null,
      statusText: null,
      lines: null,
      toggle: null,
      retry: null,
      dragHandle: null,
      brandLogo: null
    };

    this.lyricLineElements = [];
    this.dragState = null;
    this.manualRetryInProgress = false;
  }

  attachNavigationListeners() {
    if (this.navigationListenerAttached) {
      return;
    }

    this.navigationListener = () => {
      if (!this.isEnabled) {
        return;
      }

      const { changed } = this.updateVideoElement();
      if (changed) {
        this.startLyricsSync();
      }
      this.scheduleLyricsRefresh();
    };

    window.addEventListener('yt-navigate-finish', this.navigationListener);
    document.addEventListener('yt-page-data-updated', this.navigationListener);
    window.addEventListener('popstate', this.navigationListener);
    this.navigationListenerAttached = true;
  }

  detachNavigationListeners() {
    if (!this.navigationListenerAttached || !this.navigationListener) {
      return;
    }

    window.removeEventListener('yt-navigate-finish', this.navigationListener);
    document.removeEventListener('yt-page-data-updated', this.navigationListener);
    window.removeEventListener('popstate', this.navigationListener);
    this.navigationListenerAttached = false;
    this.navigationListener = null;
  }
}

// Initialize JugiTube when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new JugiTube();
  });
} else {
  new JugiTube();
}
