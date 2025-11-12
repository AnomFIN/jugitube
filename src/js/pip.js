// Minimal PiP helper using HTML5 Picture-in-Picture with an Electron IPC fallback.
// Usage: await JugitubePiP.toggle(videoElement)

(function (root) {
  async function toggle(videoEl) {
    if (!videoEl) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        return false;
      }
      if (document.pictureInPictureEnabled && videoEl.requestPictureInPicture) {
        await videoEl.requestPictureInPicture();
        return true;
      }
      // Electron fallback: notify main process to open a mini-window (requires main process handler)
      if (window.ipcRenderer && window.ipcRenderer.send) {
        window.ipcRenderer.send('jugitube-toggle-mini');
        return true;
      }
    } catch (e) {
      console.warn('PiP toggle failed', e);
    }
    return false;
  }

  root.JugitubePiP = { toggle };
})(window);
