// Hotkeys module for AnomTube extension
// Provides keyboard shortcuts for video control, downloads, themes, and PiP

class HotkeyManager {
  constructor() {
    this.enabled = false;
    this.videoElement = null;
    this.hotkeyMap = {
      ' ': 'playPause',        // Space: Play/Pause
      'ArrowLeft': 'seekBack',  // Left: Seek -5s
      'ArrowRight': 'seekForward', // Right: Seek +5s
      'ArrowUp': 'volumeUp',    // Up: Volume up
      'ArrowDown': 'volumeDown', // Down: Volume down
      'd': 'toggleDownload',    // D: Toggle download UI
      't': 'toggleTheme',       // T: Toggle theme
      'p': 'togglePiP'          // P: Toggle Picture-in-Picture
    };
    this.callbacks = {};
    this.boundHandleKeydown = this.handleKeydown.bind(this);
  }

  init(videoElement) {
    this.videoElement = videoElement;
    this.enable();
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    document.addEventListener('keydown', this.boundHandleKeydown);
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    document.removeEventListener('keydown', this.boundHandleKeydown);
  }

  handleKeydown(event) {
    // Don't trigger hotkeys when user is typing in input fields
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || 
        target.isContentEditable) {
      return;
    }

    const action = this.hotkeyMap[event.key];
    if (!action) return;

    // Prevent default behavior for handled keys
    event.preventDefault();
    event.stopPropagation();

    this.executeAction(action);
  }

  executeAction(action) {
    switch (action) {
      case 'playPause':
        this.playPause();
        break;
      case 'seekBack':
        this.seek(-5);
        break;
      case 'seekForward':
        this.seek(5);
        break;
      case 'volumeUp':
        this.adjustVolume(0.1);
        break;
      case 'volumeDown':
        this.adjustVolume(-0.1);
        break;
      case 'toggleDownload':
        this.triggerCallback('toggleDownload');
        break;
      case 'toggleTheme':
        this.triggerCallback('toggleTheme');
        break;
      case 'togglePiP':
        this.togglePiP();
        break;
    }
  }

  playPause() {
    if (!this.videoElement) return;
    
    if (this.videoElement.paused) {
      this.videoElement.play();
    } else {
      this.videoElement.pause();
    }
  }

  seek(seconds) {
    if (!this.videoElement) return;
    
    this.videoElement.currentTime = Math.max(
      0,
      Math.min(this.videoElement.duration, this.videoElement.currentTime + seconds)
    );
  }

  adjustVolume(delta) {
    if (!this.videoElement) return;
    
    const newVolume = Math.max(0, Math.min(1, this.videoElement.volume + delta));
    this.videoElement.volume = newVolume;
    
    // Show volume indicator (optional - can be implemented later)
    this.showVolumeIndicator(Math.round(newVolume * 100));
  }

  showVolumeIndicator(volume) {
    // Create temporary volume indicator
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px 40px;
      border-radius: 10px;
      font-size: 24px;
      z-index: 999999;
      pointer-events: none;
    `;
    indicator.textContent = `Volume: ${volume}%`;
    document.body.appendChild(indicator);
    
    setTimeout(() => {
      indicator.remove();
    }, 1000);
  }

  async togglePiP() {
    if (!this.videoElement) return;
    
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await this.videoElement.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  }

  on(event, callback) {
    this.callbacks[event] = callback;
  }

  triggerCallback(event) {
    if (this.callbacks[event]) {
      this.callbacks[event]();
    }
  }

  updateVideoElement(videoElement) {
    this.videoElement = videoElement;
  }

  destroy() {
    this.disable();
    this.videoElement = null;
    this.callbacks = {};
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HotkeyManager;
}
