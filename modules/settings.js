// Settings module for AnomTube extension
// Handles loading and storing all user preferences

class SettingsManager {
  constructor() {
    this.settings = {
      // Core settings
      enabled: false,
      
      // Ad control settings
      muteAds: false,
      skipAds: false,
      blockAds: false,
      autoClickSkipAds: false, // New: Auto-click skip ads immediately
      
      // Video and UI settings
      allowVideoKeepAdSettings: false, // New: Allow video but keep ad blocking active
      hidePopupCompletely: false, // New: Hide lyric popup entirely
      expandToolbar: true, // New: Expand toolbar width (default true)
      
      // Visual customization (stored in local storage)
      customBackground: null,
      customLogo: null,
      lyricsConsolePosition: null
    };
  }

  /**
   * Load all settings from chrome.storage
   * @returns {Promise<Object>} Settings object
   */
  async load() {
    try {
      const [syncSettings, localSettings] = await Promise.all([
        chrome.storage.sync.get([
          'enabled',
          'muteAds',
          'skipAds',
          'blockAds',
          'autoClickSkipAds',
          'allowVideoKeepAdSettings',
          'hidePopupCompletely',
          'expandToolbar'
        ]),
        chrome.storage.local.get([
          'customBackground',
          'customLogo',
          'lyricsConsolePosition'
        ])
      ]);

      // Merge settings with defaults
      this.settings = {
        ...this.settings,
        ...syncSettings,
        ...localSettings
      };

      return this.settings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return this.settings;
    }
  }

  /**
   * Save specific settings to chrome.storage
   * @param {Object} updates - Settings to update
   * @returns {Promise<void>}
   */
  async save(updates) {
    try {
      const syncKeys = [
        'enabled',
        'muteAds',
        'skipAds',
        'blockAds',
        'autoClickSkipAds',
        'allowVideoKeepAdSettings',
        'hidePopupCompletely',
        'expandToolbar'
      ];
      
      const localKeys = [
        'customBackground',
        'customLogo',
        'lyricsConsolePosition'
      ];

      const syncUpdates = {};
      const localUpdates = {};

      for (const [key, value] of Object.entries(updates)) {
        if (syncKeys.includes(key)) {
          syncUpdates[key] = value;
          this.settings[key] = value;
        } else if (localKeys.includes(key)) {
          localUpdates[key] = value;
          this.settings[key] = value;
        }
      }

      const promises = [];
      if (Object.keys(syncUpdates).length > 0) {
        promises.push(chrome.storage.sync.set(syncUpdates));
      }
      if (Object.keys(localUpdates).length > 0) {
        promises.push(chrome.storage.local.set(localUpdates));
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Get current settings
   * @returns {Object} Current settings
   */
  getAll() {
    return { ...this.settings };
  }

  /**
   * Get a specific setting
   * @param {string} key - Setting key
   * @returns {*} Setting value
   */
  get(key) {
    return this.settings[key];
  }

  /**
   * Listen for changes in storage and update settings
   * @param {Function} callback - Called when settings change
   */
  onChange(callback) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      let updated = false;
      
      for (const [key, { newValue }] of Object.entries(changes)) {
        if (key in this.settings) {
          this.settings[key] = newValue;
          updated = true;
        }
      }

      if (updated && callback) {
        callback(this.getAll(), changes, areaName);
      }
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsManager;
}
