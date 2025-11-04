// Theme Management for AnomTube Extension
// Handles dark/light theme switching with persistence

class ThemeManager {
  constructor() {
    this.currentTheme = 'dark'; // default
    this.themes = {
      dark: {
        name: 'Dark',
        cssClass: 'anomtube-theme-dark'
      },
      light: {
        name: 'Light',
        cssClass: 'anomtube-theme-light'
      }
    };
    this.initialized = false;
  }

  /**
   * Initialize theme system
   * Load saved theme preference and apply it
   */
  async init() {
    if (this.initialized) {
      return;
    }

    try {
      const { theme } = await chrome.storage.sync.get(['theme']);
      this.currentTheme = theme || 'dark';
      this.applyTheme(this.currentTheme);
      this.initialized = true;
    } catch (error) {
      console.error('Theme initialization failed:', error);
      this.applyTheme('dark');
    }
  }

  /**
   * Apply theme by adding/removing CSS classes
   * @param {string} themeName - 'dark' or 'light'
   */
  applyTheme(themeName) {
    if (!this.themes[themeName]) {
      console.warn(`Unknown theme: ${themeName}`);
      return;
    }

    // Remove all theme classes
    Object.values(this.themes).forEach(theme => {
      document.body.classList.remove(theme.cssClass);
    });

    // Add new theme class
    document.body.classList.add(this.themes[themeName].cssClass);
    this.currentTheme = themeName;

    // Dispatch custom event for theme change
    window.dispatchEvent(new CustomEvent('anomtube-theme-changed', {
      detail: { theme: themeName }
    }));
  }

  /**
   * Toggle between dark and light themes
   * @returns {string} The new theme name
   */
  async toggle() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    await this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Set specific theme and persist
   * @param {string} themeName - 'dark' or 'light'
   */
  async setTheme(themeName) {
    if (!this.themes[themeName]) {
      console.warn(`Unknown theme: ${themeName}`);
      return;
    }

    this.applyTheme(themeName);

    try {
      await chrome.storage.sync.set({ theme: themeName });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }

  /**
   * Get current theme name
   * @returns {string} Current theme name
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get all available themes
   * @returns {Object} Themes object
   */
  getThemes() {
    return this.themes;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
