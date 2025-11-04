// Theme Manager for AnomTube extension
// Handles light/dark theme switching and persistence

class ThemeManager {
  constructor() {
    this.currentTheme = 'dark'; // default theme
    this.storageKey = 'anomTubeTheme';
    this.themeStyles = null;
  }

  async init() {
    // Load saved theme
    const result = await chrome.storage.sync.get([this.storageKey]);
    this.currentTheme = result[this.storageKey] || 'dark';
    this.applyTheme(this.currentTheme);
  }

  async toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    await this.saveTheme();
    this.applyTheme(this.currentTheme);
    return this.currentTheme;
  }

  async saveTheme() {
    await chrome.storage.sync.set({ [this.storageKey]: this.currentTheme });
  }

  applyTheme(theme) {
    // Remove existing theme styles
    if (this.themeStyles) {
      this.themeStyles.remove();
    }

    // Create and inject theme styles
    this.themeStyles = document.createElement('style');
    this.themeStyles.id = 'anomtube-theme-styles';
    
    if (theme === 'light') {
      this.themeStyles.textContent = this.getLightThemeCSS();
    } else {
      this.themeStyles.textContent = this.getDarkThemeCSS();
    }
    
    document.head.appendChild(this.themeStyles);
    
    // Apply to lyrics console if it exists
    this.applyThemeToLyricsConsole(theme);
    
    // Notify other parts of the app
    document.dispatchEvent(new CustomEvent('anomtubeThemeChanged', { 
      detail: { theme } 
    }));
  }

  getDarkThemeCSS() {
    return `
      :root {
        --anomtube-bg-primary: #0a0e1a;
        --anomtube-bg-secondary: #12182b;
        --anomtube-text-primary: #f8faff;
        --anomtube-text-secondary: #b8c5d9;
        --anomtube-accent: #6ca8ff;
        --anomtube-border: rgba(255, 255, 255, 0.12);
        --anomtube-shadow: rgba(0, 0, 0, 0.5);
      }
    `;
  }

  getLightThemeCSS() {
    return `
      :root {
        --anomtube-bg-primary: #ffffff;
        --anomtube-bg-secondary: #f5f7fa;
        --anomtube-text-primary: #1a202c;
        --anomtube-text-secondary: #4a5568;
        --anomtube-accent: #3182ce;
        --anomtube-border: rgba(0, 0, 0, 0.12);
        --anomtube-shadow: rgba(0, 0, 0, 0.1);
      }
    `;
  }

  applyThemeToLyricsConsole(theme) {
    const lyricsConsole = document.querySelector('#anomtube-lyrics-console');
    if (!lyricsConsole) return;

    if (theme === 'light') {
      lyricsConsole.style.background = 'linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%)';
      lyricsConsole.style.color = '#1a202c';
      lyricsConsole.style.borderColor = 'rgba(0, 0, 0, 0.15)';
      lyricsConsole.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.15)';
    } else {
      lyricsConsole.style.background = 'linear-gradient(135deg, rgba(10, 14, 26, 0.95) 0%, rgba(18, 24, 43, 0.98) 100%)';
      lyricsConsole.style.color = '#f8faff';
      lyricsConsole.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      lyricsConsole.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.5)';
    }

    // Update text elements
    const textElements = lyricsConsole.querySelectorAll('.lyrics-line, .lyrics-title, .lyrics-artist');
    textElements.forEach(el => {
      el.style.color = theme === 'light' ? '#1a202c' : '#f8faff';
    });
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  isLightTheme() {
    return this.currentTheme === 'light';
  }

  isDarkTheme() {
    return this.currentTheme === 'dark';
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
