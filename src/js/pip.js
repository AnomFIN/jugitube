// Picture-in-Picture (PiP) Manager for AnomTube Extension
// Handles HTML5 PiP mode for video element

class PipManager {
  constructor() {
    this.videoElement = null;
    this.isPipActive = false;
    this.boundHandlePipEnter = this.handlePipEnter.bind(this);
    this.boundHandlePipExit = this.handlePipExit.bind(this);
  }

  /**
   * Initialize PiP manager
   * @param {HTMLVideoElement} videoElement - Video element to use for PiP
   */
  init(videoElement) {
    if (!videoElement) {
      console.warn('PiP init: no video element provided');
      return;
    }

    this.videoElement = videoElement;

    // Listen for PiP events
    this.videoElement.addEventListener('enterpictureinpicture', this.boundHandlePipEnter);
    this.videoElement.addEventListener('leavepictureinpicture', this.boundHandlePipExit);
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    if (this.videoElement) {
      this.videoElement.removeEventListener('enterpictureinpicture', this.boundHandlePipEnter);
      this.videoElement.removeEventListener('leavepictureinpicture', this.boundHandlePipExit);
    }
  }

  /**
   * Update video element reference
   * @param {HTMLVideoElement} videoElement
   */
  setVideoElement(videoElement) {
    this.destroy();
    this.videoElement = videoElement;
    
    if (videoElement) {
      videoElement.addEventListener('enterpictureinpicture', this.boundHandlePipEnter);
      videoElement.addEventListener('leavepictureinpicture', this.boundHandlePipExit);
    }
  }

  /**
   * Check if PiP is supported
   * @returns {boolean} True if PiP is supported
   */
  isSupported() {
    return document.pictureInPictureEnabled && 
           typeof HTMLVideoElement !== 'undefined' &&
           'requestPictureInPicture' in HTMLVideoElement.prototype;
  }

  /**
   * Toggle Picture-in-Picture mode
   * @returns {Promise<boolean>} True if PiP was entered, false if exited
   */
  async toggle() {
    if (!this.isSupported()) {
      console.warn('Picture-in-Picture is not supported');
      return false;
    }

    if (!this.videoElement) {
      console.warn('No video element available for PiP');
      return false;
    }

    try {
      if (document.pictureInPictureElement) {
        await this.exit();
        return false;
      } else {
        await this.enter();
        return true;
      }
    } catch (error) {
      console.error('PiP toggle failed:', error);
      return false;
    }
  }

  /**
   * Enter Picture-in-Picture mode
   * @returns {Promise<void>}
   */
  async enter() {
    if (!this.isSupported()) {
      throw new Error('Picture-in-Picture is not supported');
    }

    if (!this.videoElement) {
      throw new Error('No video element available');
    }

    if (document.pictureInPictureElement) {
      console.warn('Already in PiP mode');
      return;
    }

    try {
      await this.videoElement.requestPictureInPicture();
    } catch (error) {
      console.error('Failed to enter PiP:', error);
      throw error;
    }
  }

  /**
   * Exit Picture-in-Picture mode
   * @returns {Promise<void>}
   */
  async exit() {
    if (!document.pictureInPictureElement) {
      console.warn('Not in PiP mode');
      return;
    }

    try {
      await document.exitPictureInPicture();
    } catch (error) {
      console.error('Failed to exit PiP:', error);
      throw error;
    }
  }

  /**
   * Handle entering PiP mode
   * @param {Event} event
   */
  handlePipEnter(event) {
    this.isPipActive = true;
    console.log('Entered Picture-in-Picture mode');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('anomtube-pip-entered', {
      detail: { videoElement: this.videoElement }
    }));
  }

  /**
   * Handle exiting PiP mode
   * @param {Event} event
   */
  handlePipExit(event) {
    this.isPipActive = false;
    console.log('Exited Picture-in-Picture mode');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('anomtube-pip-exited', {
      detail: { videoElement: this.videoElement }
    }));
  }

  /**
   * Check if currently in PiP mode
   * @returns {boolean} True if in PiP mode
   */
  isActive() {
    return this.isPipActive && document.pictureInPictureElement === this.videoElement;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PipManager;
}
