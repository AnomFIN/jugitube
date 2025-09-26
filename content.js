// Content script for JugiTube extension
class JugiTube {
  constructor() {
    this.isEnabled = false;
    this.lyricsWindow = null;
    this.currentLyrics = [];
    this.startTime = 0;
    this.videoElement = null;
    this.originalVideoDisplay = '';
    this.lyricsInterval = null;
    this.domObserver = null;
    this.navigationListener = null;
    this.navigationListenerAttached = false;
    this.lyricsReloadTimeout = null;
    this.placeholderElement = null;

    this.init();
  }

  async init() {
    // Check if extension is enabled
    const result = await chrome.storage.sync.get(['enabled']);
    this.isEnabled = result.enabled || false;
    
    if (this.isEnabled) {
      this.activate();
    }
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggleJugiTube') {
        this.isEnabled = request.enabled;
        if (this.isEnabled) {
          this.activate();
        } else {
          this.deactivate();
        }
      }
    });
  }
  
  activate() {
    console.log('JugiTube activated');
    this.attachNavigationListeners();
    this.ensureVideoMonitoring();
    this.createLyricsWindow();
    this.scheduleLyricsRefresh(true);
    this.startLyricsSync();
  }

  deactivate() {
    console.log('JugiTube deactivated');
    this.detachNavigationListeners();
    this.disconnectVideoMonitoring();
    this.unblockVideo();
    this.videoElement = null;
    this.originalVideoDisplay = '';
    this.closeLyricsWindow();
    this.stopLyricsSync();
  }

  ensureVideoMonitoring() {
    if (this.domObserver) {
      return;
    }

    const handleVideoChange = () => {
      const { changed, hasVideo } = this.updateVideoElement();
      if (changed) {
        this.startLyricsSync();
        this.scheduleLyricsRefresh();
      } else if (hasVideo && this.videoElement && this.videoElement.style.display !== 'none') {
        // Ensure the video stays hidden even if YouTube tweaks the DOM.
        this.videoElement.style.display = 'none';
      }
    };

    this.domObserver = new MutationObserver(() => {
      if (!this.isEnabled) {
        return;
      }
      handleVideoChange();
    });

    this.domObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    handleVideoChange();
  }

  updateVideoElement() {
    if (!this.isEnabled) {
      return { changed: false, hasVideo: !!this.videoElement };
    }

    const video = document.querySelector('video');

    if (!video) {
      if (this.videoElement) {
        this.unblockVideo(this.videoElement);
        this.videoElement = null;
      }
      return { changed: false, hasVideo: false };
    }

    const previousVideo = this.videoElement;
    const isNewVideo = previousVideo !== video;

    if (isNewVideo && previousVideo) {
      this.unblockVideo(previousVideo);
    }

    this.videoElement = video;
    if (isNewVideo) {
      this.originalVideoDisplay = video.style.display;
    }

    this.applyPlaceholder(video);

    return { changed: isNewVideo, hasVideo: true };
  }

  applyPlaceholder(video) {
    if (!video) {
      return;
    }

    video.style.display = 'none';

    const videoContainer = video.parentElement;
    if (!videoContainer) {
      return;
    }

    if (this.placeholderElement && this.placeholderElement.parentElement !== videoContainer) {
      this.placeholderElement.remove();
      this.placeholderElement = null;
    }

    if (!this.placeholderElement) {
      const placeholder = document.createElement('div');
      placeholder.id = 'jugitube-placeholder';
      placeholder.innerHTML = `
        <div class="jugitube-audio-only">
          <div class="jugitube-icon">🎵</div>
          <div class="jugitube-title">Audio Only Mode</div>
          <div class="jugitube-subtitle">Video is hidden - Audio continues playing</div>
          <div class="jugitube-note">Check the lyrics popup window!</div>
        </div>
      `;
      videoContainer.appendChild(placeholder);
      this.placeholderElement = placeholder;
    }
  }

  unblockVideo(targetVideo = this.videoElement) {
    if (targetVideo) {
      targetVideo.style.display = this.originalVideoDisplay;
    }

    if (this.placeholderElement) {
      this.placeholderElement.remove();
      this.placeholderElement = null;
    }
  }

  disconnectVideoMonitoring() {
    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = null;
    }

    if (this.lyricsReloadTimeout) {
      clearTimeout(this.lyricsReloadTimeout);
      this.lyricsReloadTimeout = null;
    }
  }

  createLyricsWindow() {
    if (this.lyricsWindow && !this.lyricsWindow.closed) {
      this.lyricsWindow.close();
    }
    
    // Create popup window for lyrics
    const windowFeatures = 'width=400,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no';
    this.lyricsWindow = window.open('', 'JugiTubeLyrics', windowFeatures);
    
    if (this.lyricsWindow) {
      this.setupLyricsWindow();
      this.scheduleLyricsRefresh(true);
    }
  }

  setupLyricsWindow() {
    if (!this.lyricsWindow) return;
    
    this.lyricsWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>JugiTube - Live Lyrics</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            box-sizing: border-box;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid rgba(255, 255, 255, 0.2);
            padding-bottom: 20px;
          }
          
          .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .artist {
            font-size: 18px;
            opacity: 0.8;
          }
          
          .lyrics-container {
            text-align: center;
            line-height: 1.8;
          }
          
          .lyric-line {
            font-size: 20px;
            margin: 15px 0;
            padding: 10px;
            border-radius: 10px;
            transition: all 0.5s ease;
            opacity: 0.5;
          }
          
          .lyric-line.current {
            background: rgba(255, 255, 255, 0.2);
            opacity: 1;
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            border: 2px solid #FFD700;
          }
          
          .lyric-line.next {
            opacity: 0.8;
          }
          
          .no-lyrics {
            text-align: center;
            opacity: 0.7;
            font-style: italic;
            margin-top: 50px;
          }
          
          .loading {
            text-align: center;
            font-size: 18px;
            opacity: 0.8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title" id="song-title">🎵 JugiTube Lyrics</div>
          <div class="artist" id="song-artist">Karaoke Mode Active</div>
        </div>
        <div id="lyrics-container" class="lyrics-container">
          <div class="loading">Loading lyrics...</div>
        </div>
      </body>
      </html>
    `);
    
    this.lyricsWindow.document.close();
  }
  
  async loadLyrics() {
    // Get video title and artist from page
    const titleElement = document.querySelector('h1.title yt-formatted-string, h1 yt-formatted-string');
    const title = titleElement ? titleElement.textContent.trim() : 'Unknown Title';

    // Try to extract artist from title (basic parsing)
    let artist = 'Unknown Artist';
    const titleParts = title.split(' - ');
    if (titleParts.length >= 2) {
      artist = titleParts[0].trim();
    }
    
    // Update lyrics window header
    if (this.lyricsWindow && !this.lyricsWindow.closed) {
      const titleEl = this.lyricsWindow.document.getElementById('song-title');
      const artistEl = this.lyricsWindow.document.getElementById('song-artist');
      if (titleEl) titleEl.textContent = title;
      if (artistEl) artistEl.textContent = artist;
    }
    
    // Request lyrics from background script
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getLyrics',
        title: title,
        artist: artist
      });
      
      if (response && response.lyrics) {
        this.currentLyrics = response.lyrics;
        this.displayLyrics();
      }
    } catch (error) {
      console.log('Could not load lyrics:', error);
      this.showNoLyrics();
    }
  }

  scheduleLyricsRefresh(immediate = false) {
    if (this.lyricsReloadTimeout) {
      clearTimeout(this.lyricsReloadTimeout);
      this.lyricsReloadTimeout = null;
    }

    if (!this.isEnabled) {
      return;
    }

    if (immediate) {
      this.loadLyrics();
      return;
    }

    this.lyricsReloadTimeout = setTimeout(() => {
      this.lyricsReloadTimeout = null;
      this.loadLyrics();
    }, 300);
  }

  displayLyrics() {
    if (!this.lyricsWindow || this.lyricsWindow.closed) return;

    const container = this.lyricsWindow.document.getElementById('lyrics-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    this.currentLyrics.forEach((lyric, index) => {
      const lyricElement = this.lyricsWindow.document.createElement('div');
      lyricElement.className = 'lyric-line';
      lyricElement.textContent = lyric.text;
      lyricElement.dataset.time = lyric.time;
      lyricElement.dataset.index = index;
      container.appendChild(lyricElement);
    });
  }
  
  showNoLyrics() {
    if (!this.lyricsWindow || this.lyricsWindow.closed) return;
    
    const container = this.lyricsWindow.document.getElementById('lyrics-container');
    if (container) {
      container.innerHTML = '<div class="no-lyrics">No lyrics available for this video</div>';
    }
  }
  
  startLyricsSync() {
    if (this.lyricsInterval) {
      clearInterval(this.lyricsInterval);
    }
    
    this.startTime = Date.now();
    
    this.lyricsInterval = setInterval(() => {
      this.syncLyrics();
    }, 500); // Update every 500ms
  }
  
  stopLyricsSync() {
    if (this.lyricsInterval) {
      clearInterval(this.lyricsInterval);
      this.lyricsInterval = null;
    }
  }
  
  syncLyrics() {
    if (!this.lyricsWindow || this.lyricsWindow.closed || !this.videoElement) {
      return;
    }
    
    const currentTime = this.videoElement.currentTime;
    
    // Find current lyric
    let currentIndex = -1;
    for (let i = 0; i < this.currentLyrics.length; i++) {
      if (currentTime >= this.currentLyrics[i].time) {
        currentIndex = i;
      } else {
        break;
      }
    }
    
    // Update lyrics display
    const lyricElements = this.lyricsWindow.document.querySelectorAll('.lyric-line');
    lyricElements.forEach((element, index) => {
      element.classList.remove('current', 'next');
      
      if (index === currentIndex) {
        element.classList.add('current');
      } else if (index === currentIndex + 1) {
        element.classList.add('next');
      }
    });
    
    // Auto-scroll to current lyric
    if (currentIndex >= 0 && lyricElements[currentIndex]) {
      lyricElements[currentIndex].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }
  
  closeLyricsWindow() {
    if (this.lyricsWindow && !this.lyricsWindow.closed) {
      this.lyricsWindow.close();
    }
    this.lyricsWindow = null;
  }

  attachNavigationListeners() {
    if (this.navigationListenerAttached) {
      return;
    }

    this.navigationListener = () => {
      if (!this.isEnabled) {
        return;
      }

      const { changed } = this.updateVideoElement();
      if (changed) {
        this.startLyricsSync();
      }
      this.scheduleLyricsRefresh();
    };

    window.addEventListener('yt-navigate-finish', this.navigationListener);
    document.addEventListener('yt-page-data-updated', this.navigationListener);
    window.addEventListener('popstate', this.navigationListener);
    this.navigationListenerAttached = true;
  }

  detachNavigationListeners() {
    if (!this.navigationListenerAttached || !this.navigationListener) {
      return;
    }

    window.removeEventListener('yt-navigate-finish', this.navigationListener);
    document.removeEventListener('yt-page-data-updated', this.navigationListener);
    window.removeEventListener('popstate', this.navigationListener);
    this.navigationListenerAttached = false;
    this.navigationListener = null;
  }
}

// Initialize JugiTube when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new JugiTube();
  });
} else {
  new JugiTube();
}
