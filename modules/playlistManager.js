// Playlist and Bookmark Manager for AnomTube extension
// Handles creating, storing, and managing playlists and bookmarks

class PlaylistManager {
  constructor() {
    this.playlists = [];
    this.bookmarks = [];
    this.storageKeyPlaylists = 'anomTubePlaylists';
    this.storageKeyBookmarks = 'anomTubeBookmarks';
    this.currentPlaylistId = null;
  }

  async init() {
    await this.loadData();
  }

  async loadData() {
    const result = await chrome.storage.local.get([
      this.storageKeyPlaylists,
      this.storageKeyBookmarks
    ]);
    
    this.playlists = result[this.storageKeyPlaylists] || [];
    this.bookmarks = result[this.storageKeyBookmarks] || [];
  }

  async savePlaylists() {
    await chrome.storage.local.set({
      [this.storageKeyPlaylists]: this.playlists
    });
  }

  async saveBookmarks() {
    await chrome.storage.local.set({
      [this.storageKeyBookmarks]: this.bookmarks
    });
  }

  // Playlist methods
  createPlaylist(name) {
    const playlist = {
      id: this.generateId(),
      name: name,
      videos: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.playlists.push(playlist);
    this.savePlaylists();
    return playlist;
  }

  getPlaylist(playlistId) {
    return this.playlists.find(p => p.id === playlistId);
  }

  getAllPlaylists() {
    return this.playlists;
  }

  deletePlaylist(playlistId) {
    this.playlists = this.playlists.filter(p => p.id !== playlistId);
    this.savePlaylists();
  }

  updatePlaylistName(playlistId, newName) {
    const playlist = this.getPlaylist(playlistId);
    if (playlist) {
      playlist.name = newName;
      playlist.updatedAt = Date.now();
      this.savePlaylists();
    }
  }

  addVideoToPlaylist(playlistId, videoData) {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist) return;

    // Check if video already exists
    const exists = playlist.videos.some(v => v.videoId === videoData.videoId);
    if (exists) return;

    const video = {
      videoId: videoData.videoId,
      title: videoData.title,
      thumbnail: videoData.thumbnail,
      duration: videoData.duration,
      addedAt: Date.now()
    };

    playlist.videos.push(video);
    playlist.updatedAt = Date.now();
    this.savePlaylists();
  }

  removeVideoFromPlaylist(playlistId, videoId) {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist) return;

    playlist.videos = playlist.videos.filter(v => v.videoId !== videoId);
    playlist.updatedAt = Date.now();
    this.savePlaylists();
  }

  // Bookmark methods
  createBookmark(videoId, title, timestamp, note = '') {
    const bookmark = {
      id: this.generateId(),
      videoId: videoId,
      title: title,
      timestamp: timestamp,
      note: note,
      createdAt: Date.now()
    };

    this.bookmarks.push(bookmark);
    this.saveBookmarks();
    return bookmark;
  }

  getBookmark(bookmarkId) {
    return this.bookmarks.find(b => b.id === bookmarkId);
  }

  getBookmarksByVideo(videoId) {
    return this.bookmarks.filter(b => b.videoId === videoId);
  }

  getAllBookmarks() {
    return this.bookmarks;
  }

  deleteBookmark(bookmarkId) {
    this.bookmarks = this.bookmarks.filter(b => b.id !== bookmarkId);
    this.saveBookmarks();
  }

  updateBookmark(bookmarkId, updates) {
    const bookmark = this.getBookmark(bookmarkId);
    if (bookmark) {
      Object.assign(bookmark, updates);
      this.saveBookmarks();
    }
  }

  // Jump to bookmark timestamp
  jumpToBookmark(bookmarkId, videoElement) {
    const bookmark = this.getBookmark(bookmarkId);
    if (!bookmark || !videoElement) return;

    videoElement.currentTime = bookmark.timestamp;
    return bookmark;
  }

  // Utility methods
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  formatTimestamp(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getCurrentVideoInfo() {
    // Extract current video info from YouTube page
    const videoId = new URLSearchParams(window.location.search).get('v');
    const title = document.querySelector('h1.title yt-formatted-string')?.textContent || 'Unknown';
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    
    return {
      videoId,
      title,
      thumbnail,
      duration: 0 // Will be set from video element
    };
  }

  exportData() {
    return {
      playlists: this.playlists,
      bookmarks: this.bookmarks,
      exportedAt: Date.now()
    };
  }

  async importData(data) {
    if (data.playlists) {
      this.playlists = data.playlists;
      await this.savePlaylists();
    }
    if (data.bookmarks) {
      this.bookmarks = data.bookmarks;
      await this.saveBookmarks();
    }
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlaylistManager;
}
