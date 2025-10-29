// lyricHandler.js - Removes or blocks lyric popups based on user settings
// Uses MutationObserver to detect and remove lyric popup elements

(function() {
  'use strict';

  const DEV_LOGGING = true;

  // Selectors for lyric popups
  const LYRIC_POPUP_SELECTORS = [
    '.lyric-popup',
    '#lyrics-popup',
    '.lyrics-overlay',
    '.lyrics-panel',
    '[class*="lyrics"][class*="popup"]',
    '[id*="lyrics"][id*="popup"]',
    'ytmusic-lyrics-renderer',
    '.ytmusic-lyrics-shelf-renderer'
  ];

  // Log function for development
  function devLog(...args) {
    if (DEV_LOGGING) {
      console.log('[JugiTube LyricHandler]', ...args);
    }
  }

  // Check if element is a lyric popup
  function isLyricPopup(element) {
    if (!element || !element.matches) return false;
    
    for (const selector of LYRIC_POPUP_SELECTORS) {
      try {
        if (element.matches(selector)) {
          return true;
        }
      } catch (error) {
        // Invalid selector, skip
        continue;
      }
    }
    
    return false;
  }

  // Remove lyric popups
  function removeLyricPopups() {
    let removedCount = 0;
    
    for (const selector of LYRIC_POPUP_SELECTORS) {
      try {
        const elements = document.querySelectorAll(selector);
        
        for (const element of elements) {
          if (element && element.parentNode) {
            element.remove();
            removedCount++;
            devLog('Removed lyric popup:', selector);
          }
        }
      } catch (error) {
        // Invalid selector or error during removal, skip
        devLog('Error removing lyric popup with selector', selector, ':', error);
      }
    }
    
    if (removedCount > 0) {
      devLog(`Removed ${removedCount} lyric popup(s)`);
    }
    
    return removedCount;
  }

  // Hide lyric popups instead of removing (fallback)
  function hideLyricPopups() {
    for (const selector of LYRIC_POPUP_SELECTORS) {
      try {
        const elements = document.querySelectorAll(selector);
        
        for (const element of elements) {
          if (element) {
            element.style.display = 'none';
            element.style.visibility = 'hidden';
            element.style.opacity = '0';
            element.setAttribute('aria-hidden', 'true');
            devLog('Hidden lyric popup:', selector);
          }
        }
      } catch (error) {
        devLog('Error hiding lyric popup with selector', selector, ':', error);
      }
    }
  }

  // Process lyric popups based on settings
  function processLyricPopups() {
    // Check if settings are loaded
    if (!window.jugitubeSettings) {
      return;
    }

    // Check if hiding is enabled
    if (window.jugitubeSettings.hideLyricPopup) {
      removeLyricPopups();
      hideLyricPopups();
    }
  }

  // Initialize lyric handler
  function init() {
    devLog('Initializing lyric handler...');

    // Wait for settings to be loaded
    if (!window.jugitubeSettings) {
      window.addEventListener('jugitube-settings-loaded', () => {
        devLog('Settings loaded, starting lyric handler');
        startHandling();
      });
    } else {
      startHandling();
    }

    // Listen for settings changes
    window.addEventListener('jugitube-settings-changed', () => {
      devLog('Settings changed, reprocessing lyric popups');
      processLyricPopups();
    });
  }

  function startHandling() {
    // Check if hiding is enabled
    if (!window.jugitubeSettings || !window.jugitubeSettings.hideLyricPopup) {
      devLog('Lyric popup hiding disabled in settings');
      return;
    }

    // Use MutationObserver to detect lyric popup elements
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node;
              
              // Check if this is a lyric popup or contains one
              if (isLyricPopup(element)) {
                shouldProcess = true;
                break;
              }
              
              // Check if it contains a lyric popup
              for (const selector of LYRIC_POPUP_SELECTORS) {
                try {
                  if (element.querySelector && element.querySelector(selector)) {
                    shouldProcess = true;
                    break;
                  }
                } catch (error) {
                  // Invalid selector, skip
                  continue;
                }
              }
              
              if (shouldProcess) break;
            }
          }
        }
        
        if (shouldProcess) break;
      }
      
      if (shouldProcess) {
        processLyricPopups();
      }
    });

    // Observe the entire document for lyric popup elements
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Run immediately
    processLyricPopups();
    
    // Also run periodically as a fallback
    setInterval(processLyricPopups, 2000);
    
    devLog('Lyric handler started');
  }

  // Export for testing
  window.jugitubeLyricHandler = {
    removeLyricPopups,
    hideLyricPopups,
    isLyricPopup
  };

  // Initialize
  init();
})();
