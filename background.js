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
    handleLyricsRequest(request)
      .then((lyricsResponse) => {
        sendResponse(lyricsResponse);
      })
      .catch((error) => {
        console.error('Failed to fetch lyrics:', error);
        sendResponse({ lyrics: [], error: 'Lyrics not available right now.' });
      });

    return true; // Keep the channel open for the async response
  }
});

async function handleLyricsRequest({ title, artist }) {
  const cleanTitle = sanitizeTitle(title);
  const cleanArtist = sanitizeArtist(artist);

  const lyricsText = await fetchLyricsFromProviders(cleanTitle, cleanArtist);

  if (!lyricsText) {
    return {
      lyrics: [],
      error: 'No lyrics could be located for this track.'
    };
  }

  const parsedLyrics = Array.isArray(lyricsText)
    ? lyricsText
    : parseLyricsText(lyricsText);

  return {
    lyrics: parsedLyrics
  };
}

async function fetchLyricsFromProviders(title, artist) {
  const providers = [
    () => fetchFromLrclib(title, artist),
    () => fetchFromLrclibSearch(title, artist),
    () => fetchFromSomeRandomApi(title, artist),
    () => fetchFromLyricsOvh(title, artist)
  ];

  for (const provider of providers) {
    try {
      const result = await provider();
      if (result && ((Array.isArray(result) && result.length) || (typeof result === 'string' && result.trim()))) {
        return result;
      }
    } catch (error) {
      console.warn('Lyrics provider failed:', error);
    }
  }

  return null;
}

async function fetchFromLrclib(title, artist) {
  if (!title && !artist) {
    return null;
  }

  const params = new URLSearchParams();
  if (title) params.append('track_name', title);
  if (artist) params.append('artist_name', artist);

  const response = await fetch(`https://lrclib.net/api/get?${params.toString()}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`LRCLib request failed with status ${response.status}`);
  }

  const data = await response.json();
  const resolved = extractLyricsFromLrclibItem(data);
  if (resolved) {
    return resolved;
  }

  if (data && typeof data.id !== 'undefined') {
    return fetchFromLrclibById(data.id);
  }

  return null;
}

async function fetchFromLrclibSearch(title, artist) {
  if (!title && !artist) {
    return null;
  }

  const params = new URLSearchParams();
  if (title) params.append('track_name', title);
  if (artist) params.append('artist_name', artist);
  params.append('limit', '5');

  const response = await fetch(`https://lrclib.net/api/search?${params.toString()}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`LRCLib search failed with status ${response.status}`);
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  for (const item of results) {
    const resolved = extractLyricsFromLrclibItem(item);
    if (resolved) {
      return resolved;
    }
  }

  for (const item of results) {
    if (item && typeof item.id !== 'undefined') {
      const resolved = await fetchFromLrclibById(item.id);
      if (resolved) {
        return resolved;
      }
    }
  }

  return null;
}

async function fetchFromLrclibById(id) {
  if (!id) {
    return null;
  }

  const response = await fetch(`https://lrclib.net/api/get?id=${encodeURIComponent(id)}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`LRCLib by id request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return extractLyricsFromLrclibItem(payload);
}

async function fetchFromLyricsOvh(title, artist) {
  if (!title || !artist) {
    return null;
  }

  const requestArtist = artist;
  const requestTitle = title;
  const encodedArtist = encodeURIComponent(requestArtist);
  const encodedTitle = encodeURIComponent(requestTitle);
  const endpoint = `https://api.lyrics.ovh/v1/${encodedArtist}/${encodedTitle}`;

  const response = await fetch(endpoint);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Lyrics.ovh request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.lyrics || null;
}

async function fetchFromSomeRandomApi(title, artist) {
  if (!title) {
    return null;
  }

  const queryParts = [];
  if (artist) {
    queryParts.push(artist);
  }
  queryParts.push(title);

  const endpoint = `https://some-random-api.ml/lyrics?title=${encodeURIComponent(queryParts.join(' - '))}`;
  const response = await fetch(endpoint);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`SomeRandomAPI lyrics request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (data && typeof data.lyrics === 'string' && data.lyrics.trim().length > 0) {
    return data.lyrics;
  }

  return null;
}

function extractLyricsFromLrclibItem(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  if (typeof item.syncedLyrics === 'string' && item.syncedLyrics.trim().length > 0) {
    const parsed = parseSyncedLyrics(item.syncedLyrics);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  }

  if (typeof item.plainLyrics === 'string' && item.plainLyrics.trim().length > 0) {
    return item.plainLyrics;
  }

  return null;
}

function parseSyncedLyrics(lrcText) {
  const lines = [];
  const regex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?\](.*)/g;

  lrcText.split(/\r?\n/).forEach((line) => {
    let match;
    while ((match = regex.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const hundredths = match[3] ? parseInt(match[3], 10) : 0;
      const totalSeconds = minutes * 60 + seconds + hundredths / 100;
      const text = match[4].trim();
      if (text) {
        lines.push({ time: totalSeconds, text });
      }
    }
  });

  lines.sort((a, b) => a.time - b.time);
  return lines;
}

function parseLyricsText(lyricsText) {
  return lyricsText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => ({
      time: index * 4,
      text: line
    }));
}

function sanitizeTitle(title) {
  if (!title) return '';
  return title
    .replace(/\(official.*?\)/gi, '')
    .replace(/\(feat\.?[^)]*\)/gi, '')
    .replace(/\(ft\.?[^)]*\)/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/feat\.?\s+[^-]+/gi, '')
    .replace(/ft\.?\s+[^-]+/gi, '')
    .replace(/official\s+music\s+video/gi, '')
    .replace(/official\s+video/gi, '')
    .replace(/visualizer/gi, '')
    .replace(/lyrics?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeArtist(artist) {
  if (!artist || artist.toLowerCase().includes('unknown')) {
    return '';
  }

  return artist
    .replace(/\s+-\s+Topic$/i, '')
    .replace(/\s+VEVO$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}
