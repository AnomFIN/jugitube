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

async function handleLyricsRequest({ title, artist, manualRetry = false, retryLevel = 0 }) {
  const cleanTitle = sanitizeTitle(title);
  const cleanArtist = sanitizeArtist(artist);

  const lyricsText = await fetchLyricsFromProviders(cleanTitle, cleanArtist, {
    manualRetry: Boolean(manualRetry),
    retryLevel: Number.isFinite(retryLevel) ? retryLevel : 0
  });

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

async function fetchLyricsFromProviders(title, artist, options = {}) {
  const { manualRetry = false, retryLevel = 0 } = options;

  const searchCombos = buildSearchCombos(title, artist, {
    manualRetry: Boolean(manualRetry),
    retryLevel: Number.isFinite(retryLevel) ? retryLevel : 0
  });

  const providers = [];

  for (const combo of searchCombos) {
    providers.push(() => fetchFromLrclib(combo.title, combo.artist));
    providers.push(() => fetchFromLrclibSearch(combo.title, combo.artist));
    providers.push(() => fetchFromSomeRandomApi(combo.title, combo.artist));
    if (combo.artist) {
      providers.push(() => fetchFromLyricsOvh(combo.title, combo.artist));
    }
  }

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
    return await fetchFromLrclibById(data.id);
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

function loosenTitle(value) {
  if (!value) {
    return '';
  }

  return value
    .replace(/\([^)]*remix[^)]*\)/gi, '')
    .replace(/\([^)]*edit[^)]*\)/gi, '')
    .replace(/\([^)]*version[^)]*\)/gi, '')
    .replace(/\([^)]*live[^)]*\)/gi, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\b(?:remix|edit|version|karaoke)\b/gi, '')
    .replace(/[^a-z0-9äöå\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function loosenArtist(value) {
  if (!value) {
    return '';
  }

  return value
    .replace(/\(.*?\)/g, '')
    .replace(/\b(?:feat\.?|ft\.?|vs\.?|x)\b.*$/gi, '')
    .replace(/[^a-z0-9äöå&\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSearchCombos(title, artist, options = {}) {
  const { manualRetry = false, retryLevel = 0 } = options;
  const combos = [];
  const seen = new Set();

  const pushCombo = (comboTitle = '', comboArtist = '') => {
    const normalizedTitle = (comboTitle || '').trim();
    const normalizedArtist = (comboArtist || '').trim();
    const key = `${normalizedTitle.toLowerCase()}:::${normalizedArtist.toLowerCase()}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    combos.push({ title: normalizedTitle, artist: normalizedArtist });
  };

  const baseTitle = title || '';
  const baseArtist = artist || '';
  const relaxedTitle = loosenTitle(baseTitle);
  const relaxedArtist = loosenArtist(baseArtist);

  pushCombo(baseTitle, baseArtist);

  if (relaxedTitle && relaxedTitle !== baseTitle) {
    pushCombo(relaxedTitle, baseArtist);
  }

  if (relaxedTitle && relaxedArtist) {
    pushCombo(relaxedTitle, relaxedArtist);
  }

  if (manualRetry || retryLevel > 0) {
    pushCombo(relaxedTitle || baseTitle, '');
  }

  if (retryLevel > 0) {
    const hyphenSplit = baseTitle.split(/\s+-\s+/);
    if (hyphenSplit.length === 2) {
      pushCombo(hyphenSplit[1], baseArtist || hyphenSplit[0]);
    }
  }

  if (retryLevel > 1) {
    const artistParts = relaxedArtist
      ? relaxedArtist.split(/[,&]/).map((part) => part.trim()).filter(Boolean)
      : [];
    artistParts.forEach((part) => pushCombo(relaxedTitle || baseTitle, part));

    const titleWords = (relaxedTitle || baseTitle).split(/\s+/).filter(Boolean);
    if (titleWords.length > 4) {
      const shortened = titleWords.slice(0, Math.ceil(titleWords.length * 0.7)).join(' ');
      pushCombo(shortened, relaxedArtist || baseArtist);
    }
  }

  if (!combos.length) {
    pushCombo(baseTitle, '');
  }

  return combos;
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
