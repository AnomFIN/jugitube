// Window State Manager for AnomTube
// Manages window size and position persistence using chrome.storage

class WindowStateManager {
  constructor() {
    this.defaults = {
      width: 380,
      height: 420,
      minWidth: 220,
      minHeight: 300,
      left: null,
      top: null
    };
    
    this.currentState = { ...this.defaults };
    this.storageKey = 'windowState';
  }

  /**
   * Initialize and load saved window state
   * @returns {Promise<Object>} Current window state
   */
  async init() {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      if (result[this.storageKey]) {
        this.currentState = {
          ...this.defaults,
          ...result[this.storageKey]
        };
      }
      return this.currentState;
    } catch (error) {
      console.error('Failed to load window state:', error);
      return this.currentState;
    }
  }

  /**
   * Save current window state
   * @param {Object} state - State to save
   * @returns {Promise<void>}
   */
  async save(state) {
    try {
      this.currentState = {
        ...this.currentState,
        ...state
      };
      
      await chrome.storage.local.set({
        [this.storageKey]: this.currentState
      });
    } catch (error) {
      console.error('Failed to save window state:', error);
    }
  }

  /**
   * Get current state
   * @returns {Object} Current window state
   */
  getState() {
    return { ...this.currentState };
  }

  /**
   * Reset to default state
   * @returns {Promise<Object>} Default state
   */
  async reset() {
    this.currentState = { ...this.defaults };
    try {
      await chrome.storage.local.set({
        [this.storageKey]: this.currentState
      });
    } catch (error) {
      console.error('Failed to reset window state:', error);
    }
    return this.currentState;
  }

  /**
   * Apply window state to an element
   * @param {HTMLElement} element - Element to apply state to
   */
  applyToElement(element) {
    if (!element) return;

    const state = this.getState();
    
    if (state.width) {
      element.style.width = `${state.width}px`;
    }
    
    if (state.left !== null && state.top !== null) {
      element.style.left = `${state.left}px`;
      element.style.top = `${state.top}px`;
    }
  }

  /**
   * Save element position and size
   * @param {HTMLElement} element - Element to save state from
   */
  saveFromElement(element) {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    const state = {
      width: rect.width || parseInt(computedStyle.width) || this.defaults.width,
      height: rect.height || parseInt(computedStyle.height) || this.defaults.height,
      left: rect.left,
      top: rect.top
    };

    this.save(state);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WindowStateManager;
}
