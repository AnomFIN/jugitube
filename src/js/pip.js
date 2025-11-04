// PiP (Picture-in-Picture) Manager for AnomTube
// Handles HTML5 PiP and mini-player functionality

class PiPManager {
  constructor() {
    this.isInPiP = false;
    this.video = null;
    this.pipButton = null;
  }

  /**
   * Initialize PiP manager
   */
  init() {
    // Check if PiP is supported
    if (!document.pictureInPictureEnabled) {
      console.warn('Picture-in-Picture is not supported in this browser');
      return false;
    }
    
    // Listen for PiP events
    document.addEventListener('enterpictureinpicture', () => {
      this.isInPiP = true;
    });
    
    document.addEventListener('leavepictureinpicture', () => {
      this.isInPiP = false;
    });
    
    return true;
  }

  /**
   * Get video element from page
   * @returns {HTMLVideoElement|null} Video element
   */
  getVideoElement() {
    if (this.video && document.contains(this.video)) {
      return this.video;
    }
    
    this.video = document.querySelector('video');
    return this.video;
  }

  /**
   * Toggle Picture-in-Picture mode
   * @returns {Promise<boolean>} Success status
   */
  async toggle() {
    if (this.isInPiP) {
      return await this.exit();
    } else {
      return await this.enter();
    }
  }

  /**
   * Enter Picture-in-Picture mode
   * @returns {Promise<boolean>} Success status
   */
  async enter() {
    try {
      const video = this.getVideoElement();
      if (!video) {
        console.warn('No video element found');
        return false;
      }

      if (document.pictureInPictureElement) {
        return true; // Already in PiP
      }

      await video.requestPictureInPicture();
      this.isInPiP = true;
      return true;
    } catch (error) {
      console.error('Failed to enter PiP mode:', error);
      return false;
    }
  }

  /**
   * Exit Picture-in-Picture mode
   * @returns {Promise<boolean>} Success status
   */
  async exit() {
    try {
      if (!document.pictureInPictureElement) {
        return true; // Already exited
      }

      await document.exitPictureInPicture();
      this.isInPiP = false;
      return true;
    } catch (error) {
      console.error('Failed to exit PiP mode:', error);
      return false;
    }
  }

  /**
   * Check if currently in PiP mode
   * @returns {boolean} PiP status
   */
  isPiPActive() {
    return this.isInPiP && document.pictureInPictureElement !== null;
  }

  /**
   * Check if PiP is supported
   * @returns {boolean} Support status
   */
  isSupported() {
    return document.pictureInPictureEnabled === true;
  }
}

// Theme Manager for AnomTube
// Handles light/dark theme switching with persistence

class ThemeManager {
  constructor() {
    this.currentTheme = 'dark';
    this.storageKey = 'theme';
  }

  /**
   * Initialize theme manager and apply saved theme
   * @returns {Promise<string>} Current theme
   */
  async init() {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      this.currentTheme = result[this.storageKey] || 'dark';
      this.apply(this.currentTheme);
      return this.currentTheme;
    } catch (error) {
      console.error('Failed to load theme:', error);
      this.apply('dark');
      return 'dark';
    }
  }

  /**
   * Toggle between light and dark themes
   * @returns {Promise<string>} New theme
   */
  async toggle() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    await this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Set specific theme
   * @param {string} theme - 'light' or 'dark'
   * @returns {Promise<void>}
   */
  async setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      theme = 'dark';
    }
    
    this.currentTheme = theme;
    this.apply(theme);
    
    try {
      await chrome.storage.local.set({ [this.storageKey]: theme });
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }

  /**
   * Apply theme to page
   * @param {string} theme - Theme to apply
   */
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Apply theme to lyrics console if it exists
    const lyricsConsole = document.getElementById('anomfin-lyrics-console');
    if (lyricsConsole) {
      lyricsConsole.setAttribute('data-theme', theme);
    }
    
    // Apply theme to placeholder if it exists
    const placeholder = document.getElementById('anomtube-placeholder');
    if (placeholder) {
      placeholder.setAttribute('data-theme', theme);
    }
  }

  /**
   * Get current theme
   * @returns {string} Current theme
   */
  getTheme() {
    return this.currentTheme;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PiPManager, ThemeManager };
}
