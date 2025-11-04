// Playlists and Bookmarks Manager for AnomTube
// Handles local storage of playlists and bookmarks with CRUD operations

class PlaylistsManager {
  constructor() {
    this.storageKey = 'playlists';
    this.bookmarksKey = 'bookmarks';
    this.playlists = [];
    this.bookmarks = [];
  }

  /**
   * Initialize and load saved data
   * @returns {Promise<Object>} Loaded playlists and bookmarks
   */
  async init() {
    try {
      const result = await chrome.storage.local.get([this.storageKey, this.bookmarksKey]);
      this.playlists = result[this.storageKey] || [];
      this.bookmarks = result[this.bookmarksKey] || [];
      
      return {
        playlists: this.playlists,
        bookmarks: this.bookmarks
      };
    } catch (error) {
      console.error('Failed to load playlists/bookmarks:', error);
      return { playlists: [], bookmarks: [] };
    }
  }

  /**
   * Save playlists to storage
   * @returns {Promise<void>}
   */
  async savePlaylists() {
    try {
      await chrome.storage.local.set({
        [this.storageKey]: this.playlists
      });
    } catch (error) {
      console.error('Failed to save playlists:', error);
    }
  }

  /**
   * Save bookmarks to storage
   * @returns {Promise<void>}
   */
  async saveBookmarks() {
    try {
      await chrome.storage.local.set({
        [this.bookmarksKey]: this.bookmarks
      });
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }

  // === PLAYLISTS CRUD ===

  /**
   * Create a new playlist
   * @param {string} name - Playlist name
   * @param {string} description - Playlist description
   * @returns {Promise<Object>} Created playlist
   */
  async createPlaylist(name, description = '') {
    const playlist = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name,
      description,
      videos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.playlists.push(playlist);
    await this.savePlaylists();
    
    return playlist;
  }

  /**
   * Get all playlists
   * @returns {Array} All playlists
   */
  getAllPlaylists() {
    return [...this.playlists];
  }

  /**
   * Get playlist by ID
   * @param {string} id - Playlist ID
   * @returns {Object|null} Playlist or null
   */
  getPlaylist(id) {
    return this.playlists.find(p => p.id === id) || null;
  }

  /**
   * Update playlist
   * @param {string} id - Playlist ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object|null>} Updated playlist or null
   */
  async updatePlaylist(id, updates) {
    const index = this.playlists.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    this.playlists[index] = {
      ...this.playlists[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await this.savePlaylists();
    return this.playlists[index];
  }

  /**
   * Delete playlist
   * @param {string} id - Playlist ID
   * @returns {Promise<boolean>} Success status
   */
  async deletePlaylist(id) {
    const index = this.playlists.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    this.playlists.splice(index, 1);
    await this.savePlaylists();
    
    return true;
  }

  /**
   * Add video to playlist
   * @param {string} playlistId - Playlist ID
   * @param {Object} video - Video object with {id, title, url}
   * @returns {Promise<boolean>} Success status
   */
  async addVideoToPlaylist(playlistId, video) {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist) return false;
    
    // Check if video already exists
    if (playlist.videos.some(v => v.id === video.id)) {
      return false;
    }
    
    playlist.videos.push({
      ...video,
      addedAt: new Date().toISOString()
    });
    
    await this.updatePlaylist(playlistId, { videos: playlist.videos });
    return true;
  }

  /**
   * Remove video from playlist
   * @param {string} playlistId - Playlist ID
   * @param {string} videoId - Video ID
   * @returns {Promise<boolean>} Success status
   */
  async removeVideoFromPlaylist(playlistId, videoId) {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist) return false;
    
    const updatedVideos = playlist.videos.filter(v => v.id !== videoId);
    await this.updatePlaylist(playlistId, { videos: updatedVideos });
    
    return true;
  }

  // === BOOKMARKS CRUD ===

  /**
   * Create a bookmark for current video at current timestamp
   * @param {Object} data - Bookmark data {videoId, title, url, timestamp}
   * @returns {Promise<Object>} Created bookmark
   */
  async createBookmark(data) {
    const bookmark = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      videoId: data.videoId,
      title: data.title,
      url: data.url,
      timestamp: data.timestamp || 0,
      note: data.note || '',
      createdAt: new Date().toISOString()
    };
    
    this.bookmarks.push(bookmark);
    await this.saveBookmarks();
    
    return bookmark;
  }

  /**
   * Get all bookmarks
   * @returns {Array} All bookmarks
   */
  getAllBookmarks() {
    return [...this.bookmarks];
  }

  /**
   * Get bookmark by ID
   * @param {string} id - Bookmark ID
   * @returns {Object|null} Bookmark or null
   */
  getBookmark(id) {
    return this.bookmarks.find(b => b.id === id) || null;
  }

  /**
   * Get bookmarks for a specific video
   * @param {string} videoId - Video ID
   * @returns {Array} Bookmarks for video
   */
  getBookmarksByVideo(videoId) {
    return this.bookmarks.filter(b => b.videoId === videoId);
  }

  /**
   * Update bookmark
   * @param {string} id - Bookmark ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object|null>} Updated bookmark or null
   */
  async updateBookmark(id, updates) {
    const index = this.bookmarks.findIndex(b => b.id === id);
    if (index === -1) return null;
    
    this.bookmarks[index] = {
      ...this.bookmarks[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await this.saveBookmarks();
    return this.bookmarks[index];
  }

  /**
   * Delete bookmark
   * @param {string} id - Bookmark ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteBookmark(id) {
    const index = this.bookmarks.findIndex(b => b.id === id);
    if (index === -1) return false;
    
    this.bookmarks.splice(index, 1);
    await this.saveBookmarks();
    
    return true;
  }

  /**
   * Jump to bookmark timestamp on video
   * @param {string} id - Bookmark ID
   * @returns {boolean} Success status
   */
  jumpToBookmark(id) {
    const bookmark = this.getBookmark(id);
    if (!bookmark) return false;
    
    const video = document.querySelector('video');
    if (!video) return false;
    
    video.currentTime = bookmark.timestamp;
    return true;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlaylistsManager;
}
