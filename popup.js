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
  const hideLyricsToggle = document.getElementById('hideLyricsToggle');
  const allowVideoToggle = document.getElementById('allowVideoToggle');
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
    const [{ enabled = false, muteAds = false, skipAds = false, blockAds = false, hideLyrics = false, allowVideo = false }, assets] = await Promise.all([
      chrome.storage.sync.get(['enabled', 'muteAds', 'skipAds', 'blockAds', 'hideLyrics', 'allowVideo']),
      chrome.storage.local.get(['customBackground', 'customLogo'])
    ]);

    toggle.checked = !!enabled;
    muteAdsToggle.checked = !!muteAds;
    skipAdsToggle.checked = !!skipAds;
    blockAdsToggle.checked = !!blockAds;
    hideLyricsToggle.checked = !!hideLyrics;
    allowVideoToggle.checked = !!allowVideo;
    updateStatus(!!enabled);

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

  async function handleSettingChange(key, value) {
    await chrome.storage.sync.set({ [key]: value });
    await notifyActiveTab({
      action: 'updateSettings',
      settings: { [key]: value }
    });
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

  hideLyricsToggle.addEventListener('change', (event) => {
    handleSettingChange('hideLyrics', event.target.checked);
  });

  allowVideoToggle.addEventListener('change', (event) => {
    handleSettingChange('allowVideo', event.target.checked);
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

  // New feature buttons
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const pipToggleBtn = document.getElementById('pipToggleBtn');
  const downloadToggleBtn = document.getElementById('downloadToggleBtn');
  const playlistToggleBtn = document.getElementById('playlistToggleBtn');

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', async () => {
      await notifyActiveTab({ action: 'toggleTheme' });
    });
  }

  if (pipToggleBtn) {
    pipToggleBtn.addEventListener('click', async () => {
      await notifyActiveTab({ action: 'togglePiP' });
    });
  }

  if (downloadToggleBtn) {
    downloadToggleBtn.addEventListener('click', async () => {
      await notifyActiveTab({ action: 'toggleDownload' });
    });
  }

  if (playlistToggleBtn) {
    playlistToggleBtn.addEventListener('click', async () => {
      await notifyActiveTab({ action: 'openPlaylistManager' });
    });
  }

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

      if (Object.prototype.hasOwnProperty.call(changes, 'hideLyrics')) {
        hideLyricsToggle.checked = !!changes.hideLyrics.newValue;
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'allowVideo')) {
        allowVideoToggle.checked = !!changes.allowVideo.newValue;
      }
    }
  });
});
