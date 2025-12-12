// Security-first. Creator-ready. Future-proof.
(function(global, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    global.jugitubeToolbarWidth = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const WIDTH_MIN = 200;
  const WIDTH_MAX = 360;
  const DEFAULT_WIDTH = 220;
  const EXPAND_THRESHOLD = 260;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  function normalizeToolbarWidth(value, fallback = DEFAULT_WIDTH) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return clamp(fallback, WIDTH_MIN, WIDTH_MAX);
    }
    return clamp(Math.round(numericValue), WIDTH_MIN, WIDTH_MAX);
  }

  function deriveExpandFlag(widthValue) {
    return normalizeToolbarWidth(widthValue) >= EXPAND_THRESHOLD;
  }

  return {
    WIDTH_MIN,
    WIDTH_MAX,
    DEFAULT_WIDTH,
    EXPAND_THRESHOLD,
    normalizeToolbarWidth,
    deriveExpandFlag
  };
});
