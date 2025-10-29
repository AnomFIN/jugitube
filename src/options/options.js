// Options page script for JugiTube extension
// Manages settings stored in localStorage 'jugitube_settings_v1'

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
    console.error('Failed to load settings:', error);
  }
  return { ...DEFAULT_SETTINGS };
}

// Save settings to localStorage
function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
}

// Show status message
function showStatusMessage() {
  const statusMessage = document.getElementById('statusMessage');
  statusMessage.classList.add('visible', 'success');
  
  setTimeout(() => {
    statusMessage.classList.remove('visible');
  }, 2000);
}

// Initialize the options page
function init() {
  const settings = loadSettings();
  
  // Set checkbox states from loaded settings
  const expandToolbarCheckbox = document.getElementById('expandToolbar');
  const hideLyricPopupCheckbox = document.getElementById('hideLyricPopup');
  const allowVideoKeepAdSettingsCheckbox = document.getElementById('allowVideoKeepAdSettings');
  const autoClickSkipsCheckbox = document.getElementById('autoClickSkips');
  
  if (expandToolbarCheckbox) {
    expandToolbarCheckbox.checked = settings.expandToolbar;
  }
  
  if (hideLyricPopupCheckbox) {
    hideLyricPopupCheckbox.checked = settings.hideLyricPopup;
  }
  
  if (allowVideoKeepAdSettingsCheckbox) {
    allowVideoKeepAdSettingsCheckbox.checked = settings.allowVideoKeepAdSettings;
  }
  
  if (autoClickSkipsCheckbox) {
    autoClickSkipsCheckbox.checked = settings.autoClickSkips;
  }
  
  // Add event listeners for changes
  const checkboxes = [
    expandToolbarCheckbox,
    hideLyricPopupCheckbox,
    allowVideoKeepAdSettingsCheckbox,
    autoClickSkipsCheckbox
  ];
  
  checkboxes.forEach(checkbox => {
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        const currentSettings = loadSettings();
        currentSettings[checkbox.id] = checkbox.checked;
        
        if (saveSettings(currentSettings)) {
          showStatusMessage();
          
          // Notify content scripts about the change
          // This will be picked up by settings-apply.js via storage events
          window.dispatchEvent(new CustomEvent('jugitube-settings-changed', {
            detail: currentSettings
          }));
        }
      });
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
