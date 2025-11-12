// Simple playlist and bookmarks manager using localStorage.
// Exposes CRUD functions and persistence.
// Usage: JugitubePlaylists.list(), create(name), addItem(playlistId, item), addBookmark(...), jumpTo(videoEl, ts)

(function (root) {
  const KEY = 'jugitube.playlists.v1';

  function _load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch (e) {
      console.warn('load playlists failed', e);
      return [];
    }
  }

  function _save(data) {
    localStorage.setItem(KEY, JSON.stringify(data || []));
  }

  function list() {
    return _load();
  }

  function create(name) {
    const data = _load();
    const p = { id: Date.now().toString(), name: name || 'Playlist', items: [] };
    data.push(p);
    _save(data);
    return p;
  }

  function remove(id) {
    const data = _load().filter(x => x.id !== id);
    _save(data);
    return data;
  }

  function addItem(playlistId, item) {
    const data = _load();
    const pl = data.find(x => x.id === playlistId);
    if (!pl) return null;
    pl.items.push(Object.assign({ id: Date.now().toString() }, item));
    _save(data);
    return pl;
  }

  function removeItem(playlistId, itemId) {
    const data = _load();
    const pl = data.find(x => x.id === playlistId);
    if (!pl) return null;
    pl.items = pl.items.filter(i => i.id !== itemId);
    _save(data);
    return pl;
  }

  function addBookmark(playlistId, itemId, timestamp, label) {
    const data = _load();
    const pl = data.find(x => x.id === playlistId);
    if (!pl) return null;
    const it = pl.items.find(i => i.id === itemId);
    if (!it) return null;
    it.bookmarks = it.bookmarks || [];
    it.bookmarks.push({ id: Date.now().toString(), ts: timestamp, label: label || '' });
    _save(data);
    return it;
  }

  function jumpTo(videoEl, timestamp) {
    if (!videoEl) return;
    videoEl.currentTime = timestamp;
    videoEl.play();
  }

  root.JugitubePlaylists = { list, create, remove, addItem, removeItem, addBookmark, jumpTo };
})(window);
