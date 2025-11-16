// Simple window state helper. Works in Electron (electron-store) or browser (localStorage).
// Usage: const state = JugitubeWindowState.restoreWindowState(); // returns {width,height,x,y}
// Save on close: JugitubeWindowState.saveWindowState(bounds)

(function (root) {
  const KEY = 'jugitube.windowState.v1';

  function isElectron() {
    try {
      return !!(window && window.process && window.process.type);
    } catch (e) {
      return false;
    }
  }

  function saveWindowState(bounds) {
    try {
      if (isElectron() && window.electronStore && typeof window.electronStore.set === 'function') {
        window.electronStore.set(KEY, bounds);
      } else {
        localStorage.setItem(KEY, JSON.stringify(bounds));
      }
    } catch (e) {
      console.warn('saveWindowState failed', e);
    }
  }

  function restoreWindowState(defaults = { width: 1280, height: 800 }) {
    try {
      let st = null;
      if (isElectron() && window.electronStore && typeof window.electronStore.get === 'function') {
        st = window.electronStore.get(KEY);
      } else {
        st = JSON.parse(localStorage.getItem(KEY));
      }
      if (!st) return defaults;
      st.width = Math.max(st.width || defaults.width, 800);
      st.height = Math.max(st.height || defaults.height, 600);
      return st;
    } catch (e) {
      console.warn('restoreWindowState failed', e);
      return defaults;
    }
  }

  root.JugitubeWindowState = { saveWindowState, restoreWindowState };
})(window);
