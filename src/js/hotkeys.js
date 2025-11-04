// Keyboard Shortcuts (Hotkeys) for AnomTube Extension
// Global keybindings for common actions

class HotkeyManager {
  constructor() {
    this.enabled = true;
    this.videoElement = null;
    
    // Fullscreen selector constants
    this.PLAYER_CONTAINER_SELECTORS = [
      '.html5-video-player',
      'video'
    ];
    
    this.keyMap = {
      ' ': 'playPause',           // Space: play/pause
      'k': 'playPause',           // K: play/pause (YouTube standard)
      'ArrowLeft': 'seekBackward', // Left arrow: seek -5s
      'j': 'seekBackward',        // J: seek backward (YouTube standard)
      'ArrowRight': 'seekForward', // Right arrow: seek +5s
      'l': 'seekForward',         // L: seek forward (YouTube standard)
      'ArrowUp': 'volumeUp',      // Up arrow: volume +5%
      'ArrowDown': 'volumeDown',  // Down arrow: volume -5%
      'm': 'toggleMute',          // M: toggle mute
      'f': 'toggleFullscreen',    // F: toggle fullscreen
      't': 'toggleTheme',         // T: toggle theme
      'p': 'togglePip',           // P: toggle PiP
      'd': 'openDownload',        // D: open download UI
      'b': 'addBookmark',         // B: add bookmark at current time
      '0': 'seek0',               // 0: seek to start
      '1': 'seek10',              // 1: seek to 10%
      '2': 'seek20',              // 2: seek to 20%
      '3': 'seek30',              // 3: seek to 30%
      '4': 'seek40',              // 4: seek to 40%
      '5': 'seek50',              // 5: seek to 50%
      '6': 'seek60',              // 6: seek to 60%
      '7': 'seek70',              // 7: seek to 70%
      '8': 'seek80',              // 8: seek to 80%
      '9': 'seek90',              // 9: seek to 90%
    };
    this.handlers = {};
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Initialize hotkey system
   * @param {Object} options - Configuration options
   */
  init(options = {}) {
    const { videoElement, handlers } = options;
    
    if (videoElement) {
      this.videoElement = videoElement;
    }

    if (handlers) {
      this.handlers = { ...this.handlers, ...handlers };
    }

    // Attach keyboard event listener
    document.addEventListener('keydown', this.boundHandleKeyDown);
  }

  /**
   * Cleanup and remove event listeners
   */
  destroy() {
    document.removeEventListener('keydown', this.boundHandleKeyDown);
  }

  /**
   * Update video element reference
   * @param {HTMLVideoElement} videoElement
   */
  setVideoElement(videoElement) {
    this.videoElement = videoElement;
  }

  /**
   * Register custom handler for specific action
   * @param {string} action - Action name
   * @param {Function} handler - Handler function
   */
  registerHandler(action, handler) {
    this.handlers[action] = handler;
  }

  /**
   * Handle keydown event
   * @param {KeyboardEvent} event
   */
  handleKeyDown(event) {
    // Ignore if hotkeys are disabled
    if (!this.enabled) {
      return;
    }

    // Ignore if user is typing in an input field
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable
    )) {
      return;
    }

    const key = event.key;
    const action = this.keyMap[key];

    if (!action) {
      return;
    }

    // Prevent default browser behavior for handled keys
    event.preventDefault();
    event.stopPropagation();

    // Execute action
    this.executeAction(action);
  }

  /**
   * Execute specific action
   * @param {string} action - Action name
   */
  executeAction(action) {
    // Check for custom handler first
    if (this.handlers[action]) {
      this.handlers[action]();
      return;
    }

    // Built-in actions
    switch (action) {
      case 'playPause':
        this.playPause();
        break;
      case 'seekBackward':
        this.seek(-5);
        break;
      case 'seekForward':
        this.seek(5);
        break;
      case 'volumeUp':
        this.adjustVolume(0.05);
        break;
      case 'volumeDown':
        this.adjustVolume(-0.05);
        break;
      case 'toggleMute':
        this.toggleMute();
        break;
      case 'toggleFullscreen':
        this.toggleFullscreen();
        break;
      case 'toggleTheme':
        this.triggerEvent('toggleTheme');
        break;
      case 'togglePip':
        this.triggerEvent('togglePip');
        break;
      case 'openDownload':
        this.triggerEvent('openDownload');
        break;
      case 'addBookmark':
        this.triggerEvent('addBookmark');
        break;
      case 'seek0':
        this.seekToPercent(0);
        break;
      case 'seek10':
        this.seekToPercent(10);
        break;
      case 'seek20':
        this.seekToPercent(20);
        break;
      case 'seek30':
        this.seekToPercent(30);
        break;
      case 'seek40':
        this.seekToPercent(40);
        break;
      case 'seek50':
        this.seekToPercent(50);
        break;
      case 'seek60':
        this.seekToPercent(60);
        break;
      case 'seek70':
        this.seekToPercent(70);
        break;
      case 'seek80':
        this.seekToPercent(80);
        break;
      case 'seek90':
        this.seekToPercent(90);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  /**
   * Play/pause video
   */
  playPause() {
    if (!this.videoElement) {
      return;
    }

    if (this.videoElement.paused) {
      this.videoElement.play().catch(err => {
        console.warn('Play failed:', err);
      });
    } else {
      this.videoElement.pause();
    }
  }

  /**
   * Seek video by offset
   * @param {number} seconds - Seconds to seek (positive or negative)
   */
  seek(seconds) {
    if (!this.videoElement) {
      return;
    }

    this.videoElement.currentTime = Math.max(
      0,
      Math.min(
        this.videoElement.duration || 0,
        this.videoElement.currentTime + seconds
      )
    );
  }

  /**
   * Seek to specific percentage of video
   * @param {number} percent - Percentage (0-100)
   */
  seekToPercent(percent) {
    if (!this.videoElement || !this.videoElement.duration) {
      return;
    }

    const targetTime = (percent / 100) * this.videoElement.duration;
    this.videoElement.currentTime = targetTime;
  }

  /**
   * Adjust volume by delta
   * @param {number} delta - Volume change (-1.0 to 1.0)
   */
  adjustVolume(delta) {
    if (!this.videoElement) {
      return;
    }

    this.videoElement.volume = Math.max(
      0,
      Math.min(1, this.videoElement.volume + delta)
    );

    // Unmute if volume is increased from 0
    if (delta > 0 && this.videoElement.volume > 0) {
      this.videoElement.muted = false;
    }
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    if (!this.videoElement) {
      return;
    }

    this.videoElement.muted = !this.videoElement.muted;
  }

  /**
   * Toggle fullscreen
   */
  toggleFullscreen() {
    let playerContainer = null;
    
    // Try each selector until we find a match
    for (const selector of this.PLAYER_CONTAINER_SELECTORS) {
      playerContainer = document.querySelector(selector);
      if (playerContainer) {
        break;
      }
    }
    
    if (!playerContainer) {
      return;
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.warn('Exit fullscreen failed:', err);
      });
    } else {
      playerContainer.requestFullscreen().catch(err => {
        console.warn('Request fullscreen failed:', err);
      });
    }
  }

  /**
   * Trigger custom event for external handlers
   * @param {string} eventName - Event name
   */
  triggerEvent(eventName) {
    window.dispatchEvent(new CustomEvent(`anomtube-hotkey-${eventName}`, {
      detail: { timestamp: Date.now() }
    }));
  }

  /**
   * Enable hotkeys
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable hotkeys
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Get current key mappings
   * @returns {Object} Key map
   */
  getKeyMap() {
    return { ...this.keyMap };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HotkeyManager;
}
