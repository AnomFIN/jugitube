// Options page JavaScript for AnomTube settings
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
    console.error('Error loading settings:', error);
  }
  return defaultSettings;
}

// Save settings to localStorage
function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    showSaveStatus();
    // Notify all tabs about settings change
    broadcastSettingsChange(settings);
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
  
  // Add event listeners
  const checkboxes = ['expandToolbar', 'hideLyricPopup', 'allowVideoKeepAdSettings', 'autoClickSkips'];
  checkboxes.forEach(id => {
    const checkbox = document.getElementById(id);
    checkbox.addEventListener('change', () => {
      const settings = loadSettings();
      settings[id] = checkbox.checked;
      saveSettings(settings);
    });
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOptions);
} else {
  initOptions();
}
