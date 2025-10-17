// Popup script for JugiTube extension
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
  const defaultLogoUrl = chrome.runtime.getURL('logo_ANOMFIN_AUTOMATED_AI.png');

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

  async function loadState() {
    const [{ enabled = false }, assets] = await Promise.all([
      chrome.storage.sync.get(['enabled']),
      chrome.storage.local.get(['customBackground', 'customLogo'])
    ]);

    toggle.checked = !!enabled;
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

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && tab.url.includes('youtube.com')) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'toggleJugiTube',
          enabled
        });
      }
    } catch (error) {
      console.log('Could not send message to content script:', error);
    }
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
    if (areaName !== 'local') {
      return;
    }

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
  });
});
