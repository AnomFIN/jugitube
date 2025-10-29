// Popup script for AnomTube extension
document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('enableToggle');
  const status = document.getElementById('status');
  const backgroundInput = document.getElementById('backgroundInput');
  const logoInput = document.getElementById('logoInput');
  const backgroundPreview = document.getElementById('backgroundPreview');
  const logoPreview = document.getElementById('logoPreview');
  const backgroundSelect = document.getElementById('backgroundSelect');
  const logoSelect = document.getElementById('logoSelect');
  const backgroundReset = document.getElementById('backgroundReset');
  const logoReset = document.getElementById('logoReset');
  const muteAdsToggle = document.getElementById('muteAdsToggle');
  const skipAdsToggle = document.getElementById('skipAdsToggle');
  const blockAdsToggle = document.getElementById('blockAdsToggle');
  const autoClickSkipAdsToggle = document.getElementById('autoClickSkipAdsToggle');
  const allowVideoKeepAdSettingsToggle = document.getElementById('allowVideoKeepAdSettingsToggle');
  const hidePopupCompletelyToggle = document.getElementById('hidePopupCompletelyToggle');
  const expandToolbarToggle = document.getElementById('expandToolbarToggle');
  const defaultLogoUrl = chrome.runtime.getURL('logo.png');

  function updateStatus(enabled) {
    if (enabled) {
      status.textContent = 'Extension is active';
      status.className = 'status active';
    } else {
      status.textContent = 'Extension is disabled';
      status.className = 'status inactive';
    }
  }

  function updatePreview(previewEl, dataUrl, { fallbackUrl = null, emptyLabel = 'Ei kuvaa' } = {}) {
    const url = dataUrl || fallbackUrl;
    if (url) {
      previewEl.style.backgroundImage = `url("${url}")`;
      previewEl.classList.remove('empty');
      previewEl.textContent = '';
    } else {
      previewEl.style.backgroundImage = 'none';
      if (!previewEl.classList.contains('empty')) {
        previewEl.classList.add('empty');
      }
      previewEl.textContent = emptyLabel;
    }
  }

  async function notifyActiveTab(message) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && tab.url.includes('youtube.com')) {
        await chrome.tabs.sendMessage(tab.id, message);
      }
    } catch (error) {
      console.log('Could not send message to content script:', error);
    }
  }

  async function loadState() {
    const [syncSettings, assets] = await Promise.all([
      chrome.storage.sync.get([
        'enabled', 
        'muteAds', 
        'skipAds', 
        'blockAds',
        'autoClickSkipAds',
        'allowVideoKeepAdSettings',
        'hidePopupCompletely',
        'expandToolbar'
      ]),
      chrome.storage.local.get(['customBackground', 'customLogo'])
    ]);

    toggle.checked = !!syncSettings.enabled;
    muteAdsToggle.checked = !!syncSettings.muteAds;
    skipAdsToggle.checked = !!syncSettings.skipAds;
    blockAdsToggle.checked = !!syncSettings.blockAds;
    autoClickSkipAdsToggle.checked = !!syncSettings.autoClickSkipAds;
    allowVideoKeepAdSettingsToggle.checked = !!syncSettings.allowVideoKeepAdSettings;
    hidePopupCompletelyToggle.checked = !!syncSettings.hidePopupCompletely;
    expandToolbarToggle.checked = syncSettings.expandToolbar !== false; // Default true
    updateStatus(!!syncSettings.enabled);

    updatePreview(backgroundPreview, assets.customBackground || null, {
      fallbackUrl: null,
      emptyLabel: 'Ei kuvaa'
    });

    updatePreview(logoPreview, assets.customLogo || null, {
      fallbackUrl: defaultLogoUrl,
      emptyLabel: 'Ei kuvaa'
    });
  }

  async function storeAsset(key, value) {
    if (value) {
      await chrome.storage.local.set({ [key]: value });
    } else {
      await chrome.storage.local.remove(key);
    }
  }

  function bindFileInput(inputEl, storageKey, previewEl, options = {}) {
    inputEl.addEventListener('change', () => {
      const file = inputEl.files && inputEl.files[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        await storeAsset(storageKey, dataUrl);
        updatePreview(previewEl, dataUrl, options);
        inputEl.value = '';
      };
      reader.readAsDataURL(file);
    });
  }

  function bindSelectButton(buttonEl, inputEl) {
    buttonEl.addEventListener('click', (event) => {
      event.preventDefault();
      inputEl.click();
    });
  }

  function bindResetButton(buttonEl, storageKey, previewEl, options = {}) {
    buttonEl.addEventListener('click', async (event) => {
      event.preventDefault();
      await storeAsset(storageKey, null);
      updatePreview(previewEl, null, options);
    });
  }

  // Load saved state and previews
  await loadState();

  // Handle toggle change
  toggle.addEventListener('change', async (e) => {
    const enabled = e.target.checked;

    await chrome.storage.sync.set({ enabled });
    updateStatus(enabled);
    await notifyActiveTab({
      action: 'toggleAnomTube',
      enabled
    });
  });

  function buildAdPreferencePayload() {
    return {
      action: 'updateSettings',
      settings: {
        muteAds: !!muteAdsToggle.checked,
        skipAds: !!skipAdsToggle.checked,
        blockAds: !!blockAdsToggle.checked,
        autoClickSkipAds: !!autoClickSkipAdsToggle.checked,
        allowVideoKeepAdSettings: !!allowVideoKeepAdSettingsToggle.checked,
        hidePopupCompletely: !!hidePopupCompletelyToggle.checked,
        expandToolbar: !!expandToolbarToggle.checked
      }
    };
  }

  async function handleSettingChange(key, value) {
    await chrome.storage.sync.set({ [key]: value });
    await notifyActiveTab(buildAdPreferencePayload());
  }

  muteAdsToggle.addEventListener('change', (event) => {
    handleSettingChange('muteAds', event.target.checked);
  });

  skipAdsToggle.addEventListener('change', (event) => {
    handleSettingChange('skipAds', event.target.checked);
  });

  blockAdsToggle.addEventListener('change', (event) => {
    handleSettingChange('blockAds', event.target.checked);
  });

  autoClickSkipAdsToggle.addEventListener('change', (event) => {
    handleSettingChange('autoClickSkipAds', event.target.checked);
  });

  allowVideoKeepAdSettingsToggle.addEventListener('change', (event) => {
    handleSettingChange('allowVideoKeepAdSettings', event.target.checked);
  });

  hidePopupCompletelyToggle.addEventListener('change', (event) => {
    handleSettingChange('hidePopupCompletely', event.target.checked);
  });

  expandToolbarToggle.addEventListener('change', (event) => {
    handleSettingChange('expandToolbar', event.target.checked);
  });

  bindFileInput(backgroundInput, 'customBackground', backgroundPreview, {
    fallbackUrl: null,
    emptyLabel: 'Ei kuvaa'
  });
  bindFileInput(logoInput, 'customLogo', logoPreview, {
    fallbackUrl: defaultLogoUrl,
    emptyLabel: 'Ei kuvaa'
  });

  bindSelectButton(backgroundSelect, backgroundInput);
  bindSelectButton(logoSelect, logoInput);

  bindResetButton(backgroundReset, 'customBackground', backgroundPreview, {
    fallbackUrl: null,
    emptyLabel: 'Ei kuvaa'
  });
  bindResetButton(logoReset, 'customLogo', logoPreview, {
    fallbackUrl: defaultLogoUrl,
    emptyLabel: 'Ei kuvaa'
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (Object.prototype.hasOwnProperty.call(changes, 'customBackground')) {
        updatePreview(backgroundPreview, changes.customBackground.newValue || null, {
          fallbackUrl: null,
          emptyLabel: 'Ei kuvaa'
        });
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'customLogo')) {
        updatePreview(logoPreview, changes.customLogo.newValue || null, {
          fallbackUrl: defaultLogoUrl,
          emptyLabel: 'Ei kuvaa'
        });
      }
    }

    if (areaName === 'sync') {
      if (Object.prototype.hasOwnProperty.call(changes, 'enabled')) {
        const enabled = !!changes.enabled.newValue;
        toggle.checked = enabled;
        updateStatus(enabled);
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'muteAds')) {
        muteAdsToggle.checked = !!changes.muteAds.newValue;
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'skipAds')) {
        skipAdsToggle.checked = !!changes.skipAds.newValue;
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'blockAds')) {
        blockAdsToggle.checked = !!changes.blockAds.newValue;
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'autoClickSkipAds')) {
        autoClickSkipAdsToggle.checked = !!changes.autoClickSkipAds.newValue;
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'allowVideoKeepAdSettings')) {
        allowVideoKeepAdSettingsToggle.checked = !!changes.allowVideoKeepAdSettings.newValue;
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'hidePopupCompletely')) {
        hidePopupCompletelyToggle.checked = !!changes.hidePopupCompletely.newValue;
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'expandToolbar')) {
        expandToolbarToggle.checked = changes.expandToolbar.newValue !== false;
      }
    }
  });
});
