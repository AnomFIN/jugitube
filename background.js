// Background script for JugiTube extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('JugiTube extension installed');
  
  // Set default enabled state
  chrome.storage.sync.set({ enabled: false });
});

// Listen for tab updates to inject scripts when YouTube pages load
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
    try {
      // Check if extension is enabled
      const result = await chrome.storage.sync.get(['enabled']);
      if (result.enabled) {
        // Inject content script if not already injected
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
      }
    } catch (error) {
      console.log('Could not inject content script:', error);
    }
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getLyrics') {
    // This would typically call a lyrics API
    // For now, we'll return mock lyrics
    const mockLyrics = generateMockLyrics(request.title, request.artist);
    sendResponse({ lyrics: mockLyrics });
    return true; // Keep message channel open for async response
  }
});

function generateMockLyrics(title, artist) {
  // Mock lyrics data with timestamps (in seconds)
  return [
    { time: 0, text: "♪ Loading lyrics..." },
    { time: 5, text: "♪ This is a sample lyric line" },
    { time: 10, text: "♪ Karaoke style lyrics display" },
    { time: 15, text: "♪ Synchronized with the music" },
    { time: 20, text: "♪ For " + (title || "this song") },
    { time: 25, text: "♪ By " + (artist || "unknown artist") },
    { time: 30, text: "♪ Enjoy your audio experience!" }
  ];
}