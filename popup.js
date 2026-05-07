// Popup script for AnomTube extension
// Engineered for autonomy, designed for humans.
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
  const themeToggle = document.getElementById('themeToggle');
  const addBookmarkBtn = document.getElementById('addBookmarkBtn');
  const togglePipBtn = document.getElementById('togglePipBtn');
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
    if (!previewEl) return;
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

  function setChecked(element, value) {
    if (element) element.checked = !!value;
  }

  function bindChange(element, handler) {
    if (!element) return;
    element.addEventListener('change', handler);
  }

  function bindClick(element, handler) {
    if (!element) return;
    element.addEventListener('click', handler);
  }

  async function loadState() {
    const [{ enabled = false, muteAds = false, skipAds = false, blockAds = false, hideLyrics = false, allowVideo = false, theme = 'dark', autoClickSkipAds = false, allowVideoKeepAdSettings = false, hidePopupCompletely = false, expandToolbar = true }, assets] = await Promise.all([
      chrome.storage.sync.get(['enabled', 'muteAds', 'skipAds', 'blockAds', 'hideLyrics', 'allowVideo', 'theme', 'autoClickSkipAds', 'allowVideoKeepAdSettings', 'hidePopupCompletely', 'expandToolbar']),
      chrome.storage.local.get(['customBackground', 'customLogo'])
    ]);

    setChecked(toggle, enabled);
    setChecked(muteAdsToggle, muteAds);
    setChecked(skipAdsToggle, skipAds);
    setChecked(blockAdsToggle, blockAds);
    setChecked(hideLyricsToggle, hideLyrics);
    setChecked(allowVideoToggle, allowVideo);
    setChecked(themeToggle, theme === 'light');
    setChecked(autoClickSkipAdsToggle, autoClickSkipAds);
    setChecked(allowVideoKeepAdSettingsToggle, allowVideoKeepAdSettings);
    setChecked(hidePopupCompletelyToggle, hidePopupCompletely);
    setChecked(expandToolbarToggle, expandToolbar);
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
    if (!inputEl || !previewEl) return;
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
    if (!buttonEl || !inputEl) return;
    buttonEl.addEventListener('click', (event) => {
      event.preventDefault();
      inputEl.click();
    });
  }

  function bindResetButton(buttonEl, storageKey, previewEl, options = {}) {
    if (!buttonEl || !previewEl) return;
    buttonEl.addEventListener('click', async (event) => {
      event.preventDefault();
      await storeAsset(storageKey, null);
      updatePreview(previewEl, null, options);
    });
  }

  // Load saved state and previews
  await loadState();

  // Handle toggle change
  bindChange(toggle, async (event) => {
    const enabled = event.target.checked;

    await chrome.storage.sync.set({ enabled });
    updateStatus(enabled);
    await notifyActiveTab({
      action: 'toggleAnomTube',
      enabled
    });
  });

  function buildSettingsPayload(extra = {}) {
    return {
      muteAds: !!muteAdsToggle?.checked,
      skipAds: !!skipAdsToggle?.checked,
      blockAds: !!blockAdsToggle?.checked,
      hideLyrics: !!hideLyricsToggle?.checked,
      allowVideo: !!allowVideoToggle?.checked,
      autoClickSkipAds: !!autoClickSkipAdsToggle?.checked,
      allowVideoKeepAdSettings: !!allowVideoKeepAdSettingsToggle?.checked,
      hidePopupCompletely: !!hidePopupCompletelyToggle?.checked,
      expandToolbar: expandToolbarToggle ? !!expandToolbarToggle.checked : true,
      ...extra
    };
  }

  async function handleSettingChange(key, value) {
    await chrome.storage.sync.set({ [key]: value });
    await notifyActiveTab({
      action: 'updateSettings',
      settings: buildSettingsPayload({ [key]: value })
    });
  }

  bindChange(muteAdsToggle, (event) => handleSettingChange('muteAds', event.target.checked));
  bindChange(skipAdsToggle, (event) => handleSettingChange('skipAds', event.target.checked));
  bindChange(blockAdsToggle, (event) => handleSettingChange('blockAds', event.target.checked));
  bindChange(autoClickSkipAdsToggle, (event) => handleSettingChange('autoClickSkipAds', event.target.checked));
  bindChange(allowVideoKeepAdSettingsToggle, (event) => handleSettingChange('allowVideoKeepAdSettings', event.target.checked));
  bindChange(hidePopupCompletelyToggle, (event) => handleSettingChange('hidePopupCompletely', event.target.checked));
  bindChange(expandToolbarToggle, (event) => handleSettingChange('expandToolbar', event.target.checked));
  bindChange(hideLyricsToggle, (event) => handleSettingChange('hideLyrics', event.target.checked));
  bindChange(allowVideoToggle, (event) => handleSettingChange('allowVideo', event.target.checked));

  // Theme toggle handler
  bindChange(themeToggle, async (event) => {
    const theme = event.target.checked ? 'light' : 'dark';
    await chrome.storage.sync.set({ theme });
    await notifyActiveTab({
      action: 'updateSettings',
      settings: { theme }
    });
  });

  // Add bookmark button
  bindClick(addBookmarkBtn, async () => {
    await notifyActiveTab({
      action: 'addBookmark'
    });
  });

  // Toggle PiP button
  bindClick(togglePipBtn, async () => {
    await notifyActiveTab({
      action: 'togglePip'
    });
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
      await notifyActiveTab({ action: 'openDownloadMenu' });
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
        setChecked(toggle, enabled);
        updateStatus(enabled);
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'muteAds')) {
        setChecked(muteAdsToggle, changes.muteAds.newValue);
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'skipAds')) {
        setChecked(skipAdsToggle, changes.skipAds.newValue);
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'blockAds')) {
        setChecked(blockAdsToggle, changes.blockAds.newValue);
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'hideLyrics')) {
        setChecked(hideLyricsToggle, changes.hideLyrics.newValue);
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'allowVideo')) {
        setChecked(allowVideoToggle, changes.allowVideo.newValue);
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'theme')) {
        setChecked(themeToggle, changes.theme.newValue === 'light');
      }
    }
  });
});
