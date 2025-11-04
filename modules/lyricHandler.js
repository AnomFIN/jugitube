// LyricHandler module for AnomTube extension
// Handles showing/hiding the lyrics popup based on settings

class LyricHandler {
  constructor() {
    this.hidePopup = false;
    this.popupElement = null;
    this.observer = null;
  }

  /**
   * Initialize the handler with settings
   * @param {Object} settings - Configuration settings
   */
  init(settings = {}) {
    this.hidePopup = Boolean(settings.hidePopupCompletely);
    
    if (this.hidePopup) {
      this.startHiding();
    } else {
      this.stopHiding();
    }
  }

  /**
   * Update settings
   * @param {Object} settings - New settings
   */
  updateSettings(settings = {}) {
    const previousState = this.hidePopup;
    this.hidePopup = Boolean(settings.hidePopupCompletely);

    if (this.hidePopup && !previousState) {
      this.startHiding();
    } else if (!this.hidePopup && previousState) {
      this.stopHiding();
    }
  }

  /**
   * Start hiding the popup
   */
  startHiding() {
    // Remove existing popup if present
    this.removePopup();

    // Start observing for popup creation
    this.startObserver();
  }

  /**
   * Stop hiding the popup
   */
  stopHiding() {
    // Stop observing
    this.stopObserver();
    
    // Show popup if it was hidden
    if (this.popupElement) {
      this.showPopup();
    }
  }

  /**
   * Start MutationObserver to watch for popup creation
   */
  startObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      if (!this.hidePopup) {
        return;
      }

      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if this is the lyrics popup
              if (
                node.id === 'anomfin-lyrics-console' ||
                node.classList?.contains('anomfin-lyrics')
              ) {
                this.removePopup();
                return;
              }
            }
          }
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: false
    });
  }

  /**
   * Stop the observer
   */
  stopObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Remove the popup from the DOM
   */
  removePopup() {
    const popup = document.getElementById('anomfin-lyrics-console');
    if (popup) {
      this.popupElement = popup;
      popup.style.display = 'none';
      popup.style.visibility = 'hidden';
      popup.style.pointerEvents = 'none';
    }
  }

  /**
   * Show the popup
   */
  showPopup() {
    if (this.popupElement) {
      this.popupElement.style.display = '';
      this.popupElement.style.visibility = '';
      this.popupElement.style.pointerEvents = '';
    }
  }

  /**
   * Check if popup should be shown
   * @returns {boolean} True if popup should be shown
   */
  shouldShowPopup() {
    return !this.hidePopup;
  }

  /**
   * Cleanup and stop
   */
  destroy() {
    this.stopObserver();
    if (this.popupElement) {
      this.showPopup();
      this.popupElement = null;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LyricHandler;
}
