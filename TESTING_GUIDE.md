# JugiTube Settings and Features - Test Instructions

## New Features Added

### 1. Settings Page
A new settings page has been added to customize AnomTube behavior.

**Access:** Right-click the extension icon → "Options" (or via chrome://extensions)

### 2. Available Settings

#### Interface Settings
- **Expand Toolbar**: Increases YouTube toolbar minimum width from 220px to 280px
- **Hide Lyric Popup**: Automatically hides YouTube's native lyric popups to avoid conflicts

#### Ad Control Settings
- **Allow Video, Keep Ad Settings**: Keeps video visible while maintaining ad-skipping features
- **Auto-Click Skip Buttons**: Automatically clicks "Skip Ad" buttons when they appear

### 3. Content Scripts Architecture

#### Load Order (as defined in manifest.json):
1. `settings-apply.js` - Loads settings and applies CSS variables
2. `content.js` - Original AnomTube functionality
3. `adSkipper.js` - Ad skipping with rate limiting
4. `lyricHandler.js` - Lyric popup removal
5. `main.js` - Module coordination and initialization

## Testing Instructions

### Test 1: Settings Page
1. Load the extension in Chrome
2. Right-click extension icon → "Options"
3. Verify all checkboxes are visible:
   - Expand Toolbar
   - Hide Lyric Popup
   - Allow Video, Keep Ad Settings
   - Auto-Click Skip Buttons
4. Toggle each checkbox and verify "Settings saved successfully!" message appears
5. Reload the page and verify settings are persisted

### Test 2: Toolbar Width
1. Open the settings page
2. Enable "Expand Toolbar"
3. Navigate to YouTube
4. Open browser DevTools → Console
5. Type: `getComputedStyle(document.documentElement).getPropertyValue('--jugitube-toolbar-width')`
6. Should show `280px` when enabled, `220px` when disabled

### Test 3: Auto-Skip Ads
1. Open settings page
2. Enable "Auto-Click Skip Buttons"
3. Navigate to YouTube and play a video with ads
4. Observe that "Skip Ad" buttons are automatically clicked
5. Check Console for: "JugiTube: Successfully clicked skip button"

### Test 4: Hide Lyric Popups
1. Open settings page
2. Enable "Hide Lyric Popup"
3. Navigate to a YouTube music video
4. Open any YouTube native lyric popup
5. Verify it is automatically hidden
6. Check Console for: "JugiTube: Hidden lyric popup element"

### Test 5: Allow Video Keep Ad Settings
1. Open settings page
2. Enable "Allow Video, Keep Ad Settings"
3. Enable AnomTube in the popup
4. Navigate to YouTube video
5. Verify:
   - Video remains visible (not blocked)
   - Ad controls still work (if enabled)
   - Check Console for: "JugiTube: Video blocking is disabled"

### Test 6: Module Initialization
1. Navigate to YouTube
2. Open DevTools Console
3. Look for initialization messages:
   - "JugiTube: Ad skipper initialized"
   - "JugiTube: Lyric handler initialized"
   - "JugiTube: Main module initializing"
   - "JugiTube: All modules initialized successfully"

### Test 7: Settings Persistence
1. Set all checkboxes to various states
2. Close all YouTube tabs
3. Close the extension options page
4. Reopen options page
5. Verify all settings are preserved

### Test 8: Rate Limiting
1. Enable "Auto-Click Skip Buttons"
2. Navigate to YouTube with multiple ads
3. Check Console for rate limit messages if more than 3 clicks/second attempted
4. Verify: "JugiTube: Rate limit reached for ad skipping"

## Debug Commands

### Check Settings in Console
```javascript
// Check current settings
console.log(window.jugitubeSettings);

// Check localStorage
console.log(localStorage.getItem('jugitube_settings_v1'));

// Check modules status
console.log(window.jugitubeModules);

// Check CSS variable
console.log(getComputedStyle(document.documentElement).getPropertyValue('--jugitube-toolbar-width'));
```

## Expected Behaviors

### When AnomTube is ENABLED
- Video blocking active (unless "Allow Video, Keep Ad Settings" is checked)
- Lyrics display works normally
- Ad controls work based on popup settings (mute/skip/block)
- Auto-skip works if "Auto-Click Skip Buttons" is enabled

### When AnomTube is DISABLED
- No video blocking
- Original YouTube experience
- Ad skipper and lyric handler still work based on settings

### Settings Independence
- Ad skipper works independently of AnomTube enable/disable state
- Lyric handler works independently of AnomTube enable/disable state
- Video blocking depends on both AnomTube state AND "Allow Video, Keep Ad Settings"

## Known Limitations

1. **Rate Limiting**: Ad skipper is rate-limited to 3 clicks per second to prevent performance issues
2. **MutationObserver**: Uses MutationObserver which may impact performance on slower devices
3. **localStorage**: Settings stored in localStorage (not synced across browsers)
4. **CSS Variable**: Toolbar width uses CSS custom properties (modern browsers only)

## Troubleshooting

### Settings not saving
- Check browser console for errors
- Verify localStorage is enabled
- Try clearing localStorage and reloading

### Ad skipper not working
- Verify "Auto-Click Skip Buttons" is enabled in settings
- Check console for initialization messages
- YouTube may have changed their HTML structure

### Toolbar width not changing
- Check if CSS variable is applied: `getComputedStyle(document.documentElement).getPropertyValue('--jugitube-toolbar-width')`
- Verify toolbar.css is loaded in DevTools → Sources

### Modules not initializing
- Check console for error messages
- Verify all content scripts are loaded in DevTools → Sources
- Check manifest.json content_scripts order
