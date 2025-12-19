// Ad Skipper content script - automatically clicks skip buttons with rate limiting
(function() {
  'use strict';

  // Configuration
  const SKIP_BUTTON_SELECTORS = [
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-skip-ad-button',
    'button.ytp-ad-skip-button-container',
    '.videoAdUiSkipButton'
  ];

  const BANNER_AD_SELECTORS = [
    '.ytp-ad-overlay-close-button',
    '.ytp-ad-overlay-close-container button'
  ];

  // Rate limiting configuration
  const RATE_LIMIT = {
    maxClicks: 3,
    windowMs: 1000,
    clicks: [],
    canClick() {
      const now = Date.now();
      // Remove old clicks outside the time window
      this.clicks = this.clicks.filter(time => now - time < this.windowMs);
      
      if (this.clicks.length >= this.maxClicks) {
        return false;
      }
      
      this.clicks.push(now);
      return true;
    }
  };

  // Track processed elements to avoid duplicate clicks
  const processedElements = new WeakSet();

  // Check if settings allow auto-skip
  function isAutoSkipEnabled() {
    if (window.jugitubeSettings && window.jugitubeSettings.autoClickSkips) {
      return true;
    }
    return false;
  }

  // Safe click implementation
  function safeClick(element) {
    if (!element || processedElements.has(element)) {
      return false;
    }

    if (!RATE_LIMIT.canClick()) {
      console.log('AnomTube: Rate limit reached for ad skipping');
      return false;
    }

    try {
      // Mark element as processed
      processedElements.add(element);

      // Try multiple click methods for compatibility
      if (element.click) {
        element.click();
      } else {
        element.dispatchEvent(new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        }));
      }

      console.log('AnomTube: Successfully clicked skip button');
      return true;
    } catch (error) {
      console.error('AnomTube: Error clicking skip button:', error);
      return false;
    }
  }

  // Find and click skip buttons
  function trySkipAds() {
    if (!isAutoSkipEnabled()) {
      return;
    }

    // Try to click skip buttons
    for (const selector of SKIP_BUTTON_SELECTORS) {
      const buttons = document.querySelectorAll(selector);
      for (const button of buttons) {
        if (button.offsetParent !== null && !processedElements.has(button)) {
          // Check if button is visible and clickable
          const rect = button.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            safeClick(button);
          }
        }
      }
    }

    // Try to close banner ads
    for (const selector of BANNER_AD_SELECTORS) {
      const buttons = document.querySelectorAll(selector);
      for (const button of buttons) {
        if (button.offsetParent !== null && !processedElements.has(button)) {
          const rect = button.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            safeClick(button);
          }
        }
      }
    }
  }

  // Set up MutationObserver to watch for ad buttons
  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      // Check if any mutations added nodes
      let shouldCheck = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldCheck = true;
          break;
        }
      }

      if (shouldCheck) {
        trySkipAds();
      }
    });

    // Observe the entire document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  // Initialize ad skipper
  function init() {
    console.log('AnomTube: Ad skipper initialized');
    
    // Initial check
    setTimeout(trySkipAds, 1000);
    
    // Set up observer
    setupObserver();
    
    // Periodic check as fallback
    setInterval(trySkipAds, 2000);
  }

  // Wait for settings to be loaded
  if (window.jugitubeSettings) {
    init();
  } else {
    window.addEventListener('jugitube-settings-loaded', init, { once: true });
  }
})();
