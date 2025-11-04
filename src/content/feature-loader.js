// Enhanced Content Script Loader for AnomTube
// This script loads and initializes all feature modules

// Import feature modules (these will be loaded via manifest.json)
// The modules are already defined globally via script tags

// Initialize feature managers when page loads
(function() {
  'use strict';

  // Wait for the main AnomTube class to be available
  if (typeof AnomTube === 'undefined') {
    console.error('AnomTube base class not found');
    return;
  }

  // Store original init method
  const originalInit = AnomTube.prototype.init;

  // Extend AnomTube with new feature managers
  AnomTube.prototype.initFeatureManagers = function() {
    // Initialize Window State Manager
    if (typeof WindowStateManager !== 'undefined') {
      this.windowStateManager = new WindowStateManager();
      this.windowStateManager.init().then(state => {
        if (this.lyricsElements.root) {
          this.windowStateManager.applyToElement(this.lyricsElements.root);
        }
      });
    }

    // Initialize Hotkeys Manager
    if (typeof HotkeysManager !== 'undefined') {
      this.hotkeysManager = new HotkeysManager();
      this.hotkeysManager.init();

      // Register hotkey handlers
      this.hotkeysManager.on('playPause', () => this.hotkeysManager.playPause());
      this.hotkeysManager.on('seekBackward', () => this.hotkeysManager.seekBackward());
      this.hotkeysManager.on('seekForward', () => this.hotkeysManager.seekForward());
      this.hotkeysManager.on('volumeUp', () => this.hotkeysManager.volumeUp());
      this.hotkeysManager.on('volumeDown', () => this.hotkeysManager.volumeDown());
      this.hotkeysManager.on('download', () => this.handleDownloadHotkey());
      this.hotkeysManager.on('toggleTheme', () => this.handleThemeToggle());
      this.hotkeysManager.on('togglePiP', () => this.handlePiPToggle());
    }

    // Initialize Playlists Manager
    if (typeof PlaylistsManager !== 'undefined') {
      this.playlistsManager = new PlaylistsManager();
      this.playlistsManager.init();
    }

    // Initialize PiP Manager
    if (typeof PiPManager !== 'undefined') {
      this.pipManager = new PiPManager();
      this.pipManager.init();
    }

    // Initialize Theme Manager
    if (typeof ThemeManager !== 'undefined') {
      this.themeManager = new ThemeManager();
      this.themeManager.init();
    }

    // Initialize Download Manager
    if (typeof DownloadManager !== 'undefined') {
      this.downloadManager = new DownloadManager();
      this.downloadManager.init();
    }
  };

  // Override init to include feature managers
  AnomTube.prototype.init = async function() {
    // Call original init
    await originalInit.call(this);

    // Initialize feature managers
    this.initFeatureManagers();
  };

  // Add hotkey handlers
  AnomTube.prototype.handleDownloadHotkey = function() {
    if (this.downloadManager) {
      const videoInfo = this.downloadManager.extractVideoInfo();
      if (videoInfo) {
        this.downloadManager.showDownloadDialog(videoInfo);
      }
    }
  };

  AnomTube.prototype.handleThemeToggle = function() {
    if (this.themeManager) {
      this.themeManager.toggle();
    }
  };

  AnomTube.prototype.handlePiPToggle = function() {
    if (this.pipManager) {
      this.pipManager.toggle();
    }
  };

  // Extend ensureLyricsUi to save window state
  const originalEnsureLyricsUi = AnomTube.prototype.ensureLyricsUi;
  AnomTube.prototype.ensureLyricsUi = function() {
    originalEnsureLyricsUi.call(this);

    // Apply saved window state after lyrics UI is created
    if (this.windowStateManager && this.lyricsElements.root) {
      setTimeout(() => {
        this.windowStateManager.applyToElement(this.lyricsElements.root);
      }, 100);
    }
  };

  // Extend onLyricsPointerUp to save window state
  const originalOnLyricsPointerUp = AnomTube.prototype.onLyricsPointerUp;
  AnomTube.prototype.onLyricsPointerUp = function(event) {
    originalOnLyricsPointerUp.call(this, event);

    // Save window state after dragging
    if (this.windowStateManager && this.lyricsElements.root) {
      this.windowStateManager.saveFromElement(this.lyricsElements.root);
    }
  };

  // Add bookmark hotkey (B key)
  if (typeof HotkeysManager !== 'undefined') {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'b' || event.key === 'B') {
        const target = event.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }

        const anomTube = window.anomTubeInstance;
        if (anomTube && anomTube.playlistsManager) {
          event.preventDefault();
          event.stopPropagation();

          const video = document.querySelector('video');
          if (video && anomTube.downloadManager) {
            const videoInfo = anomTube.downloadManager.extractVideoInfo();
            if (videoInfo) {
              const timestamp = Math.floor(video.currentTime);
              anomTube.playlistsManager.createBookmark({
                videoId: videoInfo.id,
                title: videoInfo.title,
                url: videoInfo.url,
                timestamp: timestamp,
                note: ''
              }).then(() => {
                console.log('Bookmark created at', timestamp, 'seconds');
              });
            }
          }
        }
      }
    });
  }

  console.log('AnomTube feature managers loaded');
})();
