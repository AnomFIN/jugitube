// Settings apply content script - applies settings to the page
// Less noise. More signal. AnomFIN.
(function() {
  'use strict';

  const SETTINGS_KEY = 'jugitube_settings_v1';

  const widthUtils = typeof window !== 'undefined' && window.jugitubeToolbarWidth ? window.jugitubeToolbarWidth : null;

  // Default settings
  const defaultSettings = {
    expandToolbar: false,
    toolbarWidth: widthUtils ? widthUtils.DEFAULT_WIDTH : 220,
    hideLyricPopup: false,
    allowVideoKeepAdSettings: false,
    autoClickSkips: false
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const normalizeToolbarWidth = (value) => {
    if (widthUtils) {
      return widthUtils.normalizeToolbarWidth(value, defaultSettings.toolbarWidth);
    }
    const numeric = Number(value);
    const fallback = defaultSettings.toolbarWidth;
    if (!Number.isFinite(numeric)) return fallback;
    return clamp(Math.round(numeric), 200, 360);
  };

  const deriveExpandFlag = (widthValue) => {
    if (widthUtils) {
      return widthUtils.deriveExpandFlag(widthValue);
    }
    return normalizeToolbarWidth(widthValue) >= 260;
  };

  // Load settings from localStorage
  function loadSettings() {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = { ...defaultSettings, ...JSON.parse(stored) };
        const normalizedWidth = normalizeToolbarWidth(
          parsed.toolbarWidth ?? (parsed.expandToolbar ? 280 : defaultSettings.toolbarWidth)
        );
        return {
          ...parsed,
          toolbarWidth: normalizedWidth,
          expandToolbar: deriveExpandFlag(normalizedWidth)
        };
      }
    } catch (error) {
      console.error('AnomTube: Error loading settings:', error);
    }
    return defaultSettings;
  }

  // Apply CSS variables based on settings
  function applyCSSVariables(settings) {
    const root = document.documentElement;
    const normalizedWidth = normalizeToolbarWidth(settings.toolbarWidth ?? defaultSettings.toolbarWidth);
    const expandToolbar = deriveExpandFlag(normalizedWidth);

    root.style.setProperty('--jugitube-toolbar-width', `${normalizedWidth}px`);
    root.setAttribute('data-jugitube-expand-toolbar', expandToolbar ? 'true' : 'false');
  }

  // Apply settings to the page
  function applySettings() {
    const settings = loadSettings();
    
    // Make settings available globally for other scripts
    const normalizedWidth = normalizeToolbarWidth(settings.toolbarWidth ?? defaultSettings.toolbarWidth);
    const expandToolbar = deriveExpandFlag(normalizedWidth);

    const mergedSettings = {
      ...settings,
      toolbarWidth: normalizedWidth,
      expandToolbar
    };

    window.jugitubeSettings = mergedSettings;
    
    // Apply CSS variables
    applyCSSVariables(mergedSettings);
    
    // Dispatch custom event to notify other scripts
    window.dispatchEvent(new CustomEvent('jugitube-settings-loaded', {
      detail: mergedSettings
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
