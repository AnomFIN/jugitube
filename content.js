// Content script for AnomTube extension
class AnomTube {
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
    this.resetManualRetryState();
    this.placeholderResizeObserver = null;
    this.placeholderResizeTargets = new Set();
    this.captionMirrorElement = null;
    this.captionObserver = null;
    this.captionObserverInterval = null;
    this.captionSourceElement = null;
    this.customAssets = {
      background: null,
      logo: null
    };
    this.defaultLogoUrl = chrome.runtime.getURL('logo.png');
    this.defaultBackgroundUrl = chrome.runtime.getURL('asd.png');
    this.adPreferences = {
      muteAds: false,
      skipAds: false,
      blockAds: false
    };
    this.hideLyrics = false;
    this.allowVideo = false;
    this.adMonitorInterval = null;
    this.adMuteSnapshot = null;
    this.wasMutedByAdControl = false;
    this.adSkipperObserver = null;
    this.adSkipAttempts = new Map();
    this.lastAdSkipAttempt = 0;

    // New modular components
    this.settingsManager = new SettingsManager();
    this.adSkipper = new AdSkipper();
    this.lyricHandler = new LyricHandler();
    this.settings = {
      autoClickSkipAds: false,
      allowVideoKeepAdSettings: false,
      hidePopupCompletely: false,
      expandToolbar: true
    };

    // New feature modules
    this.themeManager = typeof ThemeManager !== 'undefined' ? new ThemeManager() : null;
    this.hotkeyManager = typeof HotkeyManager !== 'undefined' ? new HotkeyManager() : null;
    this.pipManager = typeof PipManager !== 'undefined' ? new PipManager() : null;
    this.playlistManager = typeof PlaylistManager !== 'undefined' ? new PlaylistManager() : null;

    this.init();
  }

  async init() {
    const [syncState, assets] = await Promise.all([
      chrome.storage.sync.get(['enabled', 'muteAds', 'skipAds', 'blockAds', 'hideLyrics', 'allowVideo']),
      chrome.storage.local.get(['customBackground', 'customLogo', 'lyricsConsolePosition'])
    ]);

    this.isEnabled = syncState.enabled || false;
    this.adPreferences.muteAds = Boolean(syncState.muteAds);
    this.adPreferences.skipAds = Boolean(syncState.skipAds);
    this.adPreferences.blockAds = Boolean(syncState.blockAds);
    this.hideLyrics = Boolean(syncState.hideLyrics);
    this.allowVideo = Boolean(syncState.allowVideo);
    this.customAssets.background = assets.customBackground || null;
    this.customAssets.logo = assets.customLogo || null;
    this.lyricsPosition = assets.lyricsConsolePosition || null;

    // Initialize new feature modules
    this.initializeFeatureModules();

    if (this.isEnabled) {
      this.activate();
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request) => {
      if (request.action === 'toggleAnomTube') {
        this.isEnabled = request.enabled;
        if (this.isEnabled) {
          this.activate();
        } else {
          this.deactivate();
        }
      } else if (request.action === 'updateAdPreferences') {
        this.updateAdPreferences(request.preferences || {});
      } else if (request.action === 'updateSettings') {
        this.updateSettings(request.settings || {});
      }
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local') {
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
      }

      if (areaName === 'sync') {
        if (Object.prototype.hasOwnProperty.call(changes, 'enabled')) {
          const enabled = Boolean(changes.enabled.newValue);
          if (this.isEnabled !== enabled) {
            this.isEnabled = enabled;
            if (this.isEnabled) {
              this.activate();
            } else {
              this.deactivate();
            }
          }
        }

        // Setting key constants to maintain consistency
        const ALL_SETTINGS_KEYS = ['muteAds', 'skipAds', 'blockAds', 'autoClickSkipAds', 'allowVideoKeepAdSettings', 'hidePopupCompletely', 'expandToolbar'];
        
        const preferenceUpdates = {};
        let hasPreferenceUpdate = false;

        for (const key of ALL_SETTINGS_KEYS) {
          if (Object.prototype.hasOwnProperty.call(changes, key)) {
            preferenceUpdates[key] = Boolean(changes[key].newValue);
            hasPreferenceUpdate = true;
          }
        }

        if (hasPreferenceUpdate) {
          this.updateAllSettings(preferenceUpdates);
        }

        const settingsUpdates = {};
        let hasSettingsUpdate = false;

        for (const key of ['hideLyrics', 'allowVideo']) {
          if (Object.prototype.hasOwnProperty.call(changes, key)) {
            settingsUpdates[key] = Boolean(changes[key].newValue);
            hasSettingsUpdate = true;
          }
        }

        if (hasSettingsUpdate) {
          this.updateSettings(settingsUpdates);
        }
      }
    });
  }

  /**
   * Initialize feature modules (themes, hotkeys, PiP, playlists)
   */
  initializeFeatureModules() {
    // Initialize theme manager
    if (this.themeManager) {
      this.themeManager.init().catch(err => {
        console.warn('Theme manager initialization failed:', err);
      });
    }

    // Initialize playlist manager
    if (this.playlistManager) {
      this.playlistManager.init().catch(err => {
        console.warn('Playlist manager initialization failed:', err);
      });
    }

    // Initialize hotkey manager with custom handlers
    if (this.hotkeyManager) {
      this.hotkeyManager.init({
        videoElement: this.videoElement,
        handlers: {
          toggleTheme: () => this.handleToggleTheme(),
          togglePip: () => this.handleTogglePip(),
          addBookmark: () => this.handleAddBookmark(),
          openDownload: () => this.handleOpenDownload()
        }
      });
    }

    // Set up event listeners for hotkey actions
    window.addEventListener('anomtube-hotkey-toggleTheme', () => this.handleToggleTheme());
    window.addEventListener('anomtube-hotkey-togglePip', () => this.handleTogglePip());
    window.addEventListener('anomtube-hotkey-addBookmark', () => this.handleAddBookmark());
    window.addEventListener('anomtube-hotkey-openDownload', () => this.handleOpenDownload());

    console.log('Feature modules initialized');
  }

  /**
   * Handle theme toggle hotkey
   */
  async handleToggleTheme() {
    if (!this.themeManager) {
      return;
    }

    try {
      const newTheme = await this.themeManager.toggle();
      console.log(`Theme toggled to: ${newTheme}`);
      
      // Show temporary notification
      this.showNotification(`Theme: ${newTheme === 'dark' ? 'Dark' : 'Light'}`, 2000);
    } catch (error) {
      console.error('Failed to toggle theme:', error);
    }
  }

  /**
   * Handle PiP toggle hotkey
   */
  async handleTogglePip() {
    if (!this.pipManager || !this.videoElement) {
      return;
    }

    try {
      // Initialize PiP manager with current video element
      if (!this.pipManager.videoElement) {
        this.pipManager.init(this.videoElement);
      }

      const pipActive = await this.pipManager.toggle();
      console.log(`PiP ${pipActive ? 'entered' : 'exited'}`);
      
      this.showNotification(`PiP ${pipActive ? 'On' : 'Off'}`, 2000);
    } catch (error) {
      console.error('Failed to toggle PiP:', error);
      this.showNotification('PiP not available', 2000);
    }
  }

  /**
   * Handle add bookmark hotkey
   */
  async handleAddBookmark() {
    if (!this.playlistManager || !this.videoElement) {
      return;
    }

    try {
      const metadata = this.extractVideoMetadata();
      const videoId = this.extractVideoId();
      const timestamp = this.videoElement.currentTime;

      const bookmark = await this.playlistManager.addBookmark({
        videoId: videoId || window.location.href,
        title: metadata.title,
        artist: metadata.artist,
        timestamp: timestamp,
        note: `Bookmark at ${this.playlistManager.formatTimestamp(timestamp)}`
      });

      console.log('Bookmark added:', bookmark);
      this.showNotification(`Bookmarked at ${this.playlistManager.formatTimestamp(timestamp)}`, 3000);
    } catch (error) {
      console.error('Failed to add bookmark:', error);
      this.showNotification('Failed to add bookmark', 2000);
    }
  }

  /**
   * Handle open download UI hotkey
   */
  handleOpenDownload() {
    // This would open a download UI modal or panel
    console.log('Download UI requested');
    this.showNotification('Download feature: Press D or use extension popup', 3000);
  }

  /**
   * Show temporary notification
   * @param {string} message - Notification message
   * @param {number} duration - Duration in milliseconds
   */
  showNotification(message, duration = 2000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'anomtube-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Fade in
    requestAnimationFrame(() => {
      notification.style.opacity = '1';
    });

    // Fade out and remove
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
  }

  applyToolbarExpansion() {
    if (this.settings.expandToolbar) {
      document.body.setAttribute('data-anomtube-expand-toolbar', 'true');
    } else {
      document.body.setAttribute('data-anomtube-expand-toolbar', 'false');
    }
  }

  updateAllSettings(updates = {}) {
    // Setting key constants to maintain DRY principle
    const AD_SETTINGS_KEYS = ['muteAds', 'skipAds', 'blockAds'];
    const UI_SETTINGS_KEYS = ['autoClickSkipAds', 'allowVideoKeepAdSettings', 'hidePopupCompletely', 'expandToolbar'];
    
    let changed = false;

    // Update ad preferences
    for (const key of AD_SETTINGS_KEYS) {
      if (updates[key] !== undefined) {
        const normalized = Boolean(updates[key]);
        if (this.adPreferences[key] !== normalized) {
          this.adPreferences[key] = normalized;
          changed = true;
        }
      }
    }

    // Update new settings
    for (const key of UI_SETTINGS_KEYS) {
      if (updates[key] !== undefined) {
        const normalized = Boolean(updates[key]);
        if (this.settings[key] !== normalized) {
          this.settings[key] = normalized;
          changed = true;
        }
      }
    }

    // Apply changes
    if (updates.expandToolbar !== undefined) {
      this.applyToolbarExpansion();
    }

    if (updates.hidePopupCompletely !== undefined) {
      this.lyricHandler.updateSettings({
        hidePopupCompletely: this.settings.hidePopupCompletely
      });
    }

    // Update adSkipper options regardless of active state
    if (updates.autoClickSkipAds !== undefined) {
      this.adSkipper.updateOptions({
        autoClickSkipAds: this.settings.autoClickSkipAds
      });
    }

    if (changed) {
      if (this.adPreferences.blockAds) {
        this.clearPlayerAds();
      }
      this.updateAdControlLoop();
    }
  }

  activate() {
    console.log('AnomTube activated');
    this.attachNavigationListeners();
    this.ensureVideoMonitoring();
    
    if (!this.hideLyrics) {
      this.ensureLyricsUi();
      this.scheduleLyricsRefresh(true);
      this.startLyricsSync();
    }
    
    if (this.adPreferences.blockAds) {
      this.clearPlayerAds();
    }
    
    this.updateAdControlLoop();

    // Update video element for hotkey and PiP managers
    if (this.videoElement) {
      if (this.hotkeyManager) {
        this.hotkeyManager.setVideoElement(this.videoElement);
      }
      if (this.pipManager) {
        this.pipManager.setVideoElement(this.videoElement);
      }
    }
  }

  deactivate() {
    console.log('AnomTube deactivated');
    this.detachNavigationListeners();
    this.disconnectVideoMonitoring();
    this.unblockVideo();
    this.videoElement = null;
    this.originalVideoDisplay = '';
    this.lyricsRequestToken += 1;
    this.currentLyrics = [];
    this.lyricLineElements = [];
    this.activeVideoId = null;
    this.resetManualRetryState();
    this.stopCaptionMirroring();
    this.closeLyricsWindow();
    this.stopLyricsSync();
    this.stopAdMonitoring();
    this.stopAdSkipperObserver();
  }

  updateAdPreferences(preferences = {}) {
    let changed = false;

    for (const [key, value] of Object.entries(preferences)) {
      if (!Object.prototype.hasOwnProperty.call(this.adPreferences, key)) {
        continue;
      }

      const normalized = Boolean(value);
      if (this.adPreferences[key] !== normalized) {
        this.adPreferences[key] = normalized;
        changed = true;
      }
    }

    if (changed) {
      if (this.adPreferences.blockAds) {
        this.clearPlayerAds();
      }
      this.updateAdControlLoop();
    } else if (!this.isEnabled) {
      this.stopAdMonitoring();
    }
  }

  updateSettings(settings = {}) {
    let changed = false;

    if (Object.prototype.hasOwnProperty.call(settings, 'hideLyrics')) {
      const newValue = Boolean(settings.hideLyrics);
      if (this.hideLyrics !== newValue) {
        this.hideLyrics = newValue;
        changed = true;

        if (this.hideLyrics) {
          this.closeLyricsWindow();
        } else if (this.isEnabled) {
          this.ensureLyricsUi();
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(settings, 'allowVideo')) {
      const newValue = Boolean(settings.allowVideo);
      if (this.allowVideo !== newValue) {
        this.allowVideo = newValue;
        changed = true;

        if (this.isEnabled) {
          if (this.allowVideo) {
            this.unblockVideo();
          } else {
            this.updateVideoElement();
          }
        }
      }
    }
  }

  updateAdControlLoop() {
    if (!this.isEnabled) {
      this.stopAdMonitoring();
      return;
    }

    const needsAdMonitoring = this.adPreferences.muteAds || 
                               this.adPreferences.skipAds || 
                               this.adPreferences.blockAds;

    if (needsAdMonitoring) {
      this.startAdMonitoring();
      this.processAdControls();
      
      if (this.adPreferences.skipAds) {
        this.startAdSkipperObserver();
      } else {
        this.stopAdSkipperObserver();
      }
    } else {
      this.stopAdMonitoring();
      this.stopAdSkipperObserver();
    }
  }

  startAdMonitoring() {
    if (this.adMonitorInterval) {
      return;
    }

    // Start the adSkipper module if autoClickSkipAds is enabled
    if (this.settings.autoClickSkipAds) {
      this.adSkipper.start({
        autoClickSkipAds: true
      });
    }

    this.adMonitorInterval = setInterval(() => {
      try {
        this.processAdControls();
      } catch (error) {
        console.warn('Ad control loop error:', error);
      }
    }, 300);
  }

  stopAdMonitoring() {
    if (this.adMonitorInterval) {
      clearInterval(this.adMonitorInterval);
      this.adMonitorInterval = null;
    }

    // Stop adSkipper module
    if (this.adSkipper) {
      this.adSkipper.stop();
    }

    if (this.wasMutedByAdControl) {
      this.restoreAdMutedVolume();
    }

    this.stopAdSkipperObserver();
  }

  processAdControls() {
    if (!this.isEnabled) {
      return;
    }

    if (!this.videoElement) {
      const candidate = document.querySelector('video');
      if (candidate) {
        this.videoElement = candidate;
      }
    }

    const player = document.querySelector('.html5-video-player');
    const isAdActive = Boolean(
      player &&
        (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting'))
    );

    if (this.adPreferences.blockAds) {
      this.clearPlayerAds();
      if (isAdActive) {
        this.fastForwardAd();
      }
    }

    if (this.adPreferences.skipAds) {
      this.trySkipAd();
    }

    if (this.adPreferences.muteAds) {
      this.enforceAdMute(isAdActive);
    } else if (this.wasMutedByAdControl) {
      this.restoreAdMutedVolume();
    }
  }

  enforceAdMute(isAdActive) {
    if (!this.videoElement) {
      return;
    }

    if (isAdActive) {
      if (!this.wasMutedByAdControl) {
        this.adMuteSnapshot = {
          muted: this.videoElement.muted,
          volume: this.videoElement.volume
        };
        this.wasMutedByAdControl = true;
      }

      if (!this.videoElement.muted) {
        this.videoElement.muted = true;
      }
    } else if (this.wasMutedByAdControl) {
      this.restoreAdMutedVolume();
    }
  }

  restoreAdMutedVolume() {
    if (!this.videoElement) {
      this.wasMutedByAdControl = false;
      this.adMuteSnapshot = null;
      return;
    }

    if (this.adMuteSnapshot) {
      this.videoElement.muted = Boolean(this.adMuteSnapshot.muted);
      if (typeof this.adMuteSnapshot.volume === 'number') {
        this.videoElement.volume = this.adMuteSnapshot.volume;
      }
    } else {
      this.videoElement.muted = false;
    }

    this.wasMutedByAdControl = false;
    this.adMuteSnapshot = null;
  }

  trySkipAd() {
    // Rate limit: no more than once every 250ms
    const now = Date.now();
    if (now - this.lastAdSkipAttempt < 250) {
      return;
    }
    this.lastAdSkipAttempt = now;

    const skipSelectors = [
      '.ytp-ad-skip-button.ytp-button',
      '.ytp-ad-skip-button-modern.ytp-button',
      '.ytp-ad-skip-button-modern',
      '.ytp-ad-skip-button',
      'button.ytp-ad-skip-button-modern',
      '.ytp-skip-ad-button'
    ];

    for (const selector of skipSelectors) {
      const skipButtons = document.querySelectorAll(selector);
      skipButtons.forEach((skipButton) => {
        if (this.tryClickAdButton(skipButton)) {
          return;
        }
      });
    }

    const overlayCloseButtons = document.querySelectorAll(
      '.ytp-ad-overlay-close-button, .ytp-ad-overlay-close-button-modern'
    );
    overlayCloseButtons.forEach((button) => {
      this.tryClickAdButton(button);
    });

    const overlayAds = document.querySelectorAll('.ytp-ad-image-overlay, .ytp-ad-overlay-slot');
    overlayAds.forEach((ad) => {
      try {
        ad.remove();
      } catch (error) {
        // Ignore removal errors
      }
    });
  }

  tryClickAdButton(button) {
    if (!button || !button.offsetParent) {
      return false;
    }

    const buttonKey = this.getButtonIdentifier(button);
    const attempts = this.adSkipAttempts.get(buttonKey) || { count: 0, lastAttempt: 0 };
    const now = Date.now();

    // Rate limit per button: max 3 attempts per minute
    if (attempts.count >= 3 && now - attempts.lastAttempt < 60000) {
      return false;
    }

    if (now - attempts.lastAttempt > 60000) {
      attempts.count = 0;
    }

    try {
      // Try multiple click methods
      if (typeof button.click === 'function') {
        button.click();
        attempts.count++;
        attempts.lastAttempt = now;
        this.adSkipAttempts.set(buttonKey, attempts);
        return true;
      }

      // Fallback: dispatch pointer events
      const events = ['pointerdown', 'mousedown', 'click', 'mouseup', 'pointerup'];
      events.forEach((eventType) => {
        const event = new PointerEvent(eventType, {
          view: window,
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'mouse'
        });
        button.dispatchEvent(event);
      });

      attempts.count++;
      attempts.lastAttempt = now;
      this.adSkipAttempts.set(buttonKey, attempts);
      return true;
    } catch (error) {
      console.warn('Failed to click ad button:', error);
      return false;
    }
  }

  getButtonIdentifier(button) {
    try {
      const rect = button.getBoundingClientRect();
      return `${button.className}_${Math.round(rect.top)}_${Math.round(rect.left)}`;
    } catch (error) {
      return `${button.className}_${Date.now()}`;
    }
  }

  startAdSkipperObserver() {
    if (this.adSkipperObserver) {
      return;
    }

    const checkForSkipButtons = () => {
      if (!this.isEnabled || !this.adPreferences.skipAds) {
        return;
      }

      this.trySkipAd();
    };

    this.adSkipperObserver = new MutationObserver((mutations) => {
      let shouldCheck = false;

      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node;
              // Check if the added node or its children contain skip buttons
              if (element.classList && (
                element.classList.contains('ytp-ad-skip-button') ||
                element.classList.contains('ytp-ad-skip-button-modern') ||
                element.querySelector && element.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern')
              )) {
                shouldCheck = true;
                break;
              }
            }
          }
        }

        if (mutation.type === 'attributes' && mutation.target) {
          const target = mutation.target;
          // Check if visibility or display changed on relevant elements
          if (target.classList && (
            target.classList.contains('ytp-ad-skip-button') ||
            target.classList.contains('ytp-ad-skip-button-modern') ||
            target.classList.contains('html5-video-player')
          )) {
            shouldCheck = true;
          }
        }

        if (shouldCheck) {
          break;
        }
      }

      if (shouldCheck) {
        // Small delay to ensure DOM is stable
        setTimeout(checkForSkipButtons, 100);
      }
    });

    // Observe the entire player container
    const playerContainer = document.querySelector('.html5-video-player') || document.body;
    if (playerContainer) {
      this.adSkipperObserver.observe(playerContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'hidden']
      });
    }

    // Initial check
    checkForSkipButtons();
  }

  stopAdSkipperObserver() {
    if (this.adSkipperObserver) {
      this.adSkipperObserver.disconnect();
      this.adSkipperObserver = null;
    }

    // Clean up old attempt records
    this.adSkipAttempts.clear();
  }

  fastForwardAd() {
    if (!this.videoElement) {
      return;
    }

    const duration = Number(this.videoElement.duration);
    if (Number.isFinite(duration) && duration > 0) {
      this.videoElement.currentTime = duration;
    }
  }

  clearPlayerAds() {
    try {
      if (window.ytInitialPlayerResponse) {
        window.ytInitialPlayerResponse.adPlacements = [];
        window.ytInitialPlayerResponse.playerAds = [];
      }

      if (window.ytplayer && window.ytplayer.config && window.ytplayer.config.args) {
        const args = window.ytplayer.config.args;
        if (args.ad3_module) {
          args.ad3_module = null;
        }

        if (args.raw_player_response) {
          let response = args.raw_player_response;
          if (typeof response === 'string') {
            try {
              response = JSON.parse(response);
            } catch (error) {
              response = null;
            }
          }

          if (response) {
            response.adPlacements = [];
            response.playerAds = [];
            args.raw_player_response = JSON.stringify(response);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clear player ads payload:', error);
    }

    const adContainers = document.querySelectorAll(
      '#player-ads, .ytp-ad-player-overlay, .ytp-ad-module, .video-ads, ytd-promoted-sparkles-web-renderer'
    );
    adContainers.forEach((element) => {
      if (element && element.remove) {
        element.remove();
      }
    });
  }

  resetManualRetryState() {
    this.manualRetryInProgress = false;
    this.manualRetryCount = 0;
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
      } else if (hasVideo && this.videoElement && !this.settings.allowVideoKeepAdSettings) {
        // Only hide video if allowVideoKeepAdSettings is false
        if (this.videoElement.style.display !== 'none') {
          this.videoElement.style.display = 'none';
        }
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

    // Only apply placeholder if allowVideo is false
    if (!this.allowVideo) {
      this.applyPlaceholder(video);
    } else {
      // If allowVideo is true, ensure video is visible
      if (video.style.display === 'none') {
        video.style.display = this.originalVideoDisplay || '';
      }
    }
    
    if (isNewVideo && this.adPreferences.blockAds) {
      this.clearPlayerAds();
    }

    // Update video element for hotkey and PiP managers when video changes
    if (isNewVideo) {
      if (this.hotkeyManager) {
        this.hotkeyManager.setVideoElement(video);
      }
      if (this.pipManager) {
        this.pipManager.setVideoElement(video);
      }
    }

    return { changed: isNewVideo, hasVideo: true };
  }

  applyPlaceholder(video) {
    if (!video) {
      return;
    }

    // Only hide video if allowVideoKeepAdSettings is false
    if (!this.settings.allowVideoKeepAdSettings) {
      video.style.display = 'none';
    }

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
      placeholder.id = 'anomtube-placeholder';
      const floatingLogos = Array.from({ length: 6 }, (_, index) =>
        `<span class="anomtube-backdrop__logo anomtube-backdrop__logo--${index + 1}"></span>`
      ).join('');

      placeholder.innerHTML = `
        <div class="anomtube-overlay">
          <div class="anomtube-backdrop" aria-hidden="true">
            <div class="anomtube-backdrop__grid">${floatingLogos}</div>
            <div class="anomtube-backdrop__veil"></div>
            <div class="anomtube-backdrop__glow"></div>
          </div>
          <article class="anomtube-audio-only" aria-label="AnomFIN Audio Only Soundstage">
            <header class="anomtube-header">
              <span class="anomtube-chip">Audio Soundstage · Signature Edition</span>
              <div class="anomtube-brand-badge">
                <img src="${logoUrl}" alt="AnomFIN Tools logo" class="anomtube-logo-img" />
                <div class="anomtube-brand-text">
                  <span class="anomtube-brand-primary">AnomFIN Tools</span>
                  <span class="anomtube-brand-secondary">Audio Only · Tube</span>
                </div>
              </div>
            </header>
            <section class="anomtube-body">
              <h2 class="anomtube-title">Audio Only Mode</h2>
              <p class="anomtube-subtitle">AnomTools soundstage engaged — lean back and enjoy the vibes.</p>
              <div class="anomtube-divider" role="presentation"></div>
              <ul class="anomtube-feature-grid" aria-label="AnomFIN highlight features">
                <li class="anomtube-feature">
                  <span class="anomtube-feature__icon" aria-hidden="true">🎧</span>
                  <span class="anomtube-feature__title">Focus on fidelity</span>
                  <span class="anomtube-feature__description">Spatial mastering with glass-flat noise floor for immersive night rides.</span>
                </li>
                <li class="anomtube-feature">
                  <span class="anomtube-feature__icon" aria-hidden="true">🛰️</span>
                  <span class="anomtube-feature__title">Live console overlay</span>
                  <span class="anomtube-feature__description">Lyrics beam into the AnomFIN karaoke console with zero added latency.</span>
                </li>
                <li class="anomtube-feature">
                  <span class="anomtube-feature__icon" aria-hidden="true">🔒</span>
                  <span class="anomtube-feature__title">Ad shield engaged</span>
                  <span class="anomtube-feature__description">Precision filtering keeps prerolls silent while audio takes center stage.</span>
                </li>
              </ul>
            </section>
            <footer class="anomtube-footer">
              <p class="anomtube-note">Lyrics stream live inside the AnomFIN karaoke console overlay.</p>
              <p class="anomtube-credit">Made by: <strong>Jugi @ AnomFIN · AnomTools</strong></p>
            </footer>
          </article>
        </div>
      `;
      videoContainer.appendChild(placeholder);
      this.placeholderElement = placeholder;
    }

    this.updatePlaceholderAssets();
    this.ensurePlaceholderSizing(video, videoContainer);
  }

  getAssetUrls() {
    const logoUrl = this.customAssets.logo || this.defaultLogoUrl;
    const backgroundUrl = this.customAssets.background || this.defaultBackgroundUrl;
    return { logoUrl, backgroundUrl };
  }

  updatePlaceholderAssets() {
    if (!this.placeholderElement) {
      return;
    }

    const { logoUrl, backgroundUrl } = this.getAssetUrls();
    this.placeholderElement.style.setProperty('--anomtube-logo', `url("${logoUrl}")`);
    this.placeholderElement.style.setProperty('--anomtube-background', `url("${backgroundUrl}")`);

    const logoImg = this.placeholderElement.querySelector('.anomtube-logo-img');
    if (logoImg) {
      logoImg.src = logoUrl;
    }
  }

  ensurePlaceholderSizing(video, container) {
    if (!this.placeholderElement || !container) {
      return;
    }

    if (!container.dataset.anomfinOriginalMinHeight) {
      container.dataset.anomfinOriginalMinHeight = container.style.minHeight || '';
    }

    if (!container.dataset.anomfinOriginalHeight) {
      container.dataset.anomfinOriginalHeight = container.style.height || '';
    }

    if (!container.dataset.anomfinOriginalMinWidth) {
      container.dataset.anomfinOriginalMinWidth = container.style.minWidth || '';
    }

    if (!this.placeholderResizeObserver) {
      this.placeholderResizeObserver = new ResizeObserver(() => {
        this.syncPlaceholderDimensions();
      });
    }

    const targets = [container, video].filter((element) => element && element instanceof Element);
    targets.forEach((element) => {
      if (!this.placeholderResizeTargets.has(element)) {
        this.placeholderResizeTargets.add(element);
        try {
          this.placeholderResizeObserver.observe(element);
        } catch (error) {
          console.warn('Could not observe placeholder resize target:', error);
        }
      }
    });

    this.syncPlaceholderDimensions();
  }

  syncPlaceholderDimensions() {
    if (!this.placeholderElement) {
      return;
    }

    const container = this.placeholderElement.parentElement;
    if (!container) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const videoRect = this.videoElement ? this.videoElement.getBoundingClientRect() : null;

    const width = containerRect.width || (videoRect ? videoRect.width : 0) || (this.videoElement ? this.videoElement.videoWidth : 0);
    const height = containerRect.height || (videoRect ? videoRect.height : 0) || (this.videoElement ? this.videoElement.videoHeight : 0);

    if (width) {
      container.style.minWidth = `${width}px`;
      this.placeholderElement.style.width = '100%';
    }

    if (height) {
      container.style.minHeight = `${height}px`;
      this.placeholderElement.style.minHeight = `${height}px`;
      this.placeholderElement.style.height = `${height}px`;
    }

    if (this.videoElement && this.videoElement.videoWidth && this.videoElement.videoHeight) {
      this.placeholderElement.style.aspectRatio = `${this.videoElement.videoWidth} / ${this.videoElement.videoHeight}`;
    } else if (width && height) {
      this.placeholderElement.style.aspectRatio = `${width} / ${height}`;
    }
  }

  releasePlaceholderSizing(container) {
    if (!container) {
      return;
    }

    if (container.dataset.anomfinOriginalMinHeight !== undefined) {
      container.style.minHeight = container.dataset.anomfinOriginalMinHeight;
      delete container.dataset.anomfinOriginalMinHeight;
    }

    if (container.dataset.anomfinOriginalHeight !== undefined) {
      container.style.height = container.dataset.anomfinOriginalHeight;
      delete container.dataset.anomfinOriginalHeight;
    }

    if (container.dataset.anomfinOriginalMinWidth !== undefined) {
      container.style.minWidth = container.dataset.anomfinOriginalMinWidth;
      delete container.dataset.anomfinOriginalMinWidth;
    }
  }

  disconnectPlaceholderObserver() {
    if (this.placeholderResizeObserver) {
      this.placeholderResizeTargets.forEach((target) => {
        try {
          this.placeholderResizeObserver.unobserve(target);
        } catch (error) {
          // Ignore unobserve failures
        }
      });
      this.placeholderResizeTargets.clear();
      this.placeholderResizeObserver.disconnect();
      this.placeholderResizeObserver = null;
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
        this.releasePlaceholderSizing(container);
        container.removeAttribute('data-anomfin-audio-only');
      }
    }

    if (this.placeholderElement) {
      this.placeholderElement.remove();
      this.placeholderElement = null;
    }

    this.disconnectPlaceholderObserver();
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
    if (this.hideLyrics) {
      return;
    }

    if (this.lyricsElements.root && document.body && document.body.contains(this.lyricsElements.root)) {
      this.applyBrandingToLyricsWindow();
      // Ensure the console is visible (remove hidden class if present)
      this.lyricsElements.root.classList.remove('anomfin-lyrics--hidden');
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
          <div class="anomfin-lyrics__controls">
            <button type="button" class="anomfin-lyrics__btn anomfin-lyrics__btn--retry" data-role="retry" hidden aria-label="Hae uudelleen">Hae uudelleen</button>
            <button type="button" class="anomfin-lyrics__btn" data-role="toggle" aria-expanded="true">Piilota</button>
          </div>
        </div>
        <div class="anomfin-lyrics__meta">
          <div class="anomfin-lyrics__song" data-role="title">🎵 AnomTube Lyrics</div>
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
        this.lyricsElements.toggle.textContent = collapsed ? 'Avaa' : 'Piilota';
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
    this.toggleRetryAvailability(false);
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
    return placeholder;
  }

  updateLyricsStatus(message, variant = 'info') {
    if (!this.lyricsElements.status) {
      return;
    }

    const allowed = new Set(['loading', 'ready', 'error', 'empty', 'info']);
    const appliedVariant = allowed.has(variant) ? variant : 'info';
    this.lyricsElements.status.setAttribute('data-variant', appliedVariant);
    this.toggleRetryAvailability(appliedVariant === 'error');

    const textEl = this.lyricsElements.statusText || this.lyricsElements.status.querySelector('[data-role="status-text"]');
    if (textEl) {
      textEl.textContent = message;
    }
  }

  toggleRetryAvailability(visible) {
    const retryButton = this.lyricsElements.retry;
    if (!retryButton) {
      return;
    }

    const shouldShow = Boolean(visible);
    retryButton.hidden = !shouldShow;
    retryButton.tabIndex = shouldShow ? 0 : -1;
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
    this.syncPlaceholderDimensions();

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
    const { manualRetry = false, retryLevel = 0 } = options;

    if (!this.isEnabled) {
      return;
    }

    this.ensureLyricsUi();
    this.stopCaptionMirroring();

    if (!manualRetry) {
      this.resetManualRetryState();
    }

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
    const effectiveRetryLevel = manualRetry ? Math.max(retryLevel, this.manualRetryCount) : 0;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getLyrics',
        title: metadata.title,
        artist: metadata.artist,
        manualRetry,
        retryLevel: effectiveRetryLevel
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
    button.textContent = 'Haetaan…';

    try {
      this.manualRetryCount += 1;
      await this.loadLyrics({ manualRetry: true, retryLevel: this.manualRetryCount });
    } catch (error) {
      console.error('Manual lyrics retry failed:', error);
      this.updateLyricsStatus('Lyriikoiden haku epäonnistui — yritä hetken päästä uudelleen.', 'error');
      this.showNoLyrics('Lyriikoita ei löytynyt – kokeile hakea hetken kuluttua uudelleen.');
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
      this.showNoLyrics();
      return;
    }

    const container = this.lyricsElements.lines;
    container.innerHTML = '';

    this.stopCaptionMirroring();

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
    if (!this.lyricsElements.lines) {
      this.updateLyricsStatus(hasMessage ? 'Lyriikoiden haku epäonnistui' : 'Lyriikoita ei löytynyt', variant);
      return;
    }

    const container = this.lyricsElements.lines;
    container.innerHTML = '';

    const placeholder = document.createElement('div');
    placeholder.className = `anomfin-lyrics__placeholder ${variant === 'error' ? 'anomfin-lyrics__placeholder--error' : 'anomfin-lyrics__placeholder--empty'}`;
    placeholder.textContent = displayMessage;
    container.appendChild(placeholder);

    const shouldMirrorCaptions = variant === 'error' || variant === 'empty';
    if (shouldMirrorCaptions) {
      const captionFallback = this.createCaptionFallback();
      if (captionFallback) {
        container.appendChild(captionFallback.wrapper);
        this.startCaptionMirroring(captionFallback.feed);
      } else {
        this.stopCaptionMirroring();
      }
    } else {
      this.stopCaptionMirroring();
    }

    this.updateLyricsStatus(hasMessage ? 'Lyriikoiden haku epäonnistui' : 'Lyriikoita ei löytynyt', variant);
    this.lyricLineElements = [];
  }

  createCaptionFallback() {
    const wrapper = document.createElement('section');
    wrapper.className = 'anomfin-lyrics__captions';
    wrapper.setAttribute('aria-label', 'YouTube-tekstitysten varasyöte');

    wrapper.innerHTML = `
      <header class="anomfin-lyrics__captions-header">
        <span class="anomfin-lyrics__captions-title">YouTube-tekstitykset</span>
        <span class="anomfin-lyrics__captions-pill" aria-hidden="true">LIVE</span>
      </header>
      <div class="anomfin-lyrics__captions-feed" role="log" aria-live="polite"></div>
      <p class="anomfin-lyrics__captions-hint">Jos teksti ei näy, varmista että YouTube-tekstitykset ovat päällä.</p>
    `;

    const feed = wrapper.querySelector('.anomfin-lyrics__captions-feed');
    return feed ? { wrapper, feed } : null;
  }

  getCaptionSourceElement() {
    return (
      document.querySelector('.ytp-caption-window-container') ||
      document.querySelector('.caption-window.ytp-caption-window-bottom') ||
      null
    );
  }

  startCaptionMirroring(targetElement) {
    this.stopCaptionMirroring();

    if (!targetElement) {
      return;
    }

    this.captionMirrorElement = targetElement;

    const updateFromSource = () => {
      const source = this.getCaptionSourceElement();
      this.captionSourceElement = source || null;

      if (!source) {
        this.captionMirrorElement.textContent = 'Tekstityksiä ei löytynyt — ota YouTube-tekstitykset käyttöön videon asetuksista.';
        return;
      }

      const segments = Array.from(source.querySelectorAll('.ytp-caption-segment'));
      const text = segments
        .map((segment) => segment.textContent)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (text) {
        this.captionMirrorElement.textContent = text;
      } else {
        this.captionMirrorElement.textContent = 'Tekstityksiä odotetaan…';
      }
    };

    this.captionObserver = new MutationObserver(updateFromSource);
    const initialSource = this.getCaptionSourceElement();
    if (initialSource) {
      this.captionSourceElement = initialSource;
      try {
        this.captionObserver.observe(initialSource, {
          childList: true,
          subtree: true,
          characterData: true
        });
      } catch (error) {
        console.warn('Could not observe YouTube captions container:', error);
      }
    }

    this.captionObserverInterval = window.setInterval(() => {
      const latestSource = this.getCaptionSourceElement();
      if (latestSource !== this.captionSourceElement) {
        this.captionSourceElement = latestSource;
        if (this.captionObserver) {
          try {
            this.captionObserver.disconnect();
          } catch (error) {
            // Ignore disconnect issues
          }
          if (latestSource) {
            try {
              this.captionObserver.observe(latestSource, {
                childList: true,
                subtree: true,
                characterData: true
              });
            } catch (error) {
              console.warn('Could not observe YouTube captions container:', error);
            }
          }
        }
      }
      updateFromSource();
    }, 2000);

    updateFromSource();
  }

  stopCaptionMirroring() {
    if (this.captionObserver) {
      try {
        this.captionObserver.disconnect();
      } catch (error) {
        // Ignore disconnect errors
      }
      this.captionObserver = null;
    }

    if (this.captionObserverInterval) {
      clearInterval(this.captionObserverInterval);
      this.captionObserverInterval = null;
    }

    this.captionSourceElement = null;
    this.captionMirrorElement = null;
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
    this.stopCaptionMirroring();

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
    this.resetManualRetryState();
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

// Initialize AnomTube when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AnomTube();
  });
} else {
  new AnomTube();
}
