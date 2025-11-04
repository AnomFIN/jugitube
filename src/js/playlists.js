// Playlist and Bookmark Manager for AnomTube Extension
// Manages local playlists and timestamp bookmarks

class PlaylistManager {
  constructor() {
    this.playlists = [];
    this.bookmarks = [];
    this.currentPlaylistId = null;
    this.initialized = false;
  }

  /**
   * Initialize playlist manager
   * Load saved playlists and bookmarks from storage
   */
  async init() {
    if (this.initialized) {
      return;
    }

    try {
      const { playlists, bookmarks, currentPlaylistId } = await chrome.storage.local.get([
        'playlists',
        'bookmarks',
        'currentPlaylistId'
      ]);

      this.playlists = playlists || [];
      this.bookmarks = bookmarks || [];
      this.currentPlaylistId = currentPlaylistId || null;
      this.initialized = true;

      console.log('Playlist manager initialized:', {
        playlistCount: this.playlists.length,
        bookmarkCount: this.bookmarks.length
      });
    } catch (error) {
      console.error('Playlist manager initialization failed:', error);
      this.playlists = [];
      this.bookmarks = [];
    }
  }

  /**
   * Save current state to storage
   */
  async save() {
    try {
      await chrome.storage.local.set({
        playlists: this.playlists,
        bookmarks: this.bookmarks,
        currentPlaylistId: this.currentPlaylistId
      });
    } catch (error) {
      console.error('Failed to save playlist data:', error);
    }
  }

  /**
   * Create a new playlist
   * @param {string} name - Playlist name
   * @param {string} description - Playlist description
   * @returns {Object} Created playlist
   */
  async createPlaylist(name, description = '') {
    const playlist = {
      id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || 'Untitled Playlist',
      description,
      videos: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.playlists.push(playlist);
    await this.save();

    return playlist;
  }

  /**
   * Get playlist by ID
   * @param {string} playlistId
   * @returns {Object|null} Playlist object or null
   */
  getPlaylist(playlistId) {
    return this.playlists.find(p => p.id === playlistId) || null;
  }

  /**
   * Get all playlists
   * @returns {Array} Array of playlists
   */
  getAllPlaylists() {
    return [...this.playlists];
  }

  /**
   * Update playlist
   * @param {string} playlistId
   * @param {Object} updates - Updates to apply
   * @returns {boolean} True if updated
   */
  async updatePlaylist(playlistId, updates) {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist) {
      return false;
    }

    Object.assign(playlist, updates, { updatedAt: Date.now() });
    await this.save();

    return true;
  }

  /**
   * Delete playlist
   * @param {string} playlistId
   * @returns {boolean} True if deleted
   */
  async deletePlaylist(playlistId) {
    const index = this.playlists.findIndex(p => p.id === playlistId);
    if (index === -1) {
      return false;
    }

    this.playlists.splice(index, 1);

    // Delete associated bookmarks
    this.bookmarks = this.bookmarks.filter(b => b.playlistId !== playlistId);

    if (this.currentPlaylistId === playlistId) {
      this.currentPlaylistId = null;
    }

    await this.save();
    return true;
  }

  /**
   * Add video to playlist
   * @param {string} playlistId
   * @param {Object} video - Video object with { videoId, title, artist, thumbnailUrl }
   * @returns {boolean} True if added
   */
  async addVideoToPlaylist(playlistId, video) {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist) {
      return false;
    }

    // Check if video already exists
    const exists = playlist.videos.some(v => v.videoId === video.videoId);
    if (exists) {
      console.warn('Video already in playlist');
      return false;
    }

    const videoEntry = {
      videoId: video.videoId,
      title: video.title || 'Unknown Title',
      artist: video.artist || 'Unknown Artist',
      thumbnailUrl: video.thumbnailUrl || null,
      addedAt: Date.now(),
      duration: video.duration || null
    };

    playlist.videos.push(videoEntry);
    playlist.updatedAt = Date.now();

    await this.save();
    return true;
  }

  /**
   * Remove video from playlist
   * @param {string} playlistId
   * @param {string} videoId
   * @returns {boolean} True if removed
   */
  async removeVideoFromPlaylist(playlistId, videoId) {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist) {
      return false;
    }

    const index = playlist.videos.findIndex(v => v.videoId === videoId);
    if (index === -1) {
      return false;
    }

    playlist.videos.splice(index, 1);
    playlist.updatedAt = Date.now();

    await this.save();
    return true;
  }

  /**
   * Reorder videos in playlist
   * @param {string} playlistId
   * @param {number} fromIndex
   * @param {number} toIndex
   * @returns {boolean} True if reordered
   */
  async reorderPlaylist(playlistId, fromIndex, toIndex) {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist) {
      return false;
    }

    if (fromIndex < 0 || fromIndex >= playlist.videos.length ||
        toIndex < 0 || toIndex >= playlist.videos.length) {
      return false;
    }

    const [video] = playlist.videos.splice(fromIndex, 1);
    playlist.videos.splice(toIndex, 0, video);
    playlist.updatedAt = Date.now();

    await this.save();
    return true;
  }

  /**
   * Add bookmark at specific timestamp
   * @param {Object} bookmark - { videoId, title, artist, timestamp, note }
   * @returns {Object} Created bookmark
   */
  async addBookmark(bookmark) {
    const bookmarkEntry = {
      id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      videoId: bookmark.videoId,
      title: bookmark.title || 'Unknown Title',
      artist: bookmark.artist || 'Unknown Artist',
      timestamp: bookmark.timestamp || 0,
      note: bookmark.note || '',
      createdAt: Date.now(),
      playlistId: bookmark.playlistId || null
    };

    this.bookmarks.push(bookmarkEntry);
    await this.save();

    return bookmarkEntry;
  }

  /**
   * Get bookmarks for specific video
   * @param {string} videoId
   * @returns {Array} Array of bookmarks
   */
  getBookmarksForVideo(videoId) {
    return this.bookmarks
      .filter(b => b.videoId === videoId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get all bookmarks
   * @returns {Array} Array of bookmarks
   */
  getAllBookmarks() {
    return [...this.bookmarks].sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Delete bookmark
   * @param {string} bookmarkId
   * @returns {boolean} True if deleted
   */
  async deleteBookmark(bookmarkId) {
    const index = this.bookmarks.findIndex(b => b.id === bookmarkId);
    if (index === -1) {
      return false;
    }

    this.bookmarks.splice(index, 1);
    await this.save();

    return true;
  }

  /**
   * Update bookmark
   * @param {string} bookmarkId
   * @param {Object} updates
   * @returns {boolean} True if updated
   */
  async updateBookmark(bookmarkId, updates) {
    const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) {
      return false;
    }

    Object.assign(bookmark, updates);
    await this.save();

    return true;
  }

  /**
   * Set current active playlist
   * @param {string} playlistId
   */
  async setCurrentPlaylist(playlistId) {
    this.currentPlaylistId = playlistId;
    await this.save();
  }

  /**
   * Get current active playlist
   * @returns {Object|null} Current playlist or null
   */
  getCurrentPlaylist() {
    if (!this.currentPlaylistId) {
      return null;
    }
    return this.getPlaylist(this.currentPlaylistId);
  }

  /**
   * Format timestamp to human-readable string
   * @param {number} seconds
   * @returns {string} Formatted timestamp (MM:SS or HH:MM:SS)
   */
  formatTimestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlaylistManager;
}
