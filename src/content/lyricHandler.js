// Lyric Handler content script - removes YouTube's native lyric popups
(function() {
  'use strict';

  // Selectors for YouTube's lyric popup elements
  const LYRIC_POPUP_SELECTORS = [
    'ytmusic-description-shelf-renderer',
    'ytmusic-message-renderer[message-key="LYRICS"]',
    '.description-shelf-content',
    'tp-yt-paper-dialog[aria-label*="Lyrics"]',
    'ytd-engagement-panel-section-list-renderer[target-id*="lyric"]'
  ];

  // Track removed elements to avoid processing them multiple times
  const removedElements = new WeakSet();

  // Check if settings allow hiding lyric popups
  function isHideLyricPopupEnabled() {
    if (window.jugitubeSettings && window.jugitubeSettings.hideLyricPopup) {
      return true;
    }
    return false;
  }

  // Remove lyric popup elements
  function removeLyricPopups() {
    if (!isHideLyricPopupEnabled()) {
      return;
    }

    for (const selector of LYRIC_POPUP_SELECTORS) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (!removedElements.has(element)) {
          try {
            // Mark as removed before actually removing
            removedElements.add(element);
            
            // Hide instead of remove to avoid layout shifts
            element.style.display = 'none';
            
            console.log('AnomTube: Hidden lyric popup element');
          } catch (error) {
            console.error('AnomTube: Error hiding lyric popup:', error);
          }
        }
      }
    }
  }

  // Set up MutationObserver to watch for lyric popups
  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      
      for (const mutation of mutations) {
        // Check if nodes were added
        if (mutation.addedNodes.length > 0) {
          shouldCheck = true;
          break;
        }
        
        // Check if attributes changed (popup might be shown/hidden via attributes)
        if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (target.nodeType === Node.ELEMENT_NODE) {
            for (const selector of LYRIC_POPUP_SELECTORS) {
              if (target.matches && target.matches(selector)) {
                shouldCheck = true;
                break;
              }
            }
          }
        }
      }

      if (shouldCheck) {
        removeLyricPopups();
      }
    });

    // Observe the entire document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden']
    });

    return observer;
  }

  // Handle settings changes
  function handleSettingsChange() {
    if (isHideLyricPopupEnabled()) {
      removeLyricPopups();
    } else {
      // Re-show hidden elements if setting is disabled
      const elements = document.querySelectorAll(LYRIC_POPUP_SELECTORS.join(', '));
      for (const element of elements) {
        if (element.style.display === 'none') {
          element.style.display = '';
        }
      }
    }
  }

  // Initialize lyric handler
  function init() {
    console.log('AnomTube: Lyric handler initialized');
    
    // Initial check
    setTimeout(removeLyricPopups, 500);
    
    // Set up observer
    setupObserver();
    
    // Periodic check as fallback
    setInterval(removeLyricPopups, 3000);
    
    // Listen for settings changes
    window.addEventListener('jugitube-settings-loaded', handleSettingsChange);
  }

  // Wait for settings to be loaded
  if (window.jugitubeSettings) {
    init();
  } else {
    window.addEventListener('jugitube-settings-loaded', init, { once: true });
  }
})();
