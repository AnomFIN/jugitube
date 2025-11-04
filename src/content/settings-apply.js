// Settings apply content script - applies settings to the page
(function() {
  'use strict';

  const SETTINGS_KEY = 'jugitube_settings_v1';

  // Default settings
  const defaultSettings = {
    expandToolbar: false,
    hideLyricPopup: false,
    allowVideoKeepAdSettings: false,
    autoClickSkips: false
  };

  // Load settings from localStorage
  function loadSettings() {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('AnomTube: Error loading settings:', error);
    }
    return defaultSettings;
  }

  // Apply CSS variables based on settings
  function applyCSSVariables(settings) {
    const root = document.documentElement;
    
    // Apply toolbar width variable
    if (settings.expandToolbar) {
      root.style.setProperty('--jugitube-toolbar-width', '280px');
      root.setAttribute('data-jugitube-expand-toolbar', 'true');
    } else {
      root.style.setProperty('--jugitube-toolbar-width', '220px');
      root.removeAttribute('data-jugitube-expand-toolbar');
    }
  }

  // Apply settings to the page
  function applySettings() {
    const settings = loadSettings();
    
    // Make settings available globally for other scripts
    window.jugitubeSettings = settings;
    
    // Apply CSS variables
    applyCSSVariables(settings);
    
    // Dispatch custom event to notify other scripts
    window.dispatchEvent(new CustomEvent('jugitube-settings-loaded', {
      detail: settings
    }));
  }

  // Listen for settings changes
  function watchSettingsChanges() {
    // Watch localStorage changes
    window.addEventListener('storage', (event) => {
      if (event.key === SETTINGS_KEY) {
        applySettings();
      }
    });

    // Watch chrome.storage changes if available
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes[SETTINGS_KEY]) {
          applySettings();
        }
      });
    }
  }

  // Initialize settings application
  function init() {
    applySettings();
    watchSettingsChanges();
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
