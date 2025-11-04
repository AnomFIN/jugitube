// Hotkeys Module for AnomTube
// Handles keyboard shortcuts for video playback control

class HotkeysManager {
  constructor() {
    this.enabled = false;
    this.handlers = new Map();
    this.boundKeyHandler = this.handleKeyPress.bind(this);
    
    // Default hotkey configurations
    this.hotkeys = {
      'Space': { action: 'playPause', description: 'Play/Pause' },
      ' ': { action: 'playPause', description: 'Play/Pause' },
      'ArrowLeft': { action: 'seekBackward', description: 'Seek -5s' },
      'ArrowRight': { action: 'seekForward', description: 'Seek +5s' },
      'ArrowUp': { action: 'volumeUp', description: 'Volume Up' },
      'ArrowDown': { action: 'volumeDown', description: 'Volume Down' },
      'd': { action: 'download', description: 'Download' },
      'D': { action: 'download', description: 'Download' },
      't': { action: 'toggleTheme', description: 'Toggle Theme' },
      'T': { action: 'toggleTheme', description: 'Toggle Theme' },
      'p': { action: 'togglePiP', description: 'Toggle PiP' },
      'P': { action: 'togglePiP', description: 'Toggle PiP' }
    };
  }

  /**
   * Initialize hotkeys manager
   */
  init() {
    this.enable();
  }

  /**
   * Enable hotkey listening
   */
  enable() {
    if (this.enabled) return;
    
    document.addEventListener('keydown', this.boundKeyHandler);
    this.enabled = true;
  }

  /**
   * Disable hotkey listening
   */
  disable() {
    if (!this.enabled) return;
    
    document.removeEventListener('keydown', this.boundKeyHandler);
    this.enabled = false;
  }

  /**
   * Handle keypress events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyPress(event) {
    // Ignore keys pressed in input fields
    const target = event.target;
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable) {
      return;
    }

    const key = event.key;
    const hotkey = this.hotkeys[key];
    
    if (!hotkey) return;

    // Get handler for this action
    const handler = this.handlers.get(hotkey.action);
    if (handler) {
      event.preventDefault();
      event.stopPropagation();
      handler(event);
    }
  }

  /**
   * Register a handler for a hotkey action
   * @param {string} action - Action name
   * @param {Function} handler - Handler function
   */
  on(action, handler) {
    this.handlers.set(action, handler);
  }

  /**
   * Unregister a handler for a hotkey action
   * @param {string} action - Action name
   */
  off(action) {
    this.handlers.delete(action);
  }

  /**
   * Get video element from page
   * @returns {HTMLVideoElement|null} Video element
   */
  getVideoElement() {
    return document.querySelector('video');
  }

  /**
   * Toggle play/pause on video
   */
  playPause() {
    const video = this.getVideoElement();
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  /**
   * Seek backward 5 seconds
   */
  seekBackward() {
    const video = this.getVideoElement();
    if (!video) return;
    
    video.currentTime = Math.max(0, video.currentTime - 5);
  }

  /**
   * Seek forward 5 seconds
   */
  seekForward() {
    const video = this.getVideoElement();
    if (!video) return;
    
    video.currentTime = Math.min(video.duration, video.currentTime + 5);
  }

  /**
   * Increase volume by 10%
   */
  volumeUp() {
    const video = this.getVideoElement();
    if (!video) return;
    
    video.volume = Math.min(1, video.volume + 0.1);
  }

  /**
   * Decrease volume by 10%
   */
  volumeDown() {
    const video = this.getVideoElement();
    if (!video) return;
    
    video.volume = Math.max(0, video.volume - 0.1);
  }

  /**
   * Get list of available hotkeys
   * @returns {Array} List of hotkey configurations
   */
  getHotkeys() {
    const result = [];
    const seen = new Set();
    
    for (const [key, config] of Object.entries(this.hotkeys)) {
      const id = `${config.action}`;
      if (seen.has(id)) continue;
      
      seen.add(id);
      result.push({
        key,
        action: config.action,
        description: config.description
      });
    }
    
    return result;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HotkeysManager;
}
