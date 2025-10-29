// adSkipper.js - Modular ad skipper with rate limiting and safe click
// Uses MutationObserver to detect and skip YouTube ads

(function() {
  'use strict';

  // Configuration
  const PER_ELEMENT_LIMIT = 3;
  const MIN_INTERVAL_MS = 1000;
  const DEV_LOGGING = true;

  // Selectors for skip buttons
  const SKIP_SELECTORS = [
    'button.ytp-ad-skip-button',
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    'button.ytp-ad-skip-button-modern',
    '.adskip-button',
    'button.skip-ad',
    '.ytp-ad-skip-button-container button',
    '.video-ads .ytp-ad-skip-button'
  ];

  // Track click attempts per element
  const clickAttempts = new WeakMap();
  let lastClickTime = 0;

  // Log function for development
  function devLog(...args) {
    if (DEV_LOGGING) {
      console.log('[JugiTube AdSkipper]', ...args);
    }
  }

  // Check if element is visible
  function isElementVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }
    
    // Check if element has offsetParent (common visibility check)
    if (element.offsetParent === null) {
      return false;
    }
    
    return true;
  }

  // Safe click with fallback events
  function safeClick(element) {
    if (!element) return false;
    
    try {
      // Try native click first
      if (typeof element.click === 'function') {
        element.click();
        devLog('Clicked element using native click():', element);
        return true;
      }
      
      // Fallback: dispatch click event
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1
      });
      element.dispatchEvent(clickEvent);
      devLog('Clicked element using MouseEvent:', element);
      return true;
    } catch (error) {
      devLog('Click failed:', error);
      return false;
    }
  }

  // Check if we should skip this click due to rate limiting
  function shouldSkipClick(element) {
    const now = Date.now();
    
    // Global rate limit check
    if (now - lastClickTime < MIN_INTERVAL_MS) {
      devLog('Skipping click due to global rate limit');
      return true;
    }
    
    // Per-element limit check
    const attempts = clickAttempts.get(element) || 0;
    if (attempts >= PER_ELEMENT_LIMIT) {
      devLog('Skipping click - element limit reached:', element);
      return true;
    }
    
    return false;
  }

  // Record click attempt
  function recordClickAttempt(element) {
    const attempts = clickAttempts.get(element) || 0;
    clickAttempts.set(element, attempts + 1);
    lastClickTime = Date.now();
  }

  // Try to skip ads
  function trySkipAds() {
    // Check if settings allow auto-clicking
    if (window.jugitubeSettings && !window.jugitubeSettings.autoClickSkips) {
      return;
    }

    for (const selector of SKIP_SELECTORS) {
      const buttons = document.querySelectorAll(selector);
      
      for (const button of buttons) {
        if (!isElementVisible(button)) {
          continue;
        }
        
        if (shouldSkipClick(button)) {
          continue;
        }
        
        if (safeClick(button)) {
          recordClickAttempt(button);
          devLog('Successfully clicked skip button');
          // Only click one button per cycle
          return;
        }
      }
    }
  }

  // Also handle overlay ads
  function removeOverlayAds() {
    const overlaySelectors = [
      '.ytp-ad-overlay-close-button',
      '.ytp-ad-overlay-close-button-modern',
      '.ytp-ad-image-overlay',
      '.ytp-ad-overlay-slot'
    ];

    for (const selector of overlaySelectors) {
      const elements = document.querySelectorAll(selector);
      
      for (const element of elements) {
        if (isElementVisible(element)) {
          if (element.classList.contains('ytp-ad-overlay-close-button') || 
              element.classList.contains('ytp-ad-overlay-close-button-modern')) {
            safeClick(element);
            devLog('Clicked overlay close button');
          } else {
            element.remove();
            devLog('Removed overlay ad element');
          }
        }
      }
    }
  }

  // Main ad processing function
  function processAds() {
    trySkipAds();
    removeOverlayAds();
  }

  // Initialize ad skipper
  function init() {
    devLog('Initializing ad skipper...');

    // Wait for settings to be loaded
    if (!window.jugitubeSettings) {
      window.addEventListener('jugitube-settings-loaded', () => {
        devLog('Settings loaded, starting ad skipper');
        startSkipping();
      });
    } else {
      startSkipping();
    }
  }

  function startSkipping() {
    // Check if auto-click is enabled
    if (window.jugitubeSettings && !window.jugitubeSettings.autoClickSkips) {
      devLog('Auto-click skips disabled in settings');
      return;
    }

    // Use MutationObserver to detect ad elements
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          // Check if any added nodes might be ad-related
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node;
              
              // Check if this is a skip button or contains one
              for (const selector of SKIP_SELECTORS) {
                if (element.matches && element.matches(selector)) {
                  processAds();
                  break;
                } else if (element.querySelector && element.querySelector(selector)) {
                  processAds();
                  break;
                }
              }
            }
          }
        }
      }
    });

    // Observe the entire document for ad elements
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also run periodically as a fallback
    setInterval(processAds, 1500);
    
    // Run immediately
    processAds();
    
    devLog('Ad skipper started');
  }

  // Export for testing
  window.jugitubeAdSkipper = {
    trySkipAds,
    removeOverlayAds,
    isElementVisible,
    safeClick
  };

  // Initialize
  init();
})();
