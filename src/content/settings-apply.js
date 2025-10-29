// settings-apply.js - Loads JugiTube settings and applies them
// Runs at document_idle to ensure page is ready

(function() {
  'use strict';

  const STORAGE_KEY = 'jugitube_settings_v1';
  
  // Default settings
  const DEFAULT_SETTINGS = {
    expandToolbar: true,
    hideLyricPopup: false,
    allowVideoKeepAdSettings: false,
    autoClickSkips: true
  };

  // Load settings from localStorage
  function loadSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('[JugiTube] Failed to load settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  // Apply CSS variable for toolbar width
  function applyCSSVariables(settings) {
    const root = document.documentElement;
    
    // Set toolbar collapsed state
    if (settings.expandToolbar) {
      document.body.removeAttribute('jugitube-toolbar-collapsed');
    } else {
      document.body.setAttribute('jugitube-toolbar-collapsed', 'true');
    }
  }

  // Apply settings
  function applySettings() {
    const settings = loadSettings();
    
    // Make settings available globally
    window.jugitubeSettings = settings;
    
    // Apply CSS variables
    applyCSSVariables(settings);
    
    console.log('[JugiTube] Settings applied:', settings);
    
    // Dispatch event to notify other scripts
    window.dispatchEvent(new CustomEvent('jugitube-settings-loaded', {
      detail: settings
    }));
  }

  // Listen for settings changes
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      console.log('[JugiTube] Settings changed, reapplying...');
      applySettings();
    }
  });

  // Listen for custom settings change events
  window.addEventListener('jugitube-settings-changed', (e) => {
    console.log('[JugiTube] Settings changed via custom event, reapplying...');
    applySettings();
  });

  // Apply settings on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySettings);
  } else {
    applySettings();
  }
})();
