// Hotkeys module: registers global key handlers.
// Usage: JugitubeHotkeys.init({ getVideoElement: ()=>document.querySelector('video'), onDownload: () => {...} })

(function (root) {
  const DEFAULTS = {
    seekStep: 5,
    volumeStep: 0.05,
  };

  function init(opts = {}) {
    const cfg = Object.assign({}, DEFAULTS, opts);
    const videoGetter = cfg.getVideoElement || (() => document.querySelector('video'));
    const onDownload = cfg.onDownload || (() => {});
    const onToggleTheme = cfg.onToggleTheme || (() => {});
    const onTogglePiP = cfg.onTogglePiP || (() => {});

    function handleKey(e) {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          seek(-cfg.seekStep);
          break;
        case 'ArrowRight':
          seek(cfg.seekStep);
          break;
        case 'ArrowUp':
          changeVolume(cfg.volumeStep);
          break;
        case 'ArrowDown':
          changeVolume(-cfg.volumeStep);
          break;
        case 'd':
        case 'D':
          onDownload();
          break;
        case 't':
        case 'T':
          onToggleTheme();
          break;
        case 'p':
        case 'P':
          onTogglePiP();
          break;
        default:
          break;
      }
    }

    function togglePlay() {
      const v = videoGetter();
      if (!v) return;
      if (v.paused) v.play(); else v.pause();
    }

    function seek(seconds) {
      const v = videoGetter();
      if (!v) return;
      v.currentTime = Math.max(0, v.currentTime + seconds);
    }

    function changeVolume(delta) {
      const v = videoGetter();
      if (!v) return;
      v.volume = Math.max(0, Math.min(1, v.volume + delta));
    }

    window.addEventListener('keydown', handleKey);
    return {
      dispose: () => window.removeEventListener('keydown', handleKey),
    };
  }

  root.JugitubeHotkeys = { init };
})(window);
