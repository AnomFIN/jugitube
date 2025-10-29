# Changelog - JugiTube Settings and Responsiveness Features

## Version 2.1.0 - 2025-10-29

### New Features

#### Settings Page (Options UI)
- **New options page** accessible via extension context menu or chrome://extensions
- **Persistent settings** stored in localStorage with key `jugitube_settings_v1`
- **Four configurable options:**
  - `expandToolbar`: Expand YouTube toolbar minimum width (220px → 280px)
  - `hideLyricPopup`: Automatically hide YouTube native lyric popups
  - `allowVideoKeepAdSettings`: Keep video visible while maintaining ad controls
  - `autoClickSkips`: Auto-click "Skip Ad" buttons when they appear
- **Real-time save feedback** with visual confirmation
- **Responsive design** with dark theme matching AnomTube aesthetic

#### Toolbar Responsiveness
- **CSS variable** `--jugitube-toolbar-width` for dynamic toolbar width control
- **Default width**: 220px (configurable via settings)
- **Expanded width**: 280px when expandToolbar is enabled
- **Responsive breakpoints**:
  - Mobile (≤480px): 160px
  - Tablet (≤768px): 180px
  - Desktop: 220px (or 280px if expanded)

#### Content Scripts Architecture

**1. settings-apply.js** (First to load)
- Loads settings from localStorage
- Applies CSS variables to document root
- Exposes `window.jugitubeSettings` globally
- Listens for settings changes and updates in real-time

**2. adSkipper.js**
- **MutationObserver** watches for ad skip buttons
- **Rate limiting**: Maximum 3 clicks per second
- **Safe click implementation** with multiple fallback methods
- **WeakSet tracking** to prevent duplicate clicks
- **Supports multiple selectors**:
  - `.ytp-ad-skip-button`
  - `.ytp-ad-skip-button-modern`
  - `.ytp-skip-ad-button`
  - Banner ad close buttons
- **Console logging** for debugging

**3. lyricHandler.js**
- **MutationObserver** watches for YouTube lyric popups
- **Multiple selector support** for various lyric popup types
- **Hide (not remove)** to prevent layout shifts
- **WeakSet tracking** to avoid duplicate processing
- **Setting-aware**: Only active when `hideLyricPopup` is enabled
- **Graceful re-show** when setting is disabled

**4. main.js** (Coordinator)
- **Module initialization** and coordination
- **Video blocking logic** separated from ad settings
- **Conditional blocking**: Respects `allowVideoKeepAdSettings`
- **Settings change listener** for dynamic behavior updates
- **Module status tracking** for debugging
- **Chrome runtime message handling** for cross-component communication

### Technical Implementation

#### Manifest.json Updates
```json
{
  "content_scripts": [
    {
      "js": [
        "src/content/settings-apply.js",  // First: Load settings
        "content.js",                      // Second: Original AnomTube
        "src/content/adSkipper.js",        // Third: Ad skipper
        "src/content/lyricHandler.js",     // Fourth: Lyric handler
        "src/content/main.js"              // Fifth: Coordinator
      ],
      "css": [
        "content.css",
        "src/css/toolbar.css"
      ]
    }
  ],
  "options_page": "src/options/options.html"
}
```

#### File Structure
```
jugitube/
├── src/
│   ├── css/
│   │   └── toolbar.css           # Toolbar responsiveness styles
│   ├── options/
│   │   ├── options.html          # Settings page UI
│   │   └── options.js            # Settings management logic
│   └── content/
│       ├── settings-apply.js     # Settings loader and CSS applier
│       ├── adSkipper.js          # Ad skip automation
│       ├── lyricHandler.js       # Lyric popup removal
│       └── main.js               # Module coordinator
├── content.js                    # Original AnomTube (unchanged)
├── content.css                   # Original styles (unchanged)
└── manifest.json                 # Updated with new scripts
```

### Behavior Changes

#### Video Blocking Logic
- **Previous**: Video always blocked when AnomTube is enabled
- **New**: Video blocking conditional on `allowVideoKeepAdSettings` setting
- **Benefit**: Users can keep video visible while using ad controls

#### Ad Controls
- **Previous**: Ad controls only worked when AnomTube was enabled
- **New**: Ad skipper works independently based on `autoClickSkips` setting
- **Benefit**: More flexible ad management options

#### Module Independence
- **Settings Apply**: Always runs first to provide settings to other modules
- **Ad Skipper**: Independent of AnomTube enable/disable state
- **Lyric Handler**: Independent of AnomTube enable/disable state
- **Main Coordinator**: Manages video blocking based on combined settings

### Performance Considerations

#### Rate Limiting
- Ad skipper limited to 3 clicks per second
- Prevents performance degradation from excessive click attempts
- Uses timestamp-based rolling window for accurate limiting

#### WeakSet Usage
- Prevents memory leaks from tracking processed elements
- Automatic garbage collection when elements are removed from DOM
- Efficient duplicate prevention without manual cleanup

#### MutationObserver
- Targeted observation of specific DOM changes
- Efficient attribute and childList monitoring
- Batched mutation processing to reduce overhead

### Debugging Features

#### Console Logging
- All modules log initialization status
- Ad skipper logs successful clicks and rate limit events
- Lyric handler logs hidden elements
- Settings changes logged with details

#### Global Variables
- `window.jugitubeSettings`: Current settings object
- `window.jugitubeModules`: Module initialization status
- Accessible via browser console for debugging

#### Debug Commands
```javascript
// Check settings
console.log(window.jugitubeSettings);

// Check modules
console.log(window.jugitubeModules);

// Check CSS variable
getComputedStyle(document.documentElement).getPropertyValue('--jugitube-toolbar-width');

// Check localStorage
localStorage.getItem('jugitube_settings_v1');
```

### Backwards Compatibility
- All original AnomTube functionality preserved
- Existing popup controls unchanged
- Original ad control settings (mute/skip/block) still work
- New features are opt-in via settings page
- Default settings maintain original behavior

### Testing Coverage
- Settings persistence across browser sessions
- CSS variable application and responsiveness
- Ad skipper rate limiting and safety
- Lyric handler mutation observation
- Module initialization order
- Settings change propagation
- Cross-tab communication

### Known Issues
None identified. All features tested and working as expected.

### Future Enhancements
- Sync settings across browsers (chrome.storage.sync)
- Additional toolbar width presets
- Custom CSS variable overrides
- More granular ad skip selectors
- Lyric popup whitelist

---

## Migration Notes

### For Users
- Settings are stored in localStorage (per-browser)
- First launch uses default settings (all disabled)
- Access settings via extension context menu → "Options"

### For Developers
- New src/ directory structure for better organization
- Content scripts load in specific order (see manifest.json)
- Settings must be loaded before other modules can use them
- Use `window.jugitubeSettings` to access settings in content scripts

---

## Credits
- **Implementation**: Jugi @ AnomFIN
- **Architecture**: Modular content script design
- **UI Design**: AnomFIN design system
