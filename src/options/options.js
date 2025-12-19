// Options page JavaScript for AnomTube settings
// Ship intelligence, not excuses.
const SETTINGS_KEY = 'jugitube_settings_v1';

const widthUtils = window.jugitubeToolbarWidth;
const defaultSettings = {
  expandToolbar: false,
  toolbarWidth: widthUtils.DEFAULT_WIDTH,
  hideLyricPopup: false,
  allowVideoKeepAdSettings: false,
  autoClickSkips: false
};

// Load settings from localStorage
function loadSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const merged = { ...defaultSettings, ...JSON.parse(stored) };
      const normalizedWidth = widthUtils.normalizeToolbarWidth(
        merged.toolbarWidth ?? (merged.expandToolbar ? 280 : widthUtils.DEFAULT_WIDTH),
        widthUtils.DEFAULT_WIDTH
      );

      return {
        ...merged,
        toolbarWidth: normalizedWidth,
        expandToolbar: widthUtils.deriveExpandFlag(normalizedWidth)
      };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return { ...defaultSettings };
}

// Save settings to localStorage
function saveSettings(settings) {
  try {
    const toolbarWidth = widthUtils.normalizeToolbarWidth(settings.toolbarWidth, widthUtils.DEFAULT_WIDTH);
    const expandToolbar = widthUtils.deriveExpandFlag(toolbarWidth);
    const payload = { ...settings, toolbarWidth, expandToolbar };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    showSaveStatus();
    // Notify all tabs about settings change
    broadcastSettingsChange(payload);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Show save status message
function showSaveStatus() {
  const status = document.getElementById('saveStatus');
  status.classList.add('show');
  setTimeout(() => {
    status.classList.remove('show');
  }, 2000);
}

// Broadcast settings change to all tabs
function broadcastSettingsChange(settings) {
  // Use chrome.storage for cross-tab communication if available
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  }
  
  // Also use localStorage event for same-origin tabs
  window.dispatchEvent(new StorageEvent('storage', {
    key: SETTINGS_KEY,
    newValue: JSON.stringify(settings),
    url: window.location.href
  }));
}

// Initialize the options page
function initOptions() {
  const settings = loadSettings();

  // Set checkbox states
  document.getElementById('expandToolbar').checked = settings.expandToolbar;
  document.getElementById('hideLyricPopup').checked = settings.hideLyricPopup;
  document.getElementById('allowVideoKeepAdSettings').checked = settings.allowVideoKeepAdSettings;
  document.getElementById('autoClickSkips').checked = settings.autoClickSkips;

  // Initialize toolbar width slider
  const toolbarWidth = document.getElementById('toolbarWidth');
  const toolbarWidthValue = document.getElementById('toolbarWidthValue');
  const updateToolbarWidthLabel = (value) => {
    toolbarWidthValue.textContent = `${value} px`;
  };

  const normalizedWidth = widthUtils.normalizeToolbarWidth(settings.toolbarWidth, widthUtils.DEFAULT_WIDTH);
  toolbarWidth.value = normalizedWidth;
  updateToolbarWidthLabel(normalizedWidth);

  // Add event listeners
  const checkboxes = ['expandToolbar', 'hideLyricPopup', 'allowVideoKeepAdSettings', 'autoClickSkips'];
  checkboxes.forEach(id => {
    const checkbox = document.getElementById(id);
    checkbox.addEventListener('change', () => {
      const settings = loadSettings();
      if (id === 'expandToolbar') {
        const targetWidth = checkbox.checked
          ? Math.max(settings.toolbarWidth, widthUtils.EXPAND_THRESHOLD + 20)
          : widthUtils.DEFAULT_WIDTH;
        const normalized = widthUtils.normalizeToolbarWidth(targetWidth, widthUtils.DEFAULT_WIDTH);
        settings.toolbarWidth = normalized;
        toolbarWidth.value = normalized;
        updateToolbarWidthLabel(normalized);
      }
      settings[id] = checkbox.checked;
      saveSettings(settings);
    });
  });

  // Persist toolbar width with lightweight debouncing
  let toolbarWidthTimeout;
  toolbarWidth.addEventListener('input', (event) => {
    const width = widthUtils.normalizeToolbarWidth(event.target.value, widthUtils.DEFAULT_WIDTH);
    updateToolbarWidthLabel(width);
  });

  toolbarWidth.addEventListener('change', (event) => {
    const width = widthUtils.normalizeToolbarWidth(event.target.value, widthUtils.DEFAULT_WIDTH);
    updateToolbarWidthLabel(width);

    clearTimeout(toolbarWidthTimeout);
    toolbarWidthTimeout = setTimeout(() => {
      const settings = loadSettings();
      settings.toolbarWidth = width;
      saveSettings(settings);
    }, 120);
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOptions);
} else {
  initOptions();
}
