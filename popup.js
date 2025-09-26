// Popup script for JugiTube extension
document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('enableToggle');
  const status = document.getElementById('status');
  
  // Load saved state
  const result = await chrome.storage.sync.get(['enabled']);
  const isEnabled = result.enabled || false;
  
  toggle.checked = isEnabled;
  updateStatus(isEnabled);
  
  // Handle toggle change
  toggle.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    
    // Save state
    await chrome.storage.sync.set({ enabled });
    
    // Update status
    updateStatus(enabled);
    
    // Send message to content script
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url.includes('youtube.com')) {
        await chrome.tabs.sendMessage(tab.id, { 
          action: 'toggleJugiTube', 
          enabled 
        });
      }
    } catch (error) {
      console.log('Could not send message to content script:', error);
    }
  });
  
  function updateStatus(enabled) {
    if (enabled) {
      status.textContent = 'Extension is active';
      status.className = 'status active';
    } else {
      status.textContent = 'Extension is disabled';
      status.className = 'status inactive';
    }
  }
});
