// main.js - Initializes JugiTube modules based on settings
// Separates video-block logic from ad settings

(function() {
  'use strict';

  const DEV_LOGGING = true;

  // Log function for development
  function devLog(...args) {
    if (DEV_LOGGING) {
      console.log('[JugiTube Main]', ...args);
    }
  }

  // Check if video blocking should be disabled
  function shouldDisableVideoBlock() {
    if (!window.jugitubeSettings) {
      return false;
    }
    
    // If allowVideoKeepAdSettings is true, don't block video
    return window.jugitubeSettings.allowVideoKeepAdSettings === true;
  }

  // Initialize video blocking logic
  function initVideoBlock() {
    if (shouldDisableVideoBlock()) {
      devLog('Video blocking disabled by settings (allowVideoKeepAdSettings = true)');
      return;
    }

    devLog('Video blocking enabled - would initialize video block logic here');
    
    // Note: The actual video blocking logic is already in content.js (AnomTube class)
    // This is just a placeholder to show where it would be controlled from
    // In a real refactor, we would move the video blocking logic here
  }

  // Initialize ad skipper
  function initAdSkipper() {
    devLog('Ad skipper initialization delegated to adSkipper.js');
    // The adSkipper.js module initializes itself
    // It checks window.jugitubeSettings.autoClickSkips internally
  }

  // Initialize lyric handler
  function initLyricHandler() {
    devLog('Lyric handler initialization delegated to lyricHandler.js');
    // The lyricHandler.js module initializes itself
    // It checks window.jugitubeSettings.hideLyricPopup internally
  }

  // Main initialization
  function init() {
    devLog('JugiTube Main initializing...');

    // Wait for settings to be loaded
    if (!window.jugitubeSettings) {
      window.addEventListener('jugitube-settings-loaded', (e) => {
        devLog('Settings loaded:', e.detail);
        startModules();
      });
    } else {
      startModules();
    }

    // Listen for settings changes
    window.addEventListener('jugitube-settings-changed', (e) => {
      devLog('Settings changed, reinitializing modules');
      startModules();
    });
  }

  function startModules() {
    devLog('Starting modules with settings:', window.jugitubeSettings);
    
    // Initialize modules
    // Note: adSkipper and lyricHandler self-initialize
    // They're already loaded and listening for settings
    
    // Video blocking logic
    initVideoBlock();
    
    devLog('All modules initialized');
    
    // Dispatch event to signal that main initialization is complete
    window.dispatchEvent(new CustomEvent('jugitube-main-initialized', {
      detail: {
        videoBlockDisabled: shouldDisableVideoBlock()
      }
    }));
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for debugging
  window.jugitubeMain = {
    shouldDisableVideoBlock,
    init
  };
})();
