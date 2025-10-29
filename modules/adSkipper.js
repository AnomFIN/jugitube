// AdSkipper module for AnomTube extension
// Uses MutationObserver with rate-limiting and multiple click-dispatch methods

class AdSkipper {
  constructor() {
    this.observer = null;
    this.isActive = false;
    this.lastSkipAttempt = 0;
    this.skipRateLimit = 300; // ms between skip attempts
    this.lastAdState = false;
    this.videoElement = null;
    this.skipButtonSelectors = [
      '.ytp-ad-skip-button.ytp-button',
      '.ytp-ad-skip-button-modern.ytp-button',
      '.ytp-ad-skip-button-modern',
      '.ytp-skip-ad-button',
      'button.ytp-ad-skip-button'
    ];
    this.overlayCloseSelectors = [
      '.ytp-ad-overlay-close-button',
      '.ytp-ad-overlay-close-button-modern'
    ];
    this.adContainerSelectors = [
      '#player-ads',
      '.ytp-ad-player-overlay',
      '.ytp-ad-module',
      '.video-ads',
      'ytd-promoted-sparkles-web-renderer',
      '.ytp-ad-image-overlay',
      '.ytp-ad-overlay-slot'
    ];
  }

  /**
   * Start the ad skipper
   * @param {Object} options - Configuration options
   */
  start(options = {}) {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.autoClickEnabled = Boolean(options.autoClickSkipAds);
    
    // Find video element
    this.findVideoElement();

    // Start mutation observer
    this.startObserver();

    // Initial check
    this.checkAndSkipAds();
  }

  /**
   * Stop the ad skipper
   */
  stop() {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.lastAdState = false;
    this.videoElement = null;
  }

  /**
   * Update configuration
   * @param {Object} options - New options
   */
  updateOptions(options = {}) {
    if (options.autoClickSkipAds !== undefined) {
      this.autoClickEnabled = Boolean(options.autoClickSkipAds);
    }
  }

  /**
   * Find the video element on the page
   */
  findVideoElement() {
    const video = document.querySelector('video');
    if (video) {
      this.videoElement = video;
    }
  }

  /**
   * Start MutationObserver to watch for ad changes
   */
  startObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      if (!this.isActive) {
        return;
      }

      // Rate limit checks
      const now = Date.now();
      if (now - this.lastSkipAttempt < this.skipRateLimit) {
        return;
      }

      this.checkAndSkipAds();
    });

    // Observe the player container for changes
    const playerContainer = document.querySelector('.html5-video-player') || document.body;
    
    this.observer.observe(playerContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  /**
   * Check if an ad is currently showing
   * @returns {boolean} True if ad is active
   */
  isAdActive() {
    const player = document.querySelector('.html5-video-player');
    if (!player) {
      return false;
    }

    return (
      player.classList.contains('ad-showing') ||
      player.classList.contains('ad-interrupting') ||
      player.classList.contains('ad-playing')
    );
  }

  /**
   * Main method to check and skip ads
   */
  checkAndSkipAds() {
    if (!this.isActive) {
      return;
    }

    const now = Date.now();
    this.lastSkipAttempt = now;

    const isAdActive = this.isAdActive();

    // Skip button clicking (multiple methods)
    if (this.autoClickEnabled && isAdActive) {
      this.tryClickSkipButton();
    }

    // Close overlay ads
    this.closeOverlayAds();

    // Remove ad containers
    this.removeAdContainers();

    // Fast forward if needed
    if (isAdActive && this.videoElement) {
      this.fastForwardAd();
    }

    this.lastAdState = isAdActive;
  }

  /**
   * Try to click the skip button using multiple methods
   */
  tryClickSkipButton() {
    // Method 1: Direct selector matching
    for (const selector of this.skipButtonSelectors) {
      const buttons = document.querySelectorAll(selector);
      for (const button of buttons) {
        if (this.isElementVisible(button)) {
          this.dispatchClick(button);
          return;
        }
      }
    }

    // Method 2: Search by text content
    const allButtons = document.querySelectorAll('button');
    for (const button of allButtons) {
      const text = button.textContent.toLowerCase().trim();
      if (
        (text.includes('skip') || text.includes('ohita')) &&
        this.isElementVisible(button)
      ) {
        this.dispatchClick(button);
        return;
      }
    }
  }

  /**
   * Dispatch click event using multiple methods
   * @param {HTMLElement} element - Element to click
   */
  dispatchClick(element) {
    if (!element) {
      return;
    }

    try {
      // Method 1: Native click
      if (typeof element.click === 'function') {
        element.click();
      }

      // Method 2: MouseEvent
      const mouseEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(mouseEvent);

      // Method 3: PointerEvent (newer browsers)
      const pointerEvent = new PointerEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(pointerEvent);
    } catch (error) {
      console.warn('Failed to dispatch click:', error);
    }
  }

  /**
   * Check if element is visible on screen
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if visible
   */
  isElementVisible(element) {
    if (!element) {
      return false;
    }

    // Check if element exists in DOM
    if (!element.offsetParent && element.offsetWidth === 0 && element.offsetHeight === 0) {
      return false;
    }

    // Check computed style
    const style = window.getComputedStyle(element);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0'
    ) {
      return false;
    }

    return true;
  }

  /**
   * Close overlay ads
   */
  closeOverlayAds() {
    for (const selector of this.overlayCloseSelectors) {
      const buttons = document.querySelectorAll(selector);
      for (const button of buttons) {
        if (this.isElementVisible(button)) {
          this.dispatchClick(button);
        }
      }
    }
  }

  /**
   * Remove ad container elements
   */
  removeAdContainers() {
    for (const selector of this.adContainerSelectors) {
      const containers = document.querySelectorAll(selector);
      for (const container of containers) {
        try {
          container.remove();
        } catch (error) {
          // Ignore removal errors
        }
      }
    }
  }

  /**
   * Fast forward through ad
   */
  fastForwardAd() {
    if (!this.videoElement) {
      return;
    }

    try {
      const duration = Number(this.videoElement.duration);
      if (Number.isFinite(duration) && duration > 0) {
        this.videoElement.currentTime = duration;
      }
    } catch (error) {
      // Ignore fast forward errors
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdSkipper;
}
