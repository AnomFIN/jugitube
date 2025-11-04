# Changelog for AnomTube v2.1.0

## 🎉 New Features

### 1. **Modular Architecture**
- Introduced three new modules for better code organization and maintainability:
  - `modules/settings.js` - Centralized settings management with SettingsManager class
  - `modules/adSkipper.js` - Advanced ad skipping with MutationObserver
  - `modules/lyricHandler.js` - Intelligent popup visibility control

### 2. **Expanded Toolbar Width Control** ⚙️
- **NEW SETTING:** "Laajenna työkalupalkki" (Expand toolbar)
  - Default: **Enabled** (220px min-width)
  - When disabled: Compact mode (180px min-width)
  - Responsive across all screen sizes
  - Smooth transitions and adaptive layouts
- **Technical Implementation:**
  - CSS attribute `data-anomtube-expand-toolbar` on body element
  - Media queries for mobile responsiveness (@max-width: 900px, 560px)
  - Maintains usability on small screens

### 3. **Hide Lyrics Popup Completely** 🚫
- **NEW SETTING:** "Piilota lyriikka-popup" (Hide lyric popup completely)
  - Default: **Disabled** (popup visible)
  - When enabled: Lyrics console is completely hidden
  - MutationObserver prevents popup from appearing
  - Immediate effect when toggled during playback
- **Use Case:**
  - Users who only want audio-only mode without lyrics overlay
  - Minimalist viewing experience
  - Reduces visual clutter

### 4. **Allow Video with Ad Settings** 🎬
- **NEW SETTING:** "Salli video, pidä mainosten esto" (Allow video but keep ad settings)
  - Default: **Disabled** (video hidden as before)
  - When enabled: Video remains visible while ad blocking continues
  - AdSkipper module continues to function normally
  - Video placeholder not shown when this setting is active
- **Use Case:**
  - Users who want to see videos but still block/skip/mute ads
  - Separates video blocking from ad control
  - More flexible user experience

### 5. **Auto-Click Skip Ads** ⏭️
- **NEW SETTING:** "Ohita automaattisesti" (Auto-click Skip ads immediately)
  - Default: **Disabled**
  - When enabled: Automatically clicks "Skip Ad" button as soon as it appears
  - Uses advanced adSkipper module with multiple detection methods
- **Technical Features:**
  - **MutationObserver-based** monitoring for instant detection
  - **Rate-limiting** (300ms) to prevent excessive clicking
  - **Multiple click dispatch methods:**
    - Native `.click()`
    - MouseEvent dispatch
    - PointerEvent dispatch (modern browsers)
  - **Smart button detection:**
    - CSS selector matching (`.ytp-ad-skip-button`, etc.)
    - Text content search ("skip", "ohita")
    - Visibility checking before clicking
  - **Comprehensive ad handling:**
    - Overlay ad close buttons
    - Banner ad removal
    - Fast-forward through non-skippable portions

## 🔧 Technical Improvements

### Code Architecture
- **Separation of Concerns:** Ad skipping logic isolated in dedicated module
- **Reusability:** Modules can be easily maintained and tested independently
- **Performance:** MutationObserver only active when needed
- **Memory Management:** Proper cleanup and disconnection of observers

### Settings Management
- **Centralized Storage:** SettingsManager handles all sync/local storage operations
- **Type Safety:** Boolean normalization for all settings
- **Change Listeners:** Real-time updates when settings change
- **Backwards Compatibility:** Default values for new settings

### CSS Enhancements
- Added responsive media queries for toolbar width control
- Attribute-based styling for better JavaScript integration
- Maintained existing visual design and animations
- Smooth transitions for width changes

### Manifest Updates
- Content scripts now load modules in correct order
- Settings module loaded first for initialization
- AdSkipper and LyricHandler loaded before main content script

## 🐛 Bug Fixes

### Fixed Issues
- Video hiding logic now properly checks allowVideoKeepAdSettings
- Popup creation respects hidePopupCompletely setting
- Ad monitoring properly starts/stops adSkipper module
- Storage listeners handle all new settings correctly

### Improved Robustness
- Better error handling in adSkipper click dispatch
- Proper cleanup when extension is disabled
- Defensive programming in visibility checks
- Rate limiting prevents excessive operations

## 📋 API Changes

### New Storage Keys (chrome.storage.sync)
```javascript
{
  autoClickSkipAds: boolean,          // Default: false
  allowVideoKeepAdSettings: boolean,  // Default: false
  hidePopupCompletely: boolean,       // Default: false
  expandToolbar: boolean              // Default: true
}
```

### New Message Actions
- `updateSettings`: Replaces `updateAdPreferences` for broader settings updates
- Payload includes all ad and UI settings in one message

### New CSS Classes
- `body[data-anomtube-expand-toolbar="true|false"]`: Controls toolbar width

## 🚀 Performance Impact

### Memory Usage
- **SettingsManager:** ~2KB
- **AdSkipper:** ~5KB + MutationObserver overhead
- **LyricHandler:** ~3KB + MutationObserver overhead
- **Total Additional:** ~10KB (negligible)

### CPU Usage
- MutationObserver callbacks are rate-limited to 300ms
- Minimal impact during normal YouTube browsing
- Slight increase during ad playback when autoClickSkipAds is enabled
- No continuous polling or intervals for ad detection

### Network Impact
- No additional network requests
- All logic runs client-side
- Settings stored locally

## 🔄 Migration Guide

### For Existing Users
1. **Automatic Migration:**
   - All existing settings are preserved
   - New settings initialize with safe defaults
   - No manual action required

2. **New Settings Defaults:**
   - `expandToolbar: true` - Toolbar expands by default (same visual as before)
   - `autoClickSkipAds: false` - Must opt-in for auto-clicking
   - `allowVideoKeepAdSettings: false` - Video hidden by default (existing behavior)
   - `hidePopupCompletely: false` - Popup visible by default (existing behavior)

### For Developers
1. **Module Loading:**
   - Modules must be loaded before main content script
   - Order: settings.js → adSkipper.js → lyricHandler.js → content.js

2. **Settings Access:**
   - Use `this.settingsManager.get(key)` instead of direct storage access
   - Use `this.settings.*` for UI-specific settings
   - Use `this.adPreferences.*` for ad-related settings

3. **Observer Management:**
   - Always call `.stop()` on modules when deactivating
   - Proper cleanup prevents memory leaks

## ⚠️ Known Issues and Limitations

### Current Limitations
1. **YouTube Ad Button Structure:**
   - Auto-skip depends on YouTube's DOM structure
   - May break if YouTube updates their ad player
   - Multiple selectors provide some resilience

2. **MutationObserver Performance:**
   - Observes entire player container for changes
   - Rate-limited to 300ms to prevent performance issues
   - May miss rapid ad transitions (rare)

3. **Ad Detection:**
   - Relies on CSS classes: `.ad-showing`, `.ad-interrupting`, `.ad-playing`
   - YouTube may introduce new ad formats not yet supported

4. **Browser Compatibility:**
   - Tested on Chrome and Edge (Chromium-based)
   - PointerEvent may not work on older browsers (falls back to MouseEvent)

### Future Improvements
- [ ] Add option to customize rate-limit interval
- [ ] Support for additional ad button selectors
- [ ] Telemetry for skip success rate (opt-in)
- [ ] Visual indicator when ad is auto-skipped
- [ ] Configurable toolbar width (not just expand/compact)

## 📚 Documentation Updates

### New Files
- `TEST_INSTRUCTIONS_V2.md` - Comprehensive testing guide
- `CHANGELOG_V2.md` - This changelog
- `modules/settings.js` - Well-documented module code
- `modules/adSkipper.js` - Extensive inline documentation
- `modules/lyricHandler.js` - Clear method descriptions

### Updated Files
- `manifest.json` - Version bump, new content scripts
- `popup.html` - 4 new settings toggles with Finnish descriptions
- `popup.js` - Settings management and event handlers
- `content.js` - Module integration and new logic
- `content.css` - Toolbar width controls
- `background.js` - Default settings initialization

## 🙏 Credits

**Developed by:** Jugi @ AnomFIN  
**Extension:** AnomTube - Audio Only YouTube with Live Lyrics  
**Version:** 2.1.0  
**Release Date:** 2024-10-29  

Special thanks to users who requested these features!

## 📞 Support

For issues or feature requests:
1. Check TEST_INSTRUCTIONS_V2.md for troubleshooting
2. Review Known Issues section above
3. Open an issue on GitHub with detailed reproduction steps

---

**AnomFIN Tools · AnomTools**  
*Precision-engineered audio experiences*
