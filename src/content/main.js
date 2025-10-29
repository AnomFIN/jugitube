// Main content script - initializes all modules and coordinates video blocking
(function() {
  'use strict';

  console.log('JugiTube: Main module initializing');

  // Module initialization state
  const modules = {
    settingsApply: false,
    adSkipper: false,
    lyricHandler: false
  };

  // Check if video blocking should be active
  function shouldBlockVideo() {
    // If allowVideoKeepAdSettings is enabled, don't block video
    if (window.jugitubeSettings && window.jugitubeSettings.allowVideoKeepAdSettings) {
      return false;
    }
    
    // Check if AnomTube extension is enabled via chrome.storage
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(['enabled'], (data) => {
          resolve(data.enabled === true);
        });
      } else {
        // If chrome.storage is not available, default to false
        resolve(false);
      }
    });
  }

  // Initialize video blocking logic
  async function initVideoBlocking() {
    const blockVideo = await shouldBlockVideo();
    
    if (blockVideo) {
      console.log('JugiTube: Video blocking is active');
      // The existing content.js (AnomTube class) handles video blocking
      // This main.js just coordinates when it should be active
    } else {
      console.log('JugiTube: Video blocking is disabled (allowVideoKeepAdSettings or extension disabled)');
    }
  }

  // Initialize ad-related modules
  function initAdModules() {
    console.log('JugiTube: Ad modules initialized');
    // Ad modules (adSkipper) work independently of video blocking
    // They are controlled by their own settings
  }

  // Handle settings changes
  function handleSettingsChange(event) {
    console.log('JugiTube: Settings changed', event.detail);
    
    // Re-check if video blocking should be active
    initVideoBlocking();
  }

  // Check module initialization status
  function checkModules() {
    const allLoaded = Object.values(modules).every(loaded => loaded);
    if (allLoaded) {
      console.log('JugiTube: All modules initialized successfully');
    }
  }

  // Initialize all modules
  function init() {
    console.log('JugiTube: Starting initialization');
    
    // Mark modules as loaded (they initialize themselves)
    modules.settingsApply = true;
    modules.adSkipper = true;
    modules.lyricHandler = true;
    
    checkModules();
    
    // Initialize video blocking logic
    initVideoBlocking();
    
    // Initialize ad modules
    initAdModules();
    
    // Listen for settings changes
    window.addEventListener('jugitube-settings-loaded', handleSettingsChange);
    
    // Re-check video blocking when extension state changes
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'toggleAnomTube' || request.action === 'updateAdPreferences') {
          initVideoBlocking();
        }
      });
    }
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export module status for debugging
  window.jugitubeModules = modules;
})();
